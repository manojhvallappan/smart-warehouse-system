const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  sku: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  barcode: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  cost_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  weight: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'pcs',
  },
  reorder_level: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'products',
});

module.exports = Product;
