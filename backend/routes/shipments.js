const express = require('express');
const { Shipment, Order } = require('../models');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { Op } = require('sequelize');

const router = express.Router();

const generateShipmentNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SHP-${date}-${rand}`;
};

// GET /api/shipments
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const offset = (page - 1) * limit;
    const { rows: shipments, count: total } = await Shipment.findAndCountAll({
      where,
      include: [{ model: Order, as: 'order', attributes: ['id', 'order_number', 'customer_name', 'status'] }],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
    });
    res.json({ shipments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/shipments/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id, {
      include: [{ model: Order, as: 'order' }],
    });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/shipments
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { order_id, carrier, tracking_number, estimated_delivery, weight, notes } = req.body;
    const order = await Order.findByPk(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const shipment = await Shipment.create({
      order_id,
      shipment_number: generateShipmentNumber(),
      carrier,
      tracking_number,
      estimated_delivery,
      weight,
      notes,
      status: 'preparing',
    });

    await order.update({ status: 'shipped' });
    res.status(201).json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/shipments/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const updateData = { status: req.body.status };
    if (req.body.status === 'dispatched') updateData.dispatch_date = new Date();
    if (req.body.status === 'delivered') {
      updateData.actual_delivery = new Date();
      const order = await Order.findByPk(shipment.order_id);
      if (order) await order.update({ status: 'delivered' });
    }

    await shipment.update(updateData);
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
