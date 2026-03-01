import { useState } from 'react';
import PropTypes from 'prop-types';
import { submitReview } from '../api/api';
import { FiStar } from 'react-icons/fi';
import '../App.css';

const ReviewForm = ({ bookingId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [damageReport, setDamageReport] = useState('');
  const [complaintFlag, setComplaintFlag] = useState(false);
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
      await submitReview({
        bookingId,
        rating,
        comment,
        damageReport: damageReport || null,
        complaintFlag,
      });
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
          <label>Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Damage Report (optional)</label>
          <textarea
            value={damageReport}
            onChange={(e) => setDamageReport(e.target.value)}
            placeholder="Report any damage..."
            rows={2}
          />
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={complaintFlag}
              onChange={(e) => setComplaintFlag(e.target.checked)}
            />
            Flag this user for misconduct
          </label>
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
