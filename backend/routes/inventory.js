const express = require('express');
const { Inventory, Product, WarehouseLocation, StockMovement, sequelize } = require('../models');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { Op } = require('sequelize');

const router = express.Router();

// GET /api/inventory
router.get('/', authenticate, async (req, res) => {
  try {
    const { product_id, location_id, low_stock, page = 1, limit = 20 } = req.query;
    const where = {};
    if (product_id) where.product_id = product_id;
    if (location_id) where.location_id = location_id;

    const offset = (page - 1) * limit;
    const queryOptions = {
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category', 'reorder_level'] },
        { model: WarehouseLocation, as: 'location', attributes: ['id', 'rack', 'shelf', 'bin', 'zone'] },
      ],
      offset,
      limit: parseInt(limit),
      order: [['updated_at', 'DESC']],
    };

    let { rows: items, count: total } = await Inventory.findAndCountAll(queryOptions);

    // Filter low stock on app level
    if (low_stock === 'true') {
      items = items.filter(
        (item) => item.quantity <= (item.product?.reorder_level || 10)
      );
      total = items.length;
    }

    res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const totalItems = await Inventory.count();
    const totalQuantity = await Inventory.sum('quantity') || 0;

    // Low stock items
    const allInventory = await Inventory.findAll({
      include: [{ model: Product, as: 'product', attributes: ['reorder_level', 'price'] }],
    });

    const lowStockCount = allInventory.filter(
      (item) => item.quantity <= (item.product?.reorder_level || 10)
    ).length;

    const totalValue = allInventory.reduce(
      (sum, item) => sum + item.quantity * parseFloat(item.product?.price || 0),
      0
    );

    res.json({ totalItems, totalQuantity, lowStockCount, totalValue: totalValue.toFixed(2) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const inventory = await Inventory.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'category', 'reorder_level', 'price'] },
        { model: WarehouseLocation, as: 'location', attributes: ['id', 'rack', 'shelf', 'bin'] },
      ],
    });

    const lowStock = inventory.filter(
      (item) => item.quantity <= (item.product?.reorder_level || 10)
    );

    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/abc-analysis
router.get('/abc-analysis', authenticate, async (req, res) => {
  try {
    const inventory = await Inventory.findAll({
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'price'] }],
    });

    const items = inventory.map((item) => ({
      productId: item.product_id,
      name: item.product?.name,
      sku: item.product?.sku,
      quantity: item.quantity,
      unitValue: parseFloat(item.product?.price || 0),
      totalValue: item.quantity * parseFloat(item.product?.price || 0),
    }));

    items.sort((a, b) => b.totalValue - a.totalValue);

    const grandTotal = items.reduce((s, i) => s + i.totalValue, 0);
    let cumulative = 0;

    const classified = items.map((item) => {
      cumulative += item.totalValue;
      const percentage = grandTotal > 0 ? (cumulative / grandTotal) * 100 : 0;
      let category;
      if (percentage <= 80) category = 'A';
      else if (percentage <= 95) category = 'B';
      else category = 'C';
      return { ...item, cumulativePercentage: percentage.toFixed(2), category };
    });

    const summary = {
      A: classified.filter((i) => i.category === 'A').length,
      B: classified.filter((i) => i.category === 'B').length,
      C: classified.filter((i) => i.category === 'C').length,
    };

    res.json({ items: classified, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { product_id, location_id, quantity, min_quantity, max_quantity } = req.body;
    const [item, created] = await Inventory.findOrCreate({
      where: { product_id, location_id },
      defaults: { quantity, min_quantity, max_quantity },
    });

    if (!created) {
      await item.update({ quantity: item.quantity + (quantity || 0) });
    }

    // Track movement
    await StockMovement.create({
      product_id,
      to_location_id: location_id,
      quantity: quantity || 0,
      movement_type: 'inbound',
      reference_type: 'manual',
      user_id: req.user.id,
    });

    const full = await Inventory.findByPk(item.id, {
      include: [
        { model: Product, as: 'product' },
        { model: WarehouseLocation, as: 'location' },
      ],
    });

    res.status(201).json(full);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Inventory record not found' });

    const oldQty = item.quantity;
    await item.update(req.body);

    if (req.body.quantity !== undefined && req.body.quantity !== oldQty) {
      await StockMovement.create({
        product_id: item.product_id,
        to_location_id: item.location_id,
        quantity: Math.abs(req.body.quantity - oldQty),
        movement_type: 'adjustment',
        user_id: req.user.id,
        notes: `Adjusted from ${oldQty} to ${req.body.quantity}`,
      });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const item = await Inventory.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Inventory record not found' });
    await item.destroy();
    res.json({ message: 'Inventory record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
