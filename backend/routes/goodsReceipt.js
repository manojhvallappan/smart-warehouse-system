const express = require('express');
const { GoodsReceipt, Supplier, Product, User, WarehouseLocation, Inventory, StockMovement, sequelize } = require('../models');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

const generateGrnNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GRN-${date}-${rand}`;
};

// GET /api/goods-receipt
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { rows: receipts, count: total } = await GoodsReceipt.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: User, as: 'receiver', attributes: ['id', 'name'] },
        { model: WarehouseLocation, as: 'location', attributes: ['id', 'rack', 'shelf', 'bin'] },
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
    });
    res.json({ receipts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/goods-receipt
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const receipt = await GoodsReceipt.create({
      ...req.body,
      grn_number: generateGrnNumber(),
      received_by: req.user.id,
    });

    const full = await GoodsReceipt.findByPk(receipt.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Product, as: 'product' },
        { model: User, as: 'receiver' },
      ],
    });
    res.status(201).json(full);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/goods-receipt/:id/accept
router.put('/:id/accept', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const receipt = await GoodsReceipt.findByPk(req.params.id, { transaction: t });
    if (!receipt) {
      await t.rollback();
      return res.status(404).json({ error: 'GRN not found' });
    }

    const receivedQty = req.body.received_quantity || receipt.expected_quantity;
    const locationId = req.body.location_id || receipt.location_id;

    await receipt.update(
      { status: 'accepted', received_quantity: receivedQty, location_id: locationId },
      { transaction: t }
    );

    // Update inventory
    if (locationId) {
      const [inv] = await Inventory.findOrCreate({
        where: { product_id: receipt.product_id, location_id: locationId },
        defaults: { quantity: 0 },
        transaction: t,
      });
      await inv.update({ quantity: inv.quantity + receivedQty }, { transaction: t });

      // Update location occupancy
      const loc = await WarehouseLocation.findByPk(locationId, { transaction: t });
      if (loc) {
        await loc.update(
          { current_occupancy: loc.current_occupancy + receivedQty },
          { transaction: t }
        );
      }

      // Track movement
      await StockMovement.create(
        {
          product_id: receipt.product_id,
          to_location_id: locationId,
          quantity: receivedQty,
          movement_type: 'inbound',
          reference_type: 'goods_receipt',
          reference_id: receipt.id,
          user_id: req.user.id,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.json(receipt);
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
