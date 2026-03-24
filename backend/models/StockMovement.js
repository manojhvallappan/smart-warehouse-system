const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
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
  from_location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'warehouse_locations', key: 'id' },
  },
  to_location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'warehouse_locations', key: 'id' },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  movement_type: {
    type: DataTypes.ENUM('inbound', 'outbound', 'transfer', 'adjustment'),
    allowNull: false,
  },
  reference_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  reference_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'stock_movements',
});

module.exports = StockMovement;
