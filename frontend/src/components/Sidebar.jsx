import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdInventory, MdShoppingCart, MdWarehouse,
  MdLocalShipping, MdBarChart, MdReceiptLong, MdLogout,
  MdPeople, MdCategory
} from 'react-icons/md';

const navItems = [
  { path: '/', label: 'Dashboard', icon: <MdDashboard />, roles: ['admin', 'manager', 'worker'] },
  { path: '/inventory', label: 'Inventory', icon: <MdInventory />, roles: ['admin', 'manager', 'worker'] },
  { path: '/products', label: 'Products', icon: <MdCategory />, roles: ['admin', 'manager', 'worker'] },
  { path: '/warehouse', label: 'Warehouse', icon: <MdWarehouse />, roles: ['admin', 'manager', 'worker'] },
  { path: '/orders', label: 'Orders', icon: <MdShoppingCart />, roles: ['admin', 'manager', 'worker'] },
  { path: '/shipments', label: 'Shipments', icon: <MdLocalShipping />, roles: ['admin', 'manager', 'worker'] },
  { path: '/goods-receipt', label: 'Goods Receipt', icon: <MdReceiptLong />, roles: ['admin', 'manager'] },
  { path: '/analytics', label: 'Analytics', icon: <MdBarChart />, roles: ['admin', 'manager'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filtered = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <MdWarehouse />
        </div>
        <div>
          <h2>WareFlow</h2>
          <span className="sidebar-subtitle">Smart Warehouse</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filtered.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.charAt(0) || 'U'}</div>
          <div>
            <p className="sidebar-username">{user?.name}</p>
            <p className="sidebar-role">{user?.role}</p>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <MdLogout /> Logout
        </button>
      </div>
    </aside>
  );
}
