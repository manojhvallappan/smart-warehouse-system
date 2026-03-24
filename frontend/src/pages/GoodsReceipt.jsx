import { useState, useEffect } from 'react';
import api from '../api/client';
import { MdAdd, MdCheck } from 'react-icons/md';

const STATUS_COLORS = {
  pending: '#f59e42', inspecting: '#4f8cff', accepted: '#22c55e', rejected: '#ef4444', partial: '#a855f7',
};

export default function GoodsReceipt() {
  const [receipts, setReceipts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ supplier_id: '', product_id: '', expected_quantity: '', location_id: '' });

  const fetch = () => {
    api.get('/goods-receipt?limit=50').then((res) => setReceipts(res.data.receipts)).catch(console.error);
  };

  useEffect(() => {
    fetch();
    api.get('/products?limit=100').then((res) => setProducts(res.data.products)).catch(console.error);
    api.get('/suppliers').then((res) => setSuppliers(res.data)).catch(console.error);
    api.get('/warehouse?limit=100').then((res) => setLocations(res.data.locations)).catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goods-receipt', form);
      setShowCreate(false);
      setForm({ supplier_id: '', product_id: '', expected_quantity: '', location_id: '' });
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const acceptReceipt = async (id) => {
    try {
      await api.put(`/goods-receipt/${id}/accept`);
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Goods Receipt Notes</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><MdAdd /> Create GRN</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>GRN #</th><th>Supplier</th><th>Product</th><th>Expected</th><th>Received</th><th>Location</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.id}>
                <td className="td-bold">{r.grn_number}</td>
                <td>{r.supplier?.name || '-'}</td>
                <td>{r.product?.name || '-'}</td>
                <td>{r.expected_quantity}</td>
                <td>{r.received_quantity}</td>
                <td>{r.location ? `${r.location.rack}-${r.location.shelf}-${r.location.bin}` : '-'}</td>
                <td><span className="badge" style={{ background: (STATUS_COLORS[r.status] || '#888') + '20', color: STATUS_COLORS[r.status] || '#888' }}>{r.status}</span></td>
                <td>{new Date(r.received_date).toLocaleDateString()}</td>
                <td>
                  {r.status === 'pending' || r.status === 'inspecting' ? (
                    <button className="btn-sm btn-success" onClick={() => acceptReceipt(r.id)}><MdCheck /> Accept</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Goods Receipt</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label>Supplier
                <select required value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                  <option value="">Select supplier...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label>Product
                <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">Select product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </label>
              <label>Expected Quantity<input type="number" min="1" required value={form.expected_quantity} onChange={(e) => setForm({ ...form, expected_quantity: e.target.value })} /></label>
              <label>Destination Location
                <select value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })}>
                  <option value="">Select location...</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.rack}-{l.shelf}-{l.bin}</option>)}
                </select>
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create GRN</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
