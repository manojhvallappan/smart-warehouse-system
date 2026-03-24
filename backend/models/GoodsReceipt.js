const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GoodsReceipt = sequelize.define('GoodsReceipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  grn_number: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'suppliers', key: 'id' },
  },
  received_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  received_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('pending', 'inspecting', 'accepted', 'rejected', 'partial'),
    defaultValue: 'pending',
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'products', key: 'id' },
  },
  expected_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  received_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'warehouse_locations', key: 'id' },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'goods_receipts',
});

module.exports = GoodsReceipt;
