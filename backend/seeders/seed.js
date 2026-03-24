require('dotenv').config();
const { sequelize, User, Product, Supplier, WarehouseLocation, Inventory, Order, OrderItem, GoodsReceipt, StockMovement, Shipment } = require('../models');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ force: true });
    console.log('Tables recreated');

    // ── Users ──
    const admin = await User.create({ name: 'Admin User', email: 'admin@warehouse.com', password: 'password123', role: 'admin' });
    const manager = await User.create({ name: 'John Manager', email: 'manager@warehouse.com', password: 'password123', role: 'manager' });
    const worker1 = await User.create({ name: 'Alice Worker', email: 'alice@warehouse.com', password: 'password123', role: 'worker' });
    const worker2 = await User.create({ name: 'Bob Worker', email: 'bob@warehouse.com', password: 'password123', role: 'worker' });
    console.log('✅ Users seeded');

    // ── Suppliers ──
    const supplier1 = await Supplier.create({ name: 'TechParts Global', contact_person: 'Mike Chen', email: 'mike@techparts.com', phone: '+1-555-0101', address: '123 Tech Avenue, San Jose, CA' });
    const supplier2 = await Supplier.create({ name: 'PackRight Materials', contact_person: 'Sarah Lee', email: 'sarah@packright.com', phone: '+1-555-0102', address: '456 Industry Blvd, Chicago, IL' });
    const supplier3 = await Supplier.create({ name: 'QuickShip Supplies', contact_person: 'David Kim', email: 'david@quickship.com', phone: '+1-555-0103', address: '789 Logistics Way, Dallas, TX' });
    console.log('✅ Suppliers seeded');

    // ── Products ──
    const products = await Product.bulkCreate([
      { name: 'Wireless Mouse', sku: 'WM-001', category: 'Electronics', barcode: '8901234001', price: 29.99, cost_price: 15.00, weight: 0.15, unit: 'pcs', reorder_level: 20 },
      { name: 'Mechanical Keyboard', sku: 'KB-002', category: 'Electronics', barcode: '8901234002', price: 89.99, cost_price: 45.00, weight: 0.8, unit: 'pcs', reorder_level: 15 },
      { name: 'USB-C Hub', sku: 'HB-003', category: 'Electronics', barcode: '8901234003', price: 49.99, cost_price: 22.00, weight: 0.12, unit: 'pcs', reorder_level: 25 },
      { name: 'Monitor Stand', sku: 'MS-004', category: 'Accessories', barcode: '8901234004', price: 39.99, cost_price: 18.00, weight: 2.5, unit: 'pcs', reorder_level: 10 },
      { name: 'Laptop Sleeve 15"', sku: 'LS-005', category: 'Accessories', barcode: '8901234005', price: 24.99, cost_price: 10.00, weight: 0.3, unit: 'pcs', reorder_level: 30 },
      { name: 'Webcam HD', sku: 'WC-006', category: 'Electronics', barcode: '8901234006', price: 59.99, cost_price: 28.00, weight: 0.18, unit: 'pcs', reorder_level: 12 },
      { name: 'Desk Lamp LED', sku: 'DL-007', category: 'Office', barcode: '8901234007', price: 34.99, cost_price: 16.00, weight: 1.2, unit: 'pcs', reorder_level: 15 },
      { name: 'Cable Management Kit', sku: 'CK-008', category: 'Accessories', barcode: '8901234008', price: 19.99, cost_price: 8.00, weight: 0.5, unit: 'kit', reorder_level: 20 },
      { name: 'Ergonomic Chair Pad', sku: 'EP-009', category: 'Office', barcode: '8901234009', price: 44.99, cost_price: 20.00, weight: 1.8, unit: 'pcs', reorder_level: 8 },
      { name: 'Noise Cancelling Headset', sku: 'NH-010', category: 'Electronics', barcode: '8901234010', price: 129.99, cost_price: 60.00, weight: 0.35, unit: 'pcs', reorder_level: 10 },
      { name: 'Power Strip 6-Outlet', sku: 'PS-011', category: 'Electronics', barcode: '8901234011', price: 15.99, cost_price: 7.00, weight: 0.6, unit: 'pcs', reorder_level: 25 },
      { name: 'Document Scanner', sku: 'DS-012', category: 'Office', barcode: '8901234012', price: 199.99, cost_price: 95.00, weight: 3.5, unit: 'pcs', reorder_level: 5 },
    ]);
    console.log('✅ Products seeded');

    // ── Warehouse Locations ──
    const locations = [];
    const zones = ['A', 'B', 'C'];
    for (const zone of zones) {
      for (let rack = 1; rack <= 3; rack++) {
        for (let shelf = 1; shelf <= 3; shelf++) {
          for (let bin = 1; bin <= 2; bin++) {
            locations.push(
              await WarehouseLocation.create({
                rack: `${zone}${rack}`,
                shelf: `S${shelf}`,
                bin: `B${bin}`,
                capacity: 100 + Math.floor(Math.random() * 200),
                current_occupancy: Math.floor(Math.random() * 80),
                zone: `Zone ${zone}`,
              })
            );
          }
        }
      }
    }
    console.log(`✅ ${locations.length} Warehouse locations seeded`);

    // ── Inventory ──
    for (let i = 0; i < products.length; i++) {
      const loc = locations[i % locations.length];
      await Inventory.create({
        product_id: products[i].id,
        location_id: loc.id,
        quantity: 10 + Math.floor(Math.random() * 90),
        min_quantity: 5,
        max_quantity: 200,
      });
    }
    console.log('✅ Inventory seeded');

    // ── Orders ──
    const statuses = ['pending', 'confirmed', 'picking', 'packing', 'shipped', 'delivered'];
    const customers = [
      { name: 'Acme Corp', email: 'orders@acmecorp.com', phone: '+1-555-1001' },
      { name: 'GlobalTech Inc', email: 'purchase@globaltech.com', phone: '+1-555-1002' },
      { name: 'SmallBiz LLC', email: 'admin@smallbiz.com', phone: '+1-555-1003' },
      { name: 'MegaMart', email: 'procurement@megamart.com', phone: '+1-555-1004' },
      { name: 'StartupXYZ', email: 'ops@startupxyz.com', phone: '+1-555-1005' },
    ];

    for (let i = 0; i < 15; i++) {
      const cust = customers[i % customers.length];
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 60));

      const order = await Order.create({
        order_number: `ORD-${orderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${1000 + i}`,
        customer_name: cust.name,
        customer_email: cust.email,
        customer_phone: cust.phone,
        shipping_address: '123 Business Street',
        order_date: orderDate,
        status: statuses[i % statuses.length],
        assigned_worker_id: i % 2 === 0 ? worker1.id : worker2.id,
      });

      let total = 0;
      const numItems = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numItems; j++) {
        const product = products[(i + j) % products.length];
        const qty = 1 + Math.floor(Math.random() * 5);
        const price = parseFloat(product.price);
        total += price * qty;
        await OrderItem.create({
          order_id: order.id,
          product_id: product.id,
          quantity: qty,
          unit_price: price,
        });
      }
      await order.update({ total_amount: total.toFixed(2) });
    }
    console.log('✅ Orders seeded');

    // ── Goods Receipts ──
    for (let i = 0; i < 5; i++) {
      const rcvDate = new Date();
      rcvDate.setDate(rcvDate.getDate() - Math.floor(Math.random() * 30));
      await GoodsReceipt.create({
        grn_number: `GRN-${rcvDate.toISOString().slice(0, 10).replace(/-/g, '')}-${2000 + i}`,
        supplier_id: [supplier1.id, supplier2.id, supplier3.id][i % 3],
        received_by: admin.id,
        received_date: rcvDate,
        status: ['accepted', 'pending', 'inspecting'][i % 3],
        product_id: products[i].id,
        expected_quantity: 50 + Math.floor(Math.random() * 100),
        received_quantity: 40 + Math.floor(Math.random() * 60),
        location_id: locations[i].id,
      });
    }
    console.log('✅ Goods receipts seeded');

    // ── Stock Movements ──
    for (let i = 0; i < 10; i++) {
      const movDate = new Date();
      movDate.setDate(movDate.getDate() - Math.floor(Math.random() * 30));
      await StockMovement.create({
        product_id: products[i % products.length].id,
        from_location_id: i % 2 === 0 ? locations[0].id : locations[1].id,
        to_location_id: i % 2 === 0 ? locations[2].id : locations[3].id,
        quantity: 5 + Math.floor(Math.random() * 20),
        movement_type: ['inbound', 'outbound', 'transfer', 'adjustment'][i % 4],
        user_id: admin.id,
        notes: `Seed movement #${i + 1}`,
        created_at: movDate,
      });
    }
    console.log('✅ Stock movements seeded');

    // ── Shipments ──
    for (let i = 0; i < 5; i++) {
      const dispDate = new Date();
      dispDate.setDate(dispDate.getDate() - Math.floor(Math.random() * 15));
      await Shipment.create({
        order_id: i + 1,
        shipment_number: `SHP-${dispDate.toISOString().slice(0, 10).replace(/-/g, '')}-${3000 + i}`,
        carrier: ['FedEx', 'UPS', 'DHL', 'USPS', 'BlueDart'][i],
        tracking_number: `TRK${100000 + i}`,
        status: ['dispatched', 'in_transit', 'delivered', 'preparing', 'dispatched'][i],
        dispatch_date: dispDate,
      });
    }
    console.log('✅ Shipments seeded');

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
