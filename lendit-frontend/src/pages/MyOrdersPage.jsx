import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import { getMyOrders, updateBookingStatus } from '../api/api';
import ReviewForm from '../components/ReviewForm';
import { formatDisplayDate } from '../utils/date';
import { createFallbackImage } from '../utils/fallbackImage';

const statusColors = {
  PENDING: { background: '#fff3cd', color: '#856404', border: '#ffeeba' },
  APPROVED: { background: '#d4edda', color: '#155724', border: '#c3e6cb' },
  REJECTED: { background: '#fdecea', color: '#e74c3c', border: '#f5c6cb' },
  COMPLETED: { background: '#d6eaf8', color: '#2471a3', border: '#aed6f1' },
};

const getRecentValue = (item) => {
  if (item?.createdAt) {
    const createdAtTime = new Date(item.createdAt).getTime();
    if (!Number.isNaN(createdAtTime)) return createdAtTime;
  }

  const idValue = Number(item?.id);
  return Number.isNaN(idValue) ? 0 : idValue;
};

const parseDateOnly = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const isWithinBookedDates = (startDate, endDate) => {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today >= start && today <= end;
};

const MyOrdersPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReview, setExpandedReview] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getMyOrders();
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleReviewSubmitted = () => {
    setExpandedReview(null);
    fetchOrders();
  };

  const handleStatusChange = async (bookingId, status) => {
    setError('');

    if (status === 'COMPLETED') {
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking && !isWithinBookedDates(booking.startDate, booking.endDate)) {
        setError('You can mark booking as completed only during the booked dates.');
        return;
      }
    }

    try {
      const res = await updateBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => getRecentValue(b) - getRecentValue(a)),
    [bookings]
  );
  const activeReviewBooking = sortedBookings.find((booking) => booking.id === expandedReview) || null;

  if (loading) return <div className="loading">Loading your orders...</div>;

  return (
    <div style={{ padding: '10px 0' }}>
      <h2 style={{ color: 'var(--navy)', marginBottom: 20 }}>My Orders</h2>

      {error && <div className="error-message">{error}</div>}

      {sortedBookings.length === 0 ? (
        <div className="empty-state">
          <p>You haven&apos;t booked any tools yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {sortedBookings.map((booking) => {
            const statusStyle = statusColors[booking.status] || {};
            const canManuallyComplete = booking.status === 'APPROVED' && isWithinBookedDates(booking.startDate, booking.endDate);

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
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#565959', fontWeight: 700 }}>OWNER</p>
                    <Link
                      to={booking.ownerId ? `/profile/${booking.ownerId}` : '/profile'}
                      style={{ margin: 0, fontSize: '1rem', color: '#0f1111', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      {booking.ownerName}
                    </Link>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 160 }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#565959', fontWeight: 700 }}>NOTE</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0f1111' }}>
                      Click the owner name to view their address
                    </p>
                  </div>
                </div>

                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 14, flex: '1 1 420px', minWidth: 260 }}>
                      <img
                        src={booking.toolPhotoUrl ? `http://localhost:8080${booking.toolPhotoUrl}` : createFallbackImage('No Image', 120, 120)}
                        alt={booking.toolName}
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e7e7e7' }}
                      />
                      <div>
                        <h4 style={{ margin: 0, color: '#2162a1', fontSize: '2rem', lineHeight: 1.4 }}>{booking.toolName}</h4>
                        {/* <p style={{ margin: '6px 0 0', color: '#565959', fontSize: '1.5rem' }}>
                          Borrowed from {booking.ownerName}
                        </p> */}
                      </div>
                    </div>

                    <div style={{ flex: '0 1 260px', minWidth: 220 }}>
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

                      {canManuallyComplete && (
                        <div style={{ marginBottom: 10 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                            onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                          >
                            <FiCheckCircle size={14} /> Mark Completed
                          </button>
                        </div>
                      )}

                      {booking.canReview && (
                        <div>
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

export default MyOrdersPage;
