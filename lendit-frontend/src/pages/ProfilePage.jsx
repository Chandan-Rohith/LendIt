import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, getMyOrders, getMyTools, getUserProfileById, updateMyProfile } from '../api/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiStar, FiShield, FiAlertTriangle } from 'react-icons/fi';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    toolsListed: 0,
    reviewsGiven: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
    city: '',
    address: '',
  });

  const viewedUserId = userId ? Number(userId) : null;
  const isOwnProfile = !viewedUserId || viewedUserId === user?.userId;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        if (isOwnProfile) {
          const [profileRes, ordersRes, toolsRes] = await Promise.allSettled([
            getProfile(),
            getMyOrders(),
            getMyTools(),
          ]);

          if (profileRes.status === 'fulfilled') {
            setProfile(profileRes.value.data);
          } else {
            throw profileRes.reason;
          }

          const orders = ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data)
            ? ordersRes.value.data
            : [];
          const tools = toolsRes.status === 'fulfilled' && Array.isArray(toolsRes.value.data)
            ? toolsRes.value.data
            : [];

          const reviewsGivenCount = orders.filter((order) => order.status === 'COMPLETED' && !order.canReview).length;

          setStats({
            totalOrders: orders.length,
            toolsListed: tools.length,
            reviewsGiven: reviewsGivenCount,
          });
        } else {
          const profileRes = await getUserProfileById(viewedUserId);
          setProfile(profileRes.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOwnProfile, viewedUserId]);

  useEffect(() => {
    if (!profile) return;
    setEditForm({
      email: profile.email || '',
      phone: profile.phone || '',
      city: profile.city || '',
      address: profile.address || '',
    });
  }, [profile]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setError('');
    setSaving(true);

    try {
      const payload = {
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
        address: editForm.address.trim(),
      };

      const response = await updateMyProfile(payload);
      setProfile(response.data);
      setEditMode(false);
    } catch (err) {
      const apiData = err.response?.data;
      let msg = 'Failed to update profile';
      if (apiData) {
        if (apiData.error) msg = apiData.error;
        else if (typeof apiData === 'object') msg = Object.values(apiData).join(' ');
        else msg = String(apiData);
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      email: profile.email || '',
      phone: profile.phone || '',
      city: profile.city || '',
      address: profile.address || '',
    });
    setEditMode(false);
  };

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

  if (error) {
    return (
      <div className="page-placeholder">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-placeholder">
        <div className="error-message">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="profile-page profile-page-enhanced">
      <div className="profile-hero-bg" />

      <div className="profile-shell">
        <div className="profile-header-card">
          <div className="profile-avatar">
            <FiUser size={52} />
          </div>
          <h1 className="profile-name">{profile.fullName}</h1>
          <p className="profile-city">
            <FiMapPin size={16} /> {profile.city || 'Location not set'}
          </p>
        </div>

        <div className="profile-grid">
          <div className="profile-card">
            <h3 className="profile-card-title">Contact Information</h3>
            <div className="profile-field">
              <FiMail className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Email</span>
                {isOwnProfile && editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    className="profile-contact-input"
                  />
                ) : (
                  <span className="profile-field-value">{profile.email}</span>
                )}
              </div>
            </div>
            <div className="profile-field">
              <FiPhone className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Phone</span>
                {isOwnProfile && editMode ? (
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    className="profile-contact-input"
                  />
                ) : (
                  <span className="profile-field-value">{profile.phone || 'Not provided'}</span>
                )}
              </div>
            </div>
            <div className="profile-field">
              <FiMapPin className="profile-field-icon" />
              <div>
                <span className="profile-field-label">City</span>
                {isOwnProfile && editMode ? (
                  <input
                    type="text"
                    name="city"
                    value={editForm.city}
                    onChange={handleEditChange}
                    className="profile-contact-input"
                  />
                ) : (
                  <span className="profile-field-value">{profile.city || 'Not provided'}</span>
                )}
              </div>
            </div>
            <div className="profile-field">
              <FiMapPin className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Address</span>
                {isOwnProfile && editMode ? (
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    className="profile-contact-input"
                  />
                ) : (
                  <span className="profile-field-value">{profile.address || 'Not provided'}</span>
                )}
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

          <div className="profile-card">
            <h3 className="profile-card-title">Trust &amp; Rating</h3>
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

        {isOwnProfile && (
          <>
            <div className="profile-stats-card">
              <div className="profile-stats-header">Stats</div>
              <div className="profile-stats-grid">
                <div className="stats-pill">
                  <span className="stats-value">{stats.totalOrders}</span>
                  <span className="stats-label">Total Orders</span>
                </div>
                <div className="stats-pill">
                  <span className="stats-value">{stats.toolsListed}</span>
                  <span className="stats-label">Tools Listed</span>
                </div>
                <div className="stats-pill">
                  <span className="stats-value">{stats.reviewsGiven}</span>
                  <span className="stats-label">Reviews Given</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              {!editMode ? (
                <button className="profile-btn profile-btn-edit" type="button" onClick={() => setEditMode(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    className="profile-btn profile-btn-edit"
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="profile-btn profile-btn-cancel" type="button" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </>
              )}
              <button className="profile-btn profile-btn-logout" type="button" onClick={logout}>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
