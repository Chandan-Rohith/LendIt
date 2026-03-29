import { useState } from 'react';
import PropTypes from 'prop-types';
import { submitReview } from '../api/api';
import { FiStar } from 'react-icons/fi';
import '../App.css';

const CONDITION_OPTIONS = 
[
  { label: 'Excellent', value: 0 },
  { label: 'Good', value: 1 },
  { label: 'Minor Damage', value: 2 },
  { label: 'Major Damage', value: 3 },
];

const EXPERIENCE_OPTIONS = 
[
  { label: 'Smooth', value: 1 },
  { label: 'Neutral', value: 2 },
  { label: 'Problematic', value: 3 },
];

const getConfidenceWeight = (reviewCount) => Math.min(Math.max(reviewCount, 0) / 20, 1);

const ReviewForm = ({
  bookingId,
  onReviewSubmitted,
  existingReviewCount = 0,
  existingAverageRating = 0,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [damageScore, setDamageScore] = useState(null);
  const [experienceScore, setExperienceScore] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) 
    {
      setError('Please select a rating.');
      return;
    }
    if (damageScore === null) 
    {
      setError('Please select tool condition.');
      return;
    }
    if (experienceScore === null) 
    {
      setError('Please select your experience with the user.');
      return;
    }

    setLoading(true);
    setError('');

    try 
    {
      const ratingValue = Number(rating);
      const priorCount = Number(existingReviewCount) || 0;
      const priorAverage = Number(existingAverageRating) > 0 ? Number(existingAverageRating) : 3;
      const totalReviews = priorCount + 1;
      const confidenceWeight = getConfidenceWeight(totalReviews);
      const weightedAverageRating = ((priorAverage * priorCount) + ratingValue) / totalReviews;
      const userScore = Number(((weightedAverageRating * confidenceWeight) + (3 * (1 - confidenceWeight))).toFixed(2));

      const payload = {
        bookingId,
        rating: ratingValue,
        avg_rating: ratingValue,
        damage_score: Number(damageScore),
        experience_score: Number(experienceScore),
        remarks: remarks || null,
        review_count: totalReviews,
        confidence_weight: Number(confidenceWeight.toFixed(2)),
        weighted_average_rating: Number(weightedAverageRating.toFixed(2)),
        user_score: userScore,
      };

      await submitReview(payload);
      onReviewSubmitted();
    }
    catch (err)
    {
      const responseData = err.response?.data;
      const validationMessage =
        responseData && typeof responseData === 'object'
          ? Object.values(responseData)[0]
          : null;

      setError(
        responseData?.error ||
        responseData?.message ||
        validationMessage ||
        'Failed to submit review.'
      );
    }
    finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h4>Leave a Review</h4>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="star-rating">
          {
                [1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                    key={star}
                    size={24}
                    className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                />
                ))
          }
        </div>

        <div className="form-group">
          <label>Tool Condition</label>
          <div className="option-grid" role="radiogroup" aria-label="Tool condition">
            {
                CONDITION_OPTIONS.map((option) => (
                    <label key={option.value} className="option-pill">
                        <input
                        type="radio"
                        name="toolCondition"
                        value={option.value}
                        checked={damageScore === option.value}
                        onChange={() => setDamageScore(option.value)}
                        />
                        {option.label}
                    </label>
                ))
            }
          </div>
        </div>

        <div className="form-group">
          <label>Experience with User</label>
          <div className="option-grid" role="radiogroup" aria-label="Experience with user">
            {EXPERIENCE_OPTIONS.map((option) => (
              <label key={option.value} className="option-pill">
                <input
                  type="radio"
                  name="experienceScore"
                  value={option.value}
                  checked={experienceScore === option.value}
                  onChange={() => setExperienceScore(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <small className="form-hint">
            Confidence weight auto-scales with review count: 1 review = low confidence, 20 reviews = high confidence.
          </small>
        </div>

        <div className="form-group">
          <label>Text Review</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Write your review..."
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

ReviewForm.propTypes = 
{
  bookingId: PropTypes.number.isRequired,
  onReviewSubmitted: PropTypes.func.isRequired,
  existingReviewCount: PropTypes.number,
  existingAverageRating: PropTypes.number,
};

export default ReviewForm;
