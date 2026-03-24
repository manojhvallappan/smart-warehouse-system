const express = require('express');
const { Supplier } = require('../models');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// GET /api/suppliers
router.get('/', authenticate, async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/suppliers
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await supplier.update(req.body);
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    await supplier.update({ is_active: false });
    res.json({ message: 'Supplier deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
