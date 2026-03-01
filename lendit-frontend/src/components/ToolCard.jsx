import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FiStar, FiMapPin } from 'react-icons/fi';
import '../App.css';

const ToolCard = ({ tool }) => {
  const navigate = useNavigate();

  const imageUrl = tool.photoUrl
    ? `http://localhost:8080${tool.photoUrl}`
    : 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <div className="tool-card" onClick={() => navigate(`/tools/${tool.id}`)}>
      <div className="tool-card-image">
        <img src={imageUrl} alt={tool.name} />
        {!tool.available && <span className="badge unavailable">Unavailable</span>}
      </div>
      <div className="tool-card-body">
        <h3 className="tool-card-title">{tool.name}</h3>
        <p className="tool-card-category">{tool.categoryName}</p>
        <div className="tool-card-meta">
          <span className="tool-card-price">₹{tool.pricePerDay}/day</span>
          {tool.distance !== undefined && tool.distance !== null && (
            <span className="tool-card-distance">
              <FiMapPin size={14} /> {tool.distance.toFixed(1)} km
            </span>
          )}
        </div>
        {tool.ownerRating > 0 && (
          <div className="tool-card-rating">
            <FiStar size={14} /> {tool.ownerRating.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
};

ToolCard.propTypes = {
  tool: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    categoryName: PropTypes.string,
    pricePerDay: PropTypes.number,
    photoUrl: PropTypes.string,
    available: PropTypes.bool,
    distance: PropTypes.number,
    ownerRating: PropTypes.number,
  }).isRequired,
};

export default ToolCard;
