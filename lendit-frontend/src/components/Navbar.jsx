import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu } from 'react-icons/fi';
import '../App.css';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <FiMenu size={22} />
        </button>
        <Link to="/home" className="navbar-brand">LendIt</Link>
      </div>
      <div className="navbar-right">
        <span className="navbar-user">Hi, {user?.fullName?.split(' ')[0]}</span>
      </div>
    </nav>
  );
};

export default Navbar;
