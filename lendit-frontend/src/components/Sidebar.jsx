import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiLogOut, FiPackage, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Sidebar = ({ isOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-links">
        <NavLink to="/home" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FiHome size={18} /> <span>Home</span>
        </NavLink>
        <NavLink to="/my-tools" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FiPackage size={18} /> <span>My Tools</span>
        </NavLink>
        <NavLink to="/my-orders" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FiShoppingBag size={18} /> <span>My Orders</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FiUser size={18} /> <span>Profile</span>
        </NavLink>
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <FiLogOut size={18} /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
