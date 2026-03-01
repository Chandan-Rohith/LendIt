import { Link } from 'react-router-dom';
import '../App.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">LendIt</h1>
        <p className="landing-subtitle">
          Share tools with your neighbors. Borrow what you need, lend what you have.
        </p>
        <p className="landing-description">
          LendIt is a hyperlocal tool sharing platform that connects you with people
          nearby. Find tools within 10km, book them instantly, and build a trusted
          community of sharers.
        </p>
        <div className="landing-buttons">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-secondary">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
