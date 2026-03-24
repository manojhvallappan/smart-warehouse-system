const express = require('express');
const { Order, OrderItem, Product, Inventory, WarehouseLocation, StockMovement, sequelize } = require('../models');
const authenticate = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Helper: cross-dialect month extraction
const monthExpr = () => {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    return sequelize.fn('to_char', sequelize.col('created_at'), 'YYYY-MM');
  }
  // SQLite
  return sequelize.fn('strftime', '%Y-%m', sequelize.col('created_at'));
};

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const totalProducts = await Product.count({ where: { is_active: true } });
    const totalOrders = await Order.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const totalLocations = await WarehouseLocation.count({ where: { is_active: true } });

    // Revenue
    const revenue = await Order.sum('total_amount', {
      where: { status: { [Op.notIn]: ['cancelled'] } },
    }) || 0;

    // Inventory value
    const inventory = await Inventory.findAll({
      include: [{ model: Product, as: 'product', attributes: ['price'] }],
    });
    const inventoryValue = inventory.reduce(
      (sum, item) => sum + item.quantity * parseFloat(item.product?.price || 0),
      0
    );

    // Low stock count
    const lowStockCount = inventory.filter(
      (item) => item.quantity <= 10
    ).length;

    // Recent orders (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.count({ where: { created_at: { [Op.gte]: weekAgo } } });

    // Orders by status
    const ordersByStatus = await Order.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    // Monthly orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const mExpr = monthExpr();
    const monthlyOrders = await Order.findAll({
      attributes: [
        [mExpr, 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      where: { created_at: { [Op.gte]: sixMonthsAgo } },
      group: [sequelize.literal('"month"')],
      order: [[sequelize.literal('"month"'), 'ASC']],
      raw: true,
    });

    // Top 5 products by order count
    const topProducts = await OrderItem.findAll({
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('OrderItem.quantity')), 'total_sold'],
      ],
      include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }],
      group: ['product_id'],
      order: [[sequelize.literal('"total_sold"'), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalLocations,
      revenue: parseFloat(revenue).toFixed(2),
      inventoryValue: inventoryValue.toFixed(2),
      lowStockCount,
      recentOrders,
      ordersByStatus,
      monthlyOrders,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/inventory-turnover
router.get('/inventory-turnover', authenticate, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      include: [
        { model: Inventory, as: 'inventoryItems' },
        { model: OrderItem, as: 'orderItems' },
      ],
    });

    const turnover = products.map((product) => {
      const totalStock = product.inventoryItems.reduce((s, i) => s + i.quantity, 0);
      const totalSold = product.orderItems.reduce((s, i) => s + i.quantity, 0);
      const avgInventory = totalStock > 0 ? totalStock : 1;
      const ratio = totalSold / avgInventory;

      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: totalStock,
        totalSold,
        turnoverRatio: ratio.toFixed(2),
      };
    });

    turnover.sort((a, b) => parseFloat(b.turnoverRatio) - parseFloat(a.turnoverRatio));
    res.json(turnover);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/fulfillment-time
router.get('/fulfillment-time', authenticate, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { status: 'delivered' },
      attributes: ['id', 'order_number', 'created_at', 'updated_at'],
    });

    const times = orders.map((o) => {
      const created = new Date(o.created_at);
      const delivered = new Date(o.updated_at);
      const hours = ((delivered - created) / (1000 * 60 * 60)).toFixed(1);
      return { orderId: o.id, orderNumber: o.order_number, fulfillmentHours: parseFloat(hours) };
    });

    const avgTime = times.length > 0
      ? (times.reduce((s, t) => s + t.fulfillmentHours, 0) / times.length).toFixed(1)
      : 0;

    res.json({ averageFulfillmentHours: parseFloat(avgTime), orders: times });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/demand-forecast
router.get('/demand-forecast', authenticate, async (req, res) => {
  try {
    // Simple exponential smoothing forecast based on monthly orders
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const mExpr = monthExpr();
    const monthlyData = await Order.findAll({
      attributes: [
        [mExpr, 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      where: { created_at: { [Op.gte]: twelveMonthsAgo } },
      group: [sequelize.literal('"month"')],
      order: [[sequelize.literal('"month"'), 'ASC']],
      raw: true,
    });

    // Exponential smoothing (alpha = 0.3)
    const alpha = 0.3;
    const values = monthlyData.map((d) => parseInt(d.order_count));
    const forecast = [];
    let smoothed = values.length > 0 ? values[0] : 0;

    for (let i = 0; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
      forecast.push({
        month: monthlyData[i].month,
        actual: values[i],
        forecast: Math.round(smoothed),
        revenue: parseFloat(monthlyData[i].revenue || 0),
      });
    }

    // Predict next 3 months
    const predictions = [];
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(now);
      futureDate.setMonth(now.getMonth() + i);
      const label = futureDate.toISOString().slice(0, 7);
      predictions.push({ month: label, forecast: Math.round(smoothed), actual: null });
    }

    res.json({ historical: forecast, predictions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
