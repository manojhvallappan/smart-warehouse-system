import { useState, useEffect } from 'react';
import api from '../api/client';
import { MdAdd, MdSearch } from 'react-icons/md';
import { exportToCsv } from '../utils/exportCsv';

const STATUS_COLORS = {
  pending: '#f59e42', confirmed: '#4f8cff', picking: '#a855f7',
  packing: '#06b6d4', shipped: '#22c55e', delivered: '#15803d', cancelled: '#ef4444',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customer_name: '', customer_email: '', shipping_address: '', items: [{ product_id: '', quantity: 1 }] });

  const fetchOrders = () => {
    api.get(`/orders?page=${page}&search=${search}&status=${statusFilter}&limit=15`)
      .then((res) => { setOrders(res.data.orders); setTotal(res.data.total); })
      .catch(console.error);
  };

  useEffect(() => { fetchOrders(); }, [page, search, statusFilter]);
  useEffect(() => { api.get('/products?limit=100').then((res) => setProducts(res.data.products)).catch(console.error); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    fetchOrders();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/orders', form);
      setShowCreate(false);
      setForm({ customer_name: '', customer_email: '', shipping_address: '', items: [{ product_id: '', quantity: 1 }] });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating order');
    }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1 }] });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i][field] = val;
    setForm({ ...form, items });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const nextStatus = { pending: 'confirmed', confirmed: 'picking', picking: 'packing', packing: 'shipped', shipped: 'delivered' };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Orders</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => exportToCsv('orders', orders)}>Export CSV</button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}><MdAdd /> New Order</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Search orders..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Worker</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="td-bold">{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td>{new Date(o.order_date).toLocaleDateString()}</td>
                <td>{o.items?.length || 0} items</td>
                <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                <td><span className="badge" style={{ background: STATUS_COLORS[o.status] + '20', color: STATUS_COLORS[o.status] }}>{o.status}</span></td>
                <td>{o.assignedWorker?.name || '-'}</td>
                <td>
                  {nextStatus[o.status] && (
                    <button className="btn-sm btn-primary" onClick={() => updateStatus(o.id, nextStatus[o.status])}>
                      → {nextStatus[o.status]}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} • {total} orders</span>
        <button disabled={orders.length < 15} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2>Create Order</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label>Customer Name<input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></label>
              <label>Customer Email<input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></label>
              <label>Shipping Address<textarea value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} /></label>
              <h3>Order Items</h3>
              {form.items.map((item, i) => (
                <div key={i} className="form-row" style={{ alignItems: 'end' }}>
                  <label>Product
                    <select required value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)}>
                      <option value="">Select...</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                    </select>
                  </label>
                  <label>Qty<input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value))} style={{ width: 80 }} /></label>
                  {form.items.length > 1 && <button type="button" className="btn-sm btn-danger" onClick={() => removeItem(i)}>✕</button>}
                </div>
              ))}
              <button type="button" className="btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
