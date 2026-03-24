import { useState, useEffect } from 'react';
import api from '../api/client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { MdTrendingUp, MdTimer, MdInsights } from 'react-icons/md';

export default function Analytics() {
  const [turnover, setTurnover] = useState([]);
  const [fulfillment, setFulfillment] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [tab, setTab] = useState('turnover');

  useEffect(() => {
    api.get('/analytics/inventory-turnover').then((res) => setTurnover(res.data)).catch(console.error);
    api.get('/analytics/fulfillment-time').then((res) => setFulfillment(res.data)).catch(console.error);
    api.get('/analytics/demand-forecast').then((res) => setForecast(res.data)).catch(console.error);
  }, []);

  const forecastData = forecast ? [...forecast.historical, ...forecast.predictions] : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics & Forecasting</h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'turnover' ? 'active' : ''}`} onClick={() => setTab('turnover')}>
          <MdTrendingUp /> Inventory Turnover
        </button>
        <button className={`tab ${tab === 'fulfillment' ? 'active' : ''}`} onClick={() => setTab('fulfillment')}>
          <MdTimer /> Fulfillment Time
        </button>
        <button className={`tab ${tab === 'forecast' ? 'active' : ''}`} onClick={() => setTab('forecast')}>
          <MdInsights /> Demand Forecast
        </button>
      </div>

      {tab === 'turnover' && (
        <div className="charts-grid">
          <div className="chart-card chart-card-wide">
            <h3>Inventory Turnover Ratio by Product</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={turnover.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                <XAxis dataKey="sku" stroke="#8b92a5" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8b92a5" />
                <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2f3e', borderRadius: 8 }}
                  formatter={(val, name) => [val, name === 'turnoverRatio' ? 'Turnover Ratio' : name]} />
                <Bar dataKey="turnoverRatio" name="Turnover Ratio" fill="#4f8cff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSold" name="Total Sold" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Turnover Details</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Sold</th><th>Ratio</th></tr></thead>
                <tbody>
                  {turnover.slice(0, 10).map((t, i) => (
                    <tr key={i}>
                      <td>{t.name}</td>
                      <td><code>{t.sku}</code></td>
                      <td>{t.currentStock}</td>
                      <td>{t.totalSold}</td>
                      <td><strong>{t.turnoverRatio}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'fulfillment' && fulfillment && (
        <div className="charts-grid">
          <div className="chart-card chart-card-wide">
            <h3>Order Fulfillment Time</h3>
            <div className="kpi-grid kpi-grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="kpi-card">
                <div className="kpi-info">
                  <span className="kpi-value">{fulfillment.averageFulfillmentHours}h</span>
                  <span className="kpi-label">Average Fulfillment Time</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-info">
                  <span className="kpi-value">{fulfillment.orders.length}</span>
                  <span className="kpi-label">Delivered Orders</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fulfillment.orders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                <XAxis dataKey="orderNumber" stroke="#8b92a5" tick={{ fontSize: 10 }} />
                <YAxis stroke="#8b92a5" label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#8b92a5' }} />
                <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2f3e', borderRadius: 8 }} />
                <Bar dataKey="fulfillmentHours" name="Hours" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'forecast' && (
        <div className="charts-grid">
          <div className="chart-card chart-card-wide">
            <h3>Demand Forecast (Exponential Smoothing)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                <XAxis dataKey="month" stroke="#8b92a5" />
                <YAxis stroke="#8b92a5" />
                <Tooltip contentStyle={{ background: '#1e2235', border: '1px solid #2a2f3e', borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="actual" name="Actual Orders" stroke="#4f8cff" fill="#4f8cff" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#f59e42" fill="#f59e42" fillOpacity={0.10} strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="forecast-note">
              <p>📈 Forecast uses simple exponential smoothing (α = 0.3) based on historical order data. Dashed line shows predicted future demand.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
