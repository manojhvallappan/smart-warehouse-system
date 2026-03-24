import { useState, useEffect } from 'react';
import api from '../api/client';
import { MdAdd, MdLocalShipping } from 'react-icons/md';

const STATUS_COLORS = {
  preparing: '#f59e42', dispatched: '#4f8cff', in_transit: '#a855f7', delivered: '#22c55e', returned: '#ef4444',
};

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ order_id: '', carrier: '', tracking_number: '' });
  const [orders, setOrders] = useState([]);

  const fetch = () => {
    api.get('/shipments?limit=50').then((res) => setShipments(res.data.shipments)).catch(console.error);
  };

  useEffect(() => { fetch(); api.get('/orders?limit=100').then((res) => setOrders(res.data.orders)).catch(console.error); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/shipments/${id}/status`, { status });
    fetch();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shipments', form);
      setShowCreate(false);
      setForm({ order_id: '', carrier: '', tracking_number: '' });
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const nextStatus = { preparing: 'dispatched', dispatched: 'in_transit', in_transit: 'delivered' };

  return (
    <div className="page">
      <div className="page-header">
        <h1><MdLocalShipping /> Shipments</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><MdAdd /> New Shipment</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Shipment #</th><th>Order</th><th>Customer</th><th>Carrier</th><th>Tracking</th><th>Status</th><th>Dispatch Date</th><th>Actions</th></tr></thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id}>
                <td className="td-bold">{s.shipment_number}</td>
                <td>{s.order?.order_number || '-'}</td>
                <td>{s.order?.customer_name || '-'}</td>
                <td>{s.carrier || '-'}</td>
                <td><code>{s.tracking_number || '-'}</code></td>
                <td><span className="badge" style={{ background: (STATUS_COLORS[s.status] || '#888') + '20', color: STATUS_COLORS[s.status] || '#888' }}>{s.status}</span></td>
                <td>{s.dispatch_date ? new Date(s.dispatch_date).toLocaleDateString() : '-'}</td>
                <td>
                  {nextStatus[s.status] && (
                    <button className="btn-sm btn-primary" onClick={() => updateStatus(s.id, nextStatus[s.status])}>
                      → {nextStatus[s.status]}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Shipment</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <label>Order
                <select required value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })}>
                  <option value="">Select order...</option>
                  {orders.filter((o) => o.status !== 'cancelled' && o.status !== 'delivered').map((o) => (
                    <option key={o.id} value={o.id}>{o.order_number} - {o.customer_name}</option>
                  ))}
                </select>
              </label>
              <label>Carrier<input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="FedEx, UPS, DHL..." /></label>
              <label>Tracking Number<input value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} /></label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Shipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
