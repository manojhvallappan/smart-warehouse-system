import { useState, useEffect } from 'react';
import api from '../api/client';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdQrCode } from 'react-icons/md';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', price: '', cost_price: '', barcode: '', reorder_level: 10 });

  const fetchProducts = () => {
    api.get(`/products?page=${page}&search=${search}&limit=15`)
      .then((res) => { setProducts(res.data.products); setTotal(res.data.total); })
      .catch(console.error);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
      } else {
        await api.post('/products', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', sku: '', category: '', price: '', cost_price: '', barcode: '', reorder_level: 10 });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving product');
    }
  };

  const deleteProduct = async (id) => {
    if (confirm('Deactivate this product?')) {
      await api.delete(`/products/${id}`);
      fetchProducts();
    }
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name, sku: product.sku, category: product.category,
      price: product.price, cost_price: product.cost_price, barcode: product.barcode || '',
      reorder_level: product.reorder_level,
    });
    setShowModal(true);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: '', sku: '', category: '', price: '', cost_price: '', barcode: '', reorder_level: 10 }); setShowModal(true); }}>
          <MdAdd /> Add Product
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <MdSearch />
          <input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <span className="toolbar-info">{total} products found</span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Cost</th><th>Reorder Lvl</th><th>Barcode</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="td-bold">{p.name}</td>
                <td><code>{p.sku}</code></td>
                <td><span className="badge badge-info">{p.category}</span></td>
                <td>${parseFloat(p.price).toFixed(2)}</td>
                <td>${parseFloat(p.cost_price).toFixed(2)}</td>
                <td>{p.reorder_level}</td>
                <td>
                  {p.barcode && (
                    <a href={`http://localhost:5000/api/products/${p.id}/barcode`} target="_blank" rel="noreferrer" className="barcode-link">
                      <MdQrCode /> View
                    </a>
                  )}
                </td>
                <td className="td-actions">
                  <button className="btn-icon" onClick={() => openEdit(p)}><MdEdit /></button>
                  <button className="btn-icon btn-danger" onClick={() => deleteProduct(p.id)}><MdDelete /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page}</span>
        <button disabled={products.length < 15} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>SKU<input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></label>
              <label>Category<input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
              <div className="form-row">
                <label>Price<input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
                <label>Cost Price<input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></label>
              </div>
              <label>Barcode<input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></label>
              <label>Reorder Level<input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: parseInt(e.target.value) })} /></label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
