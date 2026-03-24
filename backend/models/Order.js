const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_number: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
  },
  customer_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  customer_email: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  customer_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'picking', 'packing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  total_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assigned_worker_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'orders',
});

module.exports = Order;
