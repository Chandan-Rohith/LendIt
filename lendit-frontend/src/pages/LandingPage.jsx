import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const LandingPage = () => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-shell">
        <div className="landing-content">
            <p className="landing-brand">LendIt</p>
            <h1 className="landing-title">Why buy when you can borrow?</h1>
          <p className="landing-description">
              Need a tool right now? Skip the store.
              Discover, borrow, and build — all within your community.
          </p>
          <div className="landing-buttons">
            <Link to="/register" className="btn landing-btn-signup">Sign Up</Link>
            <Link to="/login" className="btn landing-btn-login">Login</Link>
          </div>
        </div>

        <div className="landing-illustration" aria-hidden="true">
          <svg
            viewBox="0 0 360 320"
            className="landing-box-svg"
            role="img"
            aria-label="Package box illustration"
          >
            <polygon points="180,20 320,90 180,160 40,90" fill="#efd57a" />
            <polygon points="180,160 320,90 320,240 180,310" fill="#efc963" />
            <polygon points="180,160 40,90 40,240 180,310" fill="#f5bf51" />
            <polygon points="114,58 254,128 286,112 146,42" fill="#f47b83" />
            <polygon points="254,128 286,112 286,174 254,190" fill="#df6372" />
            <rect x="55" y="184" width="46" height="10" rx="5" fill="#f7f0d7" transform="rotate(27 55 184)" />
            <rect x="50" y="202" width="34" height="10" rx="5" fill="#efe5c4" transform="rotate(27 50 202)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
