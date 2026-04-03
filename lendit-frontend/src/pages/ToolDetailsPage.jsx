import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiStar, FiMapPin, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getToolById, getBlockedDates, createBooking, getReviewsByTool } from '../api/api';
import { formatApiDate, formatDisplayDate } from '../utils/date';
import { createFallbackImage } from '../utils/fallbackImage';
import { buildToolImageUrl } from '../utils/backendUrl';

const ToolDetailsPage = () => {
  const { id } = useParams();
  const { user, location } = useAuth();
  const [tool, setTool] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [booking, setBooking] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // ✅ Wait for live browser location before querying tool details.
    // If location is null/undefined, do not make the request — backend will
    // reject it anyway and use DB coords would violate the location-mandatory design.
    if (!location || location.latitude == null || location.longitude == null) return;

    const fetchData = async () => {
      try {
        const [toolRes, datesRes] = await Promise.all([
          getToolById(id, location),
          getBlockedDates(id),
        ]);
        setTool(toolRes.data);
        setBlockedDates(
          datesRes.data.map((d) => new Date(d + 'T00:00:00'))
        );
        // Fetch reviews for this tool
        try {
          const revRes = await getReviewsByTool(id);
          setReviews(revRes.data);
        } catch { /* ignore */ }
      } catch {
        setError('Failed to load tool details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, location]);

  const isOwner = tool && user && tool.ownerId === user.userId;

  const handleBook = async () => {
    setError('');
    setSuccess('');

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    if (startDate > endDate) {
      setError('Start date must be before end date');
      return;
    }

    setBooking(true);
    try 
    {
      await createBooking({
        toolId: Number(id),
        startDate: formatApiDate(startDate),
        endDate: formatApiDate(endDate),
      });
      setSuccess('Booking request submitted successfully! The owner will review it.');
      setStartDate(null);
      setEndDate(null);
    }
     catch (err) 
    {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Booking failed — dates may conflict';
      setError(msg);
    } 
    finally 
    {
      setBooking(false);
    }
  };

  if (loading) return <div className="loading">Loading tool details...</div>;
  if (!tool) return <div className="error-message">Tool not found</div>;

  const fallbackImage = createFallbackImage('No Image', 600, 350);
  const imageUrl = buildToolImageUrl(tool.id) ?? fallbackImage;

  const sortedReviews = [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const latestReview = sortedReviews[0] || null;
  const otherReviews = sortedReviews.slice(1);

  const pageStyle = { maxWidth: 1100, margin: '0 auto', padding: '20px' };
  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' };
  const cardStyle = { padding: 20, borderRadius: 16, background: 'var(--white)', boxShadow: 'var(--shadow)' };

  return (
    <div style={pageStyle}>
      <div style={gridStyle}>
        {/* LEFT COLUMN */}
        <div>
          {/* Tool Image (rounded top corners only so info card can visually attach) */}
          <div
            style={{
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
              marginBottom: 0,
              background: '#eef4f8',
              // height: 420,
              height:260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <img
              src={imageUrl}
              alt={tool.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackImage;
              }}
              // style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }}
              style={{maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain'
      }}
            />
          </div>

          {/* Tool Info Card */}
          <div style={{ ...cardStyle, marginTop: -8, marginBottom: 24 }}>
            <h2 style={{ color: 'var(--navy)', margin: '0 0 8px' }}>{tool.name}</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: '0 0 12px' }}>{tool.categoryName}</p>

            {tool.description && (
              <p style={{ marginBottom: 16, lineHeight: 1.7 }}>{tool.description}</p>
            )}

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.95rem', color: 'var(--text-light)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong>Owner:</strong>
                <Link
                  to={tool.ownerId ? `/profile/${tool.ownerId}` : '/profile'}
                  style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  {tool.ownerName}
                </Link>
              </span>
              {tool.ownerRating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)' }}>
                  <FiStar size={16} /> {tool.ownerRating.toFixed(1)}
                </span>
              )}
              {tool.distance !== undefined && tool.distance !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiMapPin size={16} /> {tool.distance.toFixed(1)} km away
                </span>
              )}
            </div>

              {!tool.available && (
                <div style={{ marginTop: 14, padding: '8px 14px', background: '#fdecea', color: 'var(--danger)', borderRadius: 8, fontSize: '0.9rem' }}>
                  This tool is currently unavailable.
                </div>
              )}
          </div>

          {/* Latest Review under description */}
          {latestReview && (
            <div style={{ ...cardStyle }}>
              <h3 style={{ color: 'var(--navy)', marginTop: 0, marginBottom: 12 }}>Latest Review</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <strong style={{ fontSize: '0.95rem' }}>{latestReview.reviewerName}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--warning)' }}>
                      {[1,2,3,4,5].map((star) => (
                        <FiStar key={star} size={14} style={{ fill: star <= latestReview.rating ? 'var(--warning)' : 'none' }} />
                      ))}
                      <span style={{ fontSize: '0.85rem', marginLeft: 6 }}>{latestReview.rating}/5</span>
                    </span>
                  </div>
                  {latestReview.remarks && (
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{latestReview.remarks}</p>
                  )}
                  <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#999' }}>
                    {formatDisplayDate(latestReview.createdAt?.split('T')[0] || latestReview.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Booking Section */}
          {!isOwner && tool.available && (
            <div style={cardStyle} className="tool-booking-card">
              <h3 style={{ color: 'var(--navy)', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCalendar /> Book This Tool
              </h3>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-row" style={{ marginBottom: 16, display: 'block' }}>
                <div className="form-group">
                  <label>Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    excludeDates={blockedDates}
                    minDate={new Date()}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select start date"
                  />
                </div>
                <div className="form-group" style={{ marginTop: 10 }}>
                  <label>End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    excludeDates={blockedDates}
                    minDate={startDate || new Date()}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select end date"
                  />
                </div>
              </div>

              {blockedDates.length > 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 16 }}>
                  Greyed-out dates are blocked by the owner or already booked.
                </p>
              )}

              <button
                className="btn btn-primary btn-full"
                onClick={handleBook}
                disabled={booking}
                style={{ padding: '12px 16px', borderRadius: 10 }}
              >
                {booking ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          )}

          {isOwner && (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-light)' }}>
              <p>This is your tool. You cannot book your own tool.</p>
            </div>
          )}

          {/* Other reviews */}
          <div style={cardStyle}>
            <h3 style={{ color: 'var(--navy)', marginTop: 0, marginBottom: 12 }}>Reviews ({reviews.length})</h3>
            {otherReviews.length === 0 && !latestReview && <p style={{ color: 'var(--text-light)' }}>No reviews yet.</p>}
            {otherReviews.map((review) => (
              <div key={review.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <strong style={{ fontSize: '0.95rem' }}>{review.reviewerName}</strong>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--warning)' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} size={14} style={{ fill: star <= review.rating ? 'var(--warning)' : 'none' }} />
                    ))}
                    <span style={{ fontSize: '0.85rem', marginLeft: 4 }}>{review.rating}/5</span>
                  </span>
                  {review.damageReport && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Damage reported</span>
                  )}
                </div>
                {review.remarks && (
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.5 }}>{review.remarks}</p>
                )}
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#999' }}>
                  {formatDisplayDate(review.createdAt?.split('T')[0] || review.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetailsPage;
