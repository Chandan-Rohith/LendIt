import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import ToolCard from '../components/ToolCard';
import ReviewForm from '../components/ReviewForm';
import { getMyTools, deleteTool, getMyToolBookings, updateBookingStatus} from '../api/api';
import { formatDisplayDate } from '../utils/date';

const statusColors = {
  PENDING: { background: '#fff3cd', color: '#856404', border: '#ffeeba' },
  APPROVED: { background: '#d4edda', color: '#155724', border: '#c3e6cb' },
  REJECTED: { background: '#fdecea', color: '#e74c3c', border: '#f5c6cb' },
  COMPLETED: { background: '#d6eaf8', color: '#2471a3', border: '#aed6f1' },
};

const getRecentValue = (item) => {
  if (item?.createdAt) 
  {
    const createdAtTime = new Date(item.createdAt).getTime();
    if (!Number.isNaN(createdAtTime)) return createdAtTime;
  }

  const idValue = Number(item?.id);
  return Number.isNaN(idValue) ? 0 : idValue;
};

const MyToolsPage = () => {
  const navigate = useNavigate();
  const [ tools, setTools] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [error, setError] = useState('');
  const [expandedReview, setExpandedReview] = useState(null);
  // const [bookingReviews, setBookingReviews] = useState({});

  const getApiError = (err, fallback) => {
    if (err?.response?.data?.error) return err.response.data.error;
    if (err?.response?.data?.message) return err.response.data.message;
    if (typeof err?.response?.data === 'string') return err.response.data;
    return fallback;
  };

  const fetchTools = useCallback(async () => {
    try 
    {
      const res = await getMyTools();
      setTools(res.data);
    } 
    catch (err) 
    {
      setError(getApiError(err, 'Failed to load your tools'));
    } 
    finally 
    {
      setLoadingTools(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try 
    {
      const res = await getMyToolBookings();
      setBookings(res.data);
    } 
    catch (err) 
    {
      setError(getApiError(err, 'Failed to load booking requests'));
    } 
    finally 
    {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
    fetchBookings();
  }, [fetchTools, fetchBookings]);

  const handleDelete = async (toolId) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;
    try 
    {
      await deleteTool(toolId);
      setTools((prev) => prev.filter((t) => t.id !== toolId));
    } 
    catch (err) 
    {
      setError(getApiError(err, 'Failed to delete tool'));
    }
  };

  const handleStatusChange = async (bookingId, status) => {
    setError('');
    try 
    {
      const res = await updateBookingStatus(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? res.data : b))
      );
    } 
    catch (err) 
    {
      setError(getApiError(err, 'Failed to update booking status'));
    }
  };

  const handleReviewSubmitted = () => {
    setExpandedReview(null);
    fetchBookings();
  };

  const sortedTools = useMemo(
    () => [...tools].sort((a, b) => getRecentValue(b) - getRecentValue(a)),
    [tools]
  );
  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => getRecentValue(b) - getRecentValue(a)),
    [bookings]
  );
  const activeReviewBooking = sortedBookings.find((booking) => booking.id === expandedReview) || null;

  return (
    <div style={{ padding: '10px 0' }}>
      {error && <div className="error-message">{error}</div>}

      {/* ===== SECTION 1: My Listed Tools ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: 'var(--navy)', margin: 0 }}>My Listed Tools</h2>
        <button className="btn btn-primary" onClick={() => navigate('/add-tool')}>
          <FiPlus size={16} /> Add Tool
        </button>
      </div>

      {loadingTools ? (
        <div className="loading">Loading your tools...</div>
      ) : sortedTools.length === 0 ? (
        <div className="empty-state">
          <p>You haven&apos;t listed any tools yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/add-tool')}>
            <FiPlus size={16} /> List Your First Tool
          </button>
        </div>
      ) : (
        <div className="tools-grid">
          {sortedTools.map((tool) => (
            <div key={tool.id}>
              <ToolCard tool={tool} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}

      {/* ===== SECTION 2: Incoming Booking Requests ===== */}
      <h2 style={{ color: 'var(--navy)', marginTop: 40, marginBottom: 20 }}>Incoming Booking Requests</h2>

      {loadingBookings ? (
        <div className="loading">Loading requests...</div>
      ) : sortedBookings.length === 0 ? (
        <div className="empty-state">
          <p>No incoming requests yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {
            sortedBookings.map((booking) => {
            const statusStyle = statusColors[booking.status] || {};

            return (
              <div
                key={booking.id}
                style={{
                  border: '1px solid #d5d9d9',
                  borderRadius: 12,
                  background: '#fff',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#f0f2f2',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#565959', fontWeight: 700 }}>BOOKING PERIOD</p>
                    <p style={{ margin: 0, fontSize: '1rem', color: '#0f1111' }}>
                      {formatDisplayDate(booking.startDate)} - {formatDisplayDate(booking.endDate)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#565959', fontWeight: 700 }}>BORROWER</p>
                    <Link
                      to={booking.borrowerId ? `/profile/${booking.borrowerId}` : '/profile'}
                      style={{ margin: 0, fontSize: '1rem', color: '#0f1111', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      {booking.borrowerName}
                    </Link>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 160 }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#565959', fontWeight: 700 }}>NOTE</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0f1111' }}>
                      Click the borrower name to view their address
                    </p>
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 14, flex: '1 1 420px', minWidth: 260 }}>
                      <img
                        src={booking.toolPhotoUrl ? `http://localhost:8080${booking.toolPhotoUrl}` : 'https://via.placeholder.com/120x120?text=No+Image'}
                        alt={booking.toolName}
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e7e7e7' }}
                      />
                      <div>
                        <h4 style={{ margin: 0, color: '#2162a1', fontSize: '2rem', lineHeight: 1.4 }}>{booking.toolName}</h4>
                      </div>
                    </div>

                    <div style={{ flex: '0 1 300px', minWidth: 220 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: 16,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: statusStyle.background,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          marginBottom: 12,
                        }}
                      >
                        {booking.status}
                      </span>

                      {booking.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                          <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => handleStatusChange(booking.id, 'APPROVED')}>
                            <FiCheck size={14} /> Approve
                          </button>
                          <button className="btn btn-danger" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => handleStatusChange(booking.id, 'REJECTED')}>
                            <FiX size={14} /> Reject
                          </button>
                        </div>
                      )}

                      {booking.status === 'COMPLETED' && booking.canReview && (
                        <div style={{ marginBottom: 8 }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                            onClick={() => setExpandedReview(booking.id)}
                          >
                            Leave a Review
                          </button>
                        </div>
                      )}

                      {booking.status === 'COMPLETED' && !booking.canReview && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--success)', margin: 0 }}>
                          ✓ Review submitted
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

)}

      {activeReviewBooking && (
        <div className="review-modal-overlay" onClick={() => setExpandedReview(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Review: {activeReviewBooking.toolName}</h3>
              <button
                type="button"
                className="review-modal-close"
                onClick={() => setExpandedReview(null)}
              >
                Close
              </button>
            </div>
            <div className="review-modal-form">
              <ReviewForm
                bookingId={activeReviewBooking.id}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyToolsPage;
