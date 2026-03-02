import { useState } from 'react';
import PropTypes from 'prop-types';
import { submitReview } from '../api/api';
import { FiStar } from 'react-icons/fi';
import '../App.css';

const ReviewForm = ({ bookingId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [damageReport, setDamageReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        bookingId,
        rating: Number(rating),
        remarks: remarks || null,
        damageReport: Boolean(damageReport),
      };
      await submitReview(payload);
      onReviewSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h4>Leave a Review</h4>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <FiStar
              key={star}
              size={24}
              className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
        <div className="form-group">
          <label>Remarks (optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Write your review..."
            rows={3}
          />
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={damageReport}
              onChange={(e) => setDamageReport(e.target.checked)}
            />
            Report damage
          </label>
        </div>
        <div className="form-group">
          <label>Remarks / Complaint (optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Write your review or describe a complaint..."
            rows={4}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

ReviewForm.propTypes = {
  bookingId: PropTypes.number.isRequired,
  onReviewSubmitted: PropTypes.func.isRequired,
};

export default ReviewForm;
