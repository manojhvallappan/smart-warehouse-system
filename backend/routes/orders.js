const express = require('express');
const { Order, OrderItem, Product, User, Inventory, StockMovement, sequelize } = require('../models');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { Op } = require('sequelize');

const router = express.Router();

// Generate order number
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${rand}`;
};

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { customer_name: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'name'] },
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
    });
    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: User, as: 'assignedWorker', attributes: ['id', 'name'] },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customer_name, customer_email, customer_phone, shipping_address, items, notes } = req.body;

    const order = await Order.create(
      {
        order_number: generateOrderNumber(),
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        notes,
        status: 'pending',
      },
      { transaction: t }
    );

    let totalAmount = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (!product) throw new Error(`Product ${item.product_id} not found`);
        const unitPrice = parseFloat(product.price);
        totalAmount += unitPrice * item.quantity;
        await OrderItem.create(
          {
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: unitPrice,
          },
          { transaction: t }
        );
      }
    }

    await order.update({ total_amount: totalAmount }, { transaction: t });
    await t.commit();

    const full = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      ],
    });
    res.status(201).json(full);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
      transaction: t,
    });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status, assigned_worker_id } = req.body;
    const updateData = { status };
    if (assigned_worker_id) updateData.assigned_worker_id = assigned_worker_id;

    // When status changes to "shipped", decrease inventory
    if (status === 'shipped' && order.status !== 'shipped') {
      for (const item of order.items) {
        const inv = await Inventory.findOne({
          where: { product_id: item.product_id },
          transaction: t,
        });
        if (inv) {
          await inv.update(
            { quantity: Math.max(0, inv.quantity - item.quantity) },
            { transaction: t }
          );
          await StockMovement.create(
            {
              product_id: item.product_id,
              from_location_id: inv.location_id,
              quantity: item.quantity,
              movement_type: 'outbound',
              reference_type: 'order',
              reference_id: order.id,
              user_id: req.user.id,
            },
            { transaction: t }
          );
        }
      }
    }

    await order.update(updateData, { transaction: t });
    await t.commit();
    res.json(order);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot delete shipped/delivered orders' });
    }
    await OrderItem.destroy({ where: { order_id: order.id } });
    await order.destroy();
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
