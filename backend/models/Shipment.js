const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
  },
  shipment_number: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
  },
  carrier: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('preparing', 'dispatched', 'in_transit', 'delivered', 'returned'),
    defaultValue: 'preparing',
  },
  dispatch_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estimated_delivery: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  actual_delivery: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  weight: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'shipments',
});

module.exports = Shipment;
