import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFirestoreOperations } from '../hooks/useFirestore';
import { useDocument, useCollection } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import '../styles/RatingSystem.css';

const StarRating = ({ rating, setRating, disabled, size = 'large', showHalfStars = false }) => {
  const stars = showHalfStars ? [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] : [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating ${size}`}>
      {stars.map((star) => {
        // For half stars, we need to determine if it's a half or full star
        const isHalfStar = showHalfStars && star % 1 !== 0;
        const starValue = isHalfStar ? Math.floor(star) + 0.5 : star;

        return (
          <span
            key={starValue}
            className={`star ${starValue <= rating ? 'filled' : 'empty'} ${disabled ? 'disabled' : ''} ${isHalfStar ? 'half' : 'full'}`}
            onClick={() => !disabled && setRating(starValue)}
            title={`${starValue} ${starValue === 1 ? 'star' : 'stars'}`}
          >
            {isHalfStar ? '★' : '★'}
          </span>
        );
      })}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number.isRequired,
  setRating: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showHalfStars: PropTypes.bool
};

// Read-only star display component
const StarDisplay = ({ rating, size = 'small' }) => {
  return (
    <div className={`star-rating ${size} readonly`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : 'empty'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

StarDisplay.propTypes = {
  rating: PropTypes.number.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RatingSystem = ({ 
  rideId, 
  userType, // 'driver' or 'passenger'
  showHistory = true,
  maxHistoryItems = 5,
  onRatingSubmit,
  onError
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  const { user } = useAuth();
  const { addDocument, updateDocument, getDocuments } = useFirestoreOperations();
  const { document: ride } = useDocument('rides', rideId);

  // Get the ID of the user being rated
  const ratedUserId = userType === 'driver' 
    ? ride?.passengerId 
    : ride?.driverId;

  // Get all ratings for the user being rated
  const { documents: userRatings, loading: ratingsLoading } = useCollection(
    'ratings',
    [{ field: 'ratedUserId', operator: '==', value: ratedUserId || 'none' }],
    { limit: 50 }
  );

  // Calculate average rating when ratings change
  useEffect(() => {
    if (userRatings && userRatings.length > 0) {
      const total = userRatings.reduce((sum, r) => sum + r.rating, 0);
      setAverageRating(total / userRatings.length);
      setTotalRatings(userRatings.length);
    }
  }, [userRatings]);

  // Check if user has already rated this ride
  useEffect(() => {
    if (ride) {
      const ratingField = userType === 'driver' ? 'driverRating' : 'passengerRating';
      if (ride[ratingField]) {
        setRating(ride[ratingField].rating || 0);
        setComment(ride[ratingField].comment || '');
        setSubmitted(true);
      }
    }
  }, [ride, userType]);

  // Load rating history for the user being rated
  useEffect(() => {
    const loadRatingHistory = async () => {
      if (!ratedUserId) return;

      try {
        setHistoryLoading(true);

        // Get ratings for this user, sorted by timestamp
        const ratings = await getDocuments('ratings', [
          { field: 'ratedUserId', operator: '==', value: ratedUserId }
        ], {
          orderBy: [{ field: 'timestamp', direction: 'desc' }],
          limit: maxHistoryItems
        });

        setRatingHistory(ratings || []);
        setHistoryLoading(false);
      } catch (err) {
        console.error('Error loading rating history:', err);
        setHistoryLoading(false);
      }
    };

    if (showHistory && ratedUserId) {
      loadRatingHistory();
    }
  }, [ratedUserId, showHistory, maxHistoryItems, getDocuments]);

  const submitRating = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!user?.uid || !rideId) {
      setError('User or ride information missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine which user is being rated
      if (!ratedUserId) {
        throw new Error('Could not determine which user to rate');
      }

      // Create rating object
      const ratingData = {
        rating,
        comment,
        timestamp: new Date().toISOString(),
        ratedBy: user.uid,
        ratedByName: user.displayName || 'Anonymous',
        rideId,
        ratedUserId
      };

      // Update the ride with the rating
      const ratingField = userType === 'driver' ? 'driverRating' : 'passengerRating';
      await updateDocument('rides', rideId, {
        [ratingField]: ratingData,
        updatedAt: new Date()
      });

      // Add to ratings collection for analytics
      const ratingId = await addDocument('ratings', {
        ...ratingData,
        userType: userType === 'driver' ? 'passenger' : 'driver', // The type of user being rated
        createdAt: new Date()
      });

      // Calculate new average rating
      let newAverage = rating;
      let newTotal = 1;

      if (userRatings && userRatings.length > 0) {
        const total = userRatings.reduce((sum, r) => sum + r.rating, 0) + rating;
        newTotal = userRatings.length + 1;
        newAverage = total / newTotal;
      }

      // Update the user's average rating
      const userCollection = userType === 'driver' ? 'users' : 'drivers';
      await updateDocument(userCollection, ratedUserId, {
        rating: {
          average: newAverage,
          count: newTotal,
          lastRating: rating,
          lastComment: comment,
          lastRideId: rideId,
          updatedAt: new Date()
        },
        updatedAt: new Date()
      });

      // Add the new rating to the history
      setRatingHistory(prev => [
        {
          id: ratingId,
          ...ratingData
        },
        ...prev.slice(0, maxHistoryItems - 1)
      ]);

      // Update average rating and total count
      setAverageRating(newAverage);
      setTotalRatings(newTotal);

      setSubmitted(true);
      setLoading(false);

      if (onRatingSubmit) onRatingSubmit(ratingData);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(`Failed to submit rating: ${err.message}`);
      setLoading(false);
      if (onError) onError(err);
    }
  };

  // Validate comment length
  const validateComment = (text) => {
    if (text.length > 500) {
      setError('Comment must be less than 500 characters');
      return false;
    }
    setError(null);
    return true;
  };

  const handleCommentChange = (e) => {
    const text = e.target.value;
    if (validateComment(text)) {
      setComment(text);
    }
  };

  return (
    <div className="rating-system">
      <h3>Rate your {userType === 'driver' ? 'passenger' : 'driver'}</h3>

      {!ratingsLoading && ratedUserId && (
        <div className="rating-summary">
          <div className="average-rating">
            <span className="average-value">{averageRating.toFixed(1)}</span>
            <StarDisplay rating={Math.round(averageRating)} />
            <span className="total-ratings">({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</span>
          </div>
        </div>
      )}

      <StarRating 
        rating={rating} 
        setRating={setRating} 
        disabled={submitted} 
      />

      <textarea
        className="rating-comment"
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={handleCommentChange}
        disabled={submitted}
        maxLength={500}
      />

      <div className="comment-length">
        {comment.length}/500 characters
      </div>

      {error && <div className="rating-error">{error}</div>}

      {!submitted ? (
        <button 
          className="submit-rating-button" 
          onClick={submitRating} 
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      ) : (
        <div className="rating-submitted">
          Thank you for your feedback!
        </div>
      )}

      {showHistory && ratingHistory.length > 0 && (
        <div className="rating-history">
          <h4>Previous Ratings</h4>

          {historyLoading ? (
            <div className="loading">Loading rating history...</div>
          ) : (
            ratingHistory.map(item => (
              <div key={item.id} className="rating-item">
                <div className="rating-item-stars">
                  <StarDisplay rating={item.rating} />
                </div>
                <div className="rating-item-details">
                  <div className="rating-item-user">{item.ratedByName || 'Anonymous'}</div>
                  {item.comment && (
                    <div className="rating-item-comment">"{item.comment}"</div>
                  )}
                  <div className="rating-item-date">{formatDate(item.timestamp)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

RatingSystem.propTypes = {
  rideId: PropTypes.string.isRequired,
  userType: PropTypes.oneOf(['driver', 'passenger']).isRequired,
  showHistory: PropTypes.bool,
  maxHistoryItems: PropTypes.number,
  onRatingSubmit: PropTypes.func,
  onError: PropTypes.func
};

export default RatingSystem;
