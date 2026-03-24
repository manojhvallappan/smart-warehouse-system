import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdWarehouse, MdEmail, MdLock, MdPerson } from 'react-icons/md';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'worker' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password, form.role);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-brand">
            <MdWarehouse className="auth-brand-icon" />
            <h1>WareFlow</h1>
            <p>Smart Warehouse Management System</p>
          </div>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-dot" style={{background:'#4f8cff'}}></span>
              Real-time Inventory Tracking
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" style={{background:'#22c55e'}}></span>
              Demand Forecasting & Analytics
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" style={{background:'#f59e42'}}></span>
              Barcode & Shipment Management
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" style={{background:'#ef4444'}}></span>
              Low Stock Alerts & Automation
            </div>
          </div>
        </div>

        <div className="auth-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="auth-subtitle">
              {isRegister ? 'Register to get started' : 'Sign in to your account'}
            </p>

            {error && <div className="auth-error">{error}</div>}

            {isRegister && (
              <div className="input-group">
                <MdPerson className="input-icon" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <MdEmail className="input-icon" />
              <input
                type="email"
                placeholder="Email Address"
                autoComplete="username"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <MdLock className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {isRegister && (
              <div className="input-group">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="auth-select"
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>

            <p className="auth-toggle">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" className="auth-toggle-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
                {isRegister ? 'Sign In' : 'Register'}
              </button>
            </p>

            {!isRegister && (
              <div className="auth-demo">
                <p>Demo credentials:</p>
                <code>admin@warehouse.com / password123</code>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
