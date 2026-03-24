const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Supplier = require('./Supplier');
const WarehouseLocation = require('./WarehouseLocation');
const Inventory = require('./Inventory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Shipment = require('./Shipment');
const GoodsReceipt = require('./GoodsReceipt');
const StockMovement = require('./StockMovement');

// ─── Associations ────────────────────────────────────────

// Inventory ↔ Product, Location
Product.hasMany(Inventory, { foreignKey: 'product_id', as: 'inventoryItems' });
Inventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

WarehouseLocation.hasMany(Inventory, { foreignKey: 'location_id', as: 'inventoryItems' });
Inventory.belongsTo(WarehouseLocation, { foreignKey: 'location_id', as: 'location' });

// Order ↔ OrderItem ↔ Product
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order ↔ Worker
User.hasMany(Order, { foreignKey: 'assigned_worker_id', as: 'assignedOrders' });
Order.belongsTo(User, { foreignKey: 'assigned_worker_id', as: 'assignedWorker' });

// Order ↔ Shipment
Order.hasOne(Shipment, { foreignKey: 'order_id', as: 'shipment' });
Shipment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// GoodsReceipt ↔ Supplier, Product, User, Location
Supplier.hasMany(GoodsReceipt, { foreignKey: 'supplier_id', as: 'goodsReceipts' });
GoodsReceipt.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

Product.hasMany(GoodsReceipt, { foreignKey: 'product_id', as: 'goodsReceipts' });
GoodsReceipt.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(GoodsReceipt, { foreignKey: 'received_by', as: 'receivedGoods' });
GoodsReceipt.belongsTo(User, { foreignKey: 'received_by', as: 'receiver' });

WarehouseLocation.hasMany(GoodsReceipt, { foreignKey: 'location_id', as: 'goodsReceipts' });
GoodsReceipt.belongsTo(WarehouseLocation, { foreignKey: 'location_id', as: 'location' });

// StockMovement ↔ Product, Location, User
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'stockMovements' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

WarehouseLocation.hasMany(StockMovement, { foreignKey: 'from_location_id', as: 'outgoingMovements' });
StockMovement.belongsTo(WarehouseLocation, { foreignKey: 'from_location_id', as: 'fromLocation' });

WarehouseLocation.hasMany(StockMovement, { foreignKey: 'to_location_id', as: 'incomingMovements' });
StockMovement.belongsTo(WarehouseLocation, { foreignKey: 'to_location_id', as: 'toLocation' });

User.hasMany(StockMovement, { foreignKey: 'user_id', as: 'stockMovements' });
StockMovement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Product,
  Supplier,
  WarehouseLocation,
  Inventory,
  Order,
  OrderItem,
  Shipment,
  GoodsReceipt,
  StockMovement,
};
