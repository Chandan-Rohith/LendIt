import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiCheckCircle } from 'react-icons/fi';
import '../App.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: '',
    password: '',
  });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [locationStatus, setLocationStatus] = useState('detecting'); // detecting | success | denied
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Auto-detect location as soon as page loads (triggers browser popup)
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      (err) => {
        console.error('Location error:', err.message);
        setLocationStatus('denied');
        setError('Location access is required to use LendIt. Please allow location access and refresh.');
      }
    );
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!location.latitude || !location.longitude) {
      setError('Location is required. Please allow location access and refresh the page.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
      };
      const response = await registerUser(payload);
      const { token, userId, fullName, email } = response.data;
      login(token, { userId, fullName, email });
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">Join LendIt</h2>
        {error && <div className="error-message">{error}</div>}

        {/* Location status indicator */}
        <div className={`location-status ${locationStatus}`}>
          {locationStatus === 'detecting' && (
            <><FiMapPin size={16} className="spin" /> Detecting your location...</>
          )}
          {locationStatus === 'success' && (
            <><FiCheckCircle size={16} /> Location detected ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})</>
          )}
          {locationStatus === 'denied' && (
            <><FiMapPin size={16} /> Location access denied</>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min 6 chars)"
              required
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter your city"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || locationStatus === 'detecting'}
          >
            {loading ? 'Creating Account...' : locationStatus === 'detecting' ? 'Waiting for location...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
