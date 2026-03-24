import { useState, useEffect } from 'react';
import api from '../api/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  MdInventory, MdShoppingCart, MdLocalShipping, MdWarehouse,
  MdTrendingUp, MdWarning, MdAttachMoney, MdPendingActions
} from 'react-icons/md';

const COLORS = ['#4f8cff', '#22c55e', '#f59e42', '#ef4444', '#a855f7', '#06b6d4', '#ec4899'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/inventory/low-stock'),
    ]).then(([dashRes, lsRes]) => {
      setData(dashRes.data);
      setLowStock(lsRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader">Loading dashboard...</div>;
  if (!data) return <div className="page-error">Failed to load dashboard</div>;

  const kpis = [
    { label: 'Total Products', value: data.totalProducts, icon: <MdInventory />, color: '#4f8cff' },
    { label: 'Total Orders', value: data.totalOrders, icon: <MdShoppingCart />, color: '#22c55e' },
    { label: 'Pending Orders', value: data.pendingOrders, icon: <MdPendingActions />, color: '#f59e42' },
    { label: 'Locations', value: data.totalLocations, icon: <MdWarehouse />, color: '#a855f7' },
    { label: 'Revenue', value: `$${parseFloat(data.revenue).toLocaleString()}`, icon: <MdAttachMoney />, color: '#06b6d4' },
    { label: 'Inventory Value', value: `$${parseFloat(data.inventoryValue).toLocaleString()}`, icon: <MdTrendingUp />, color: '#ec4899' },
    { label: 'Low Stock Items', value: data.lowStockCount, icon: <MdWarning />, color: '#ef4444' },
    { label: 'Orders (7d)', value: data.recentOrders, icon: <MdLocalShipping />, color: '#f97316' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Real-time warehouse overview</p>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div className="kpi-card" key={kpi.label}>
            <div className="kpi-icon" style={{ background: kpi.color + '18', color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{kpi.value}</span>
              <span className="kpi-label">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Orders & Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis dataKey="month" stroke="#8b92a5" tick={{ fontSize: 12 }} />
              <YAxis stroke="#8b92a5" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2f3e', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="count" name="Orders" fill="#4f8cff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenue ($)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Orders by Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.ordersByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%" cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={3}
                label={({ status, count }) => `${status} (${count})`}
              >
                {data.ordersByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top Products by Sales</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis type="number" stroke="#8b92a5" />
              <YAxis dataKey="product.name" type="category" stroke="#8b92a5" width={120} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2f3e', borderRadius: 8 }} />
              <Bar dataKey="total_sold" name="Units Sold" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="alert-header">
            <MdWarning style={{ color: '#ef4444' }} /> Low Stock Alerts
          </h3>
          <div className="alert-list">
            {lowStock.length === 0 ? (
              <p className="no-data">All stock levels are healthy!</p>
            ) : (
              lowStock.slice(0, 8).map((item) => (
                <div className="alert-item" key={item.id}>
                  <div>
                    <strong>{item.product?.name}</strong>
                    <span className="alert-sku">{item.product?.sku}</span>
                  </div>
                  <div className="alert-qty">
                    <span className={`badge ${item.quantity <= 5 ? 'badge-danger' : 'badge-warning'}`}>
                      {item.quantity} left
                    </span>
                    <span className="alert-reorder">Reorder: {item.product?.reorder_level}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
