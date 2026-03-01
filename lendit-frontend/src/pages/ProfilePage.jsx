import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../api/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiStar, FiShield, FiAlertTriangle } from 'react-icons/fi';

const ProfilePage = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getRiskBadgeClass = (classification) => {
    switch (classification) {
      case 'LOW': return 'risk-badge risk-low';
      case 'MEDIUM': return 'risk-badge risk-medium';
      case 'HIGH': return 'risk-badge risk-high';
      default: return 'risk-badge risk-low';
    }
  };

  const getRiskLabel = (classification) => {
    switch (classification) {
      case 'LOW': return 'Low Risk';
      case 'MEDIUM': return 'Medium Risk';
      case 'HIGH': return 'High Risk';
      default: return 'Low Risk';
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  if (error) return (
    <div className="page-placeholder">
      <div className="error-message">{error}</div>
    </div>
  );

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <FiUser size={48} />
        </div>
        <h1 className="profile-name">{profile.fullName}</h1>
        <p className="profile-city">
          <FiMapPin size={16} /> {profile.city || 'Location not set'}
        </p>
      </div>

      <div className="profile-grid">
        {/* Contact Info Card */}
        <div className="profile-card">
          <h3 className="profile-card-title">Contact Information</h3>
          <div className="profile-field">
            <FiMail className="profile-field-icon" />
            <div>
              <span className="profile-field-label">Email</span>
              <span className="profile-field-value">{profile.email}</span>
            </div>
          </div>
          <div className="profile-field">
            <FiPhone className="profile-field-icon" />
            <div>
              <span className="profile-field-label">Phone</span>
              <span className="profile-field-value">{profile.phone || 'Not provided'}</span>
            </div>
          </div>
          <div className="profile-field">
            <FiMapPin className="profile-field-icon" />
            <div>
              <span className="profile-field-label">Coordinates</span>
              <span className="profile-field-value">
                {profile.latitude && profile.longitude
                  ? `${profile.latitude.toFixed(4)}, ${profile.longitude.toFixed(4)}`
                  : 'Not detected'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating & Trust Card */}
        <div className="profile-card">
          <h3 className="profile-card-title">Rating &amp; Trust Score</h3>
          <div className="profile-stat">
            <FiStar className="profile-stat-icon star-icon" />
            <div className="profile-stat-info">
              <span className="profile-stat-value">
                {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—'}
              </span>
              <span className="profile-stat-label">
                {profile.averageRating > 0 ? 'Average Rating' : 'No ratings yet'}
              </span>
            </div>
          </div>
          <div className="profile-stat">
            <FiShield className="profile-stat-icon shield-icon" />
            <div className="profile-stat-info">
              <span className={getRiskBadgeClass(profile.riskClassification)}>
                {getRiskLabel(profile.riskClassification)}
              </span>
              <span className="profile-stat-label">Trust Classification</span>
            </div>
          </div>
          <div className="profile-stat">
            <FiAlertTriangle className="profile-stat-icon score-icon" />
            <div className="profile-stat-info">
              <span className="profile-stat-value">{profile.riskScore.toFixed(1)}</span>
              <span className="profile-stat-label">Risk Score (lower is better)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="btn-danger btn-full" onClick={logout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
