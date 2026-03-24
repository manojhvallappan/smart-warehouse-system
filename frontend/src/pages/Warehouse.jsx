import { useState, useEffect } from 'react';
import api from '../api/client';
import { MdAdd, MdEdit } from 'react-icons/md';

export default function Warehouse() {
  const [locations, setLocations] = useState([]);
  const [utilization, setUtilization] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ rack: '', shelf: '', bin: '', capacity: 100, zone: '' });

  const fetch = () => {
    api.get('/warehouse?limit=100').then((res) => setLocations(res.data.locations)).catch(console.error);
    api.get('/warehouse/utilization').then((res) => setUtilization(res.data)).catch(console.error);
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/warehouse', form);
      setShowModal(false);
      setForm({ rack: '', shelf: '', bin: '', capacity: 100, zone: '' });
      fetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const getHeatColor = (pct) => {
    const p = parseFloat(pct);
    if (p >= 80) return '#ef4444';
    if (p >= 50) return '#f59e42';
    if (p >= 20) return '#22c55e';
    return '#4f8cff';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Warehouse Locations</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}><MdAdd /> Add Location</button>
      </div>

      {utilization && (
        <div className="kpi-grid kpi-grid-3">
          <div className="kpi-card">
            <div className="kpi-info"><span className="kpi-value">{utilization.totalCapacity}</span><span className="kpi-label">Total Capacity</span></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info"><span className="kpi-value">{utilization.totalOccupancy}</span><span className="kpi-label">Total Occupancy</span></div>
          </div>
          <div className="kpi-card">
            <div className="kpi-info"><span className="kpi-value">{utilization.utilizationRate}%</span><span className="kpi-label">Utilization Rate</span></div>
          </div>
        </div>
      )}

      <h3 style={{ margin: '1.5rem 0 1rem' }}>Warehouse Heatmap</h3>
      <div className="heatmap-grid">
        {utilization?.heatmap?.map((loc) => (
          <div
            key={loc.id}
            className="heatmap-cell"
            style={{ borderColor: getHeatColor(loc.utilization), background: getHeatColor(loc.utilization) + '15' }}
            title={`${loc.rack}-${loc.shelf}-${loc.bin} | ${loc.utilization}% used`}
          >
            <span className="heatmap-label">{loc.rack}-{loc.shelf}-{loc.bin}</span>
            <span className="heatmap-pct" style={{ color: getHeatColor(loc.utilization) }}>{loc.utilization}%</span>
            <div className="heatmap-bar">
              <div style={{ width: `${Math.min(loc.utilization, 100)}%`, background: getHeatColor(loc.utilization) }}></div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '2rem 0 1rem' }}>All Locations</h3>
      <div className="table-container">
        <table className="data-table">
          <thead><tr><th>Rack</th><th>Shelf</th><th>Bin</th><th>Zone</th><th>Capacity</th><th>Occupancy</th><th>Utilization</th></tr></thead>
          <tbody>
            {locations.map((l) => {
              const pct = l.capacity > 0 ? ((l.current_occupancy / l.capacity) * 100).toFixed(1) : 0;
              return (
                <tr key={l.id}>
                  <td><strong>{l.rack}</strong></td>
                  <td>{l.shelf}</td>
                  <td>{l.bin}</td>
                  <td><span className="badge badge-info">{l.zone || '-'}</span></td>
                  <td>{l.capacity}</td>
                  <td>{l.current_occupancy}</td>
                  <td>
                    <div className="progress-bar"><div style={{ width: `${pct}%`, background: getHeatColor(pct) }}></div></div>
                    <span style={{ fontSize: '0.75rem', color: '#8b92a5' }}>{pct}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Location</h2>
            <form onSubmit={handleAdd} className="modal-form">
              <div className="form-row">
                <label>Rack<input required value={form.rack} onChange={(e) => setForm({ ...form, rack: e.target.value })} placeholder="A1" /></label>
                <label>Shelf<input required value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} placeholder="S1" /></label>
                <label>Bin<input required value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} placeholder="B1" /></label>
              </div>
              <label>Zone<input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Zone A" /></label>
              <label>Capacity<input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} /></label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
