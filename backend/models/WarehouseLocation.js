const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WarehouseLocation = sequelize.define('WarehouseLocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  rack: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  shelf: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  bin: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  label: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.rack}-${this.shelf}-${this.bin}`;
    },
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  current_occupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  zone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'warehouse_locations',
  indexes: [
    {
      unique: true,
      fields: ['rack', 'shelf', 'bin'],
    },
  ],
});

module.exports = WarehouseLocation;
