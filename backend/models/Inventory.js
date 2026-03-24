const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'products', key: 'id' },
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'warehouse_locations', key: 'id' },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  min_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  max_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
  },
}, {
  tableName: 'inventory',
  indexes: [
    {
      unique: true,
      fields: ['product_id', 'location_id'],
    },
  ],
});

module.exports = Inventory;
