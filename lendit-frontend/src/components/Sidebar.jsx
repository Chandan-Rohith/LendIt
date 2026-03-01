import { NavLink } from 'react-router-dom';
import { FiHome, FiPlusCircle, FiPackage, FiShoppingBag, FiUser } from 'react-icons/fi';
import '../App.css';

const Sidebar = ({ isOpen }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-links">
        <NavLink to="/home" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FiHome size={18} /> <span>Home</span>
        </NavLink>
        <NavLink to="/add-tool" className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          <FiPlusCircle size={18} /> <span>Add Tool</span>
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
      </div>
    </aside>
  );
};

export default Sidebar;
