const express = require('express');
const { StockMovement, Product, WarehouseLocation, User } = require('../models');
const authenticate = require('../middleware/auth');

const router = express.Router();

// GET /api/stock-movements
router.get('/', authenticate, async (req, res) => {
  try {
    const { product_id, movement_type, page = 1, limit = 30 } = req.query;
    const where = {};
    if (product_id) where.product_id = product_id;
    if (movement_type) where.movement_type = movement_type;

    const offset = (page - 1) * limit;
    const { rows: movements, count: total } = await StockMovement.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: WarehouseLocation, as: 'fromLocation', attributes: ['id', 'rack', 'shelf', 'bin'] },
        { model: WarehouseLocation, as: 'toLocation', attributes: ['id', 'rack', 'shelf', 'bin'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
    });
    res.json({ movements, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
