import { useState, useEffect } from 'react';
import api from '../api/client';
import { MdAdd, MdSearch, MdWarning } from 'react-icons/md';
import { exportToCsv } from '../utils/exportCsv';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f59e42', '#22c55e'];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [abcData, setAbcData] = useState(null);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product_id: '', location_id: '', quantity: '' });
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const fetchInventory = () => {
    const lowStock = tab === 'low' ? '&low_stock=true' : '';
    api.get(`/inventory?page=${page}&limit=20${lowStock}`).then((res) => setItems(res.data.items)).catch(console.error);
    api.get('/inventory/summary').then((res) => setSummary(res.data)).catch(console.error);
  };

  useEffect(() => { fetchInventory(); }, [page, tab]);

  useEffect(() => {
    api.get('/inventory/abc-analysis').then((res) => setAbcData(res.data)).catch(console.error);
    api.get('/products?limit=100').then((res) => setProducts(res.data.products)).catch(console.error);
    api.get('/warehouse?limit=100').then((res) => setLocations(res.data.locations)).catch(console.error);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', form);
      setShowModal(false);
      setForm({ product_id: '', location_id: '', quantity: '' });
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const abcPieData = abcData ? [
    { name: 'A (High Value)', value: abcData.summary.A },
    { name: 'B (Medium)', value: abcData.summary.B },
    { name: 'C (Low Value)', value: abcData.summary.C },
  ] : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inventory</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => exportToCsv('inventory', items)}>Export CSV</button>
          <button className="btn-primary" onClick={() => setShowModal(true)}><MdAdd /> Add Stock</button>
        </div>
      </div>

      <div className="kpi-grid kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-info"><span className="kpi-value">{summary.totalItems || 0}</span><span className="kpi-label">Records</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-info"><span className="kpi-value">{summary.totalQuantity || 0}</span><span className="kpi-label">Total Units</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-info"><span className="kpi-value">${parseFloat(summary.totalValue || 0).toLocaleString()}</span><span className="kpi-label">Stock Value</span></div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '3px solid #ef4444' }}>
          <div className="kpi-info"><span className="kpi-value">{summary.lowStockCount || 0}</span><span className="kpi-label">Low Stock Items</span></div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => { setTab('all'); setPage(1); }}>All Items</button>
        <button className={`tab ${tab === 'low' ? 'active' : ''}`} onClick={() => { setTab('low'); setPage(1); }}>
          <MdWarning /> Low Stock
        </button>
        <button className={`tab ${tab === 'abc' ? 'active' : ''}`} onClick={() => setTab('abc')}>ABC Analysis</button>
      </div>

      {tab === 'abc' && abcData ? (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>ABC Inventory Classification</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={abcPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label>
                  {abcPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card">
            <h3>Items by Category</h3>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Value</th><th>Category</th></tr></thead>
                <tbody>
                  {abcData.items.slice(0, 15).map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td><code>{item.sku}</code></td>
                      <td>${item.totalValue.toFixed(2)}</td>
                      <td><span className={`badge badge-${item.category === 'A' ? 'danger' : item.category === 'B' ? 'warning' : 'success'}`}>{item.category}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Location</th><th>Quantity</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((item) => {
                  const isLow = item.quantity <= (item.product?.reorder_level || 10);
                  return (
                    <tr key={item.id}>
                      <td className="td-bold">{item.product?.name}</td>
                      <td><code>{item.product?.sku}</code></td>
                      <td>{item.location ? `${item.location.rack}-${item.location.shelf}-${item.location.bin}` : '-'}</td>
                      <td><strong>{item.quantity}</strong></td>
                      <td><span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>{isLow ? 'Low Stock' : 'In Stock'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page}</span>
            <button disabled={items.length < 20} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Inventory</h2>
            <form onSubmit={handleAdd} className="modal-form">
              <label>Product
                <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </label>
              <label>Location
                <select required value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })}>
                  <option value="">Select location...</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.rack}-{l.shelf}-{l.bin}</option>)}
                </select>
              </label>
              <label>Quantity<input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
