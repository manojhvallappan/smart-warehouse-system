const express = require('express');
const { WarehouseLocation, Inventory, Product } = require('../models');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/warehouse
router.get('/', authenticate, async (req, res) => {
  try {
    const { zone, page = 1, limit = 50 } = req.query;
    const where = { is_active: true };
    if (zone) where.zone = zone;

    const offset = (page - 1) * limit;
    const { rows: locations, count: total } = await WarehouseLocation.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['rack', 'ASC'], ['shelf', 'ASC'], ['bin', 'ASC']],
    });
    res.json({ locations, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/warehouse/utilization
router.get('/utilization', authenticate, async (req, res) => {
  try {
    const locations = await WarehouseLocation.findAll({ where: { is_active: true } });
    const totalCapacity = locations.reduce((s, l) => s + l.capacity, 0);
    const totalOccupancy = locations.reduce((s, l) => s + l.current_occupancy, 0);
    const utilizationRate = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(2) : 0;

    const heatmap = locations.map((loc) => ({
      id: loc.id,
      rack: loc.rack,
      shelf: loc.shelf,
      bin: loc.bin,
      zone: loc.zone,
      capacity: loc.capacity,
      occupancy: loc.current_occupancy,
      utilization: loc.capacity > 0 ? ((loc.current_occupancy / loc.capacity) * 100).toFixed(1) : 0,
    }));

    res.json({ totalCapacity, totalOccupancy, utilizationRate, heatmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/warehouse/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const location = await WarehouseLocation.findByPk(req.params.id, {
      include: [
        {
          model: Inventory,
          as: 'inventoryItems',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
        },
      ],
    });
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/warehouse
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  [
    body('rack').trim().notEmpty(),
    body('shelf').trim().notEmpty(),
    body('bin').trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const location = await WarehouseLocation.create(req.body);
      res.status(201).json(location);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'Location already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/warehouse/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const location = await WarehouseLocation.findByPk(req.params.id);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    await location.update(req.body);
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/warehouse/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const location = await WarehouseLocation.findByPk(req.params.id);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    await location.update({ is_active: false });
    res.json({ message: 'Location deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
