import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiUpload, FiCalendar, FiX } from 'react-icons/fi';
import { getCategories, addTool } from '../api/api';
import { formatApiDate, formatDisplayDate } from '../utils/date';

const AddToolPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => setError('Failed to load categories'));
  }, []);

  const handleDateChange = (date) => {
    if (!date) return;
    const exists = blockedDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
    if (!exists) {
      setBlockedDates([...blockedDates, date]);
    }
  };

  const removeDate = (index) => {
    setBlockedDates(blockedDates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Tool name is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const toolData = {
        name: name.trim(),
        description: description.trim(),
        categoryId: Number(categoryId),
      };

      if (blockedDates.length > 0) {
        toolData.blockedDates = blockedDates.map(
          (d) => formatApiDate(d)
        );
      }

      const formData = new FormData();
      formData.append(
        'tool',
        new Blob([JSON.stringify(toolData)], { type: 'application/json' })
      );
      if (photo) {
        formData.append('photo', photo);
      }

      await addTool(formData);
      navigate('/my-tools');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add tool');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '20px 0' }}>
      <div className="auth-card">
        <h2 className="auth-title">List a New Tool</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tool Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Drill Machine"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your tool..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label><FiUpload size={14} style={{ marginRight: 6 }} />Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0] || null)}
            />
          </div>

          <div className="form-group">
            <label><FiCalendar size={14} style={{ marginRight: 6 }} />Blocked Dates</label>
            <DatePicker
              onChange={handleDateChange}
              placeholderText="Click to add dates when tool is unavailable"
              minDate={new Date()}
              dateFormat="dd-MM-yyyy"
              className="form-group-input"
            />
            {blockedDates.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {blockedDates.map((date, i) => (
                  <span
                    key={i}
                    style=
                    {{
                      background: 'var(--sky-blue)',
                      padding: '4px 10px',
                      borderRadius: 16,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {formatDisplayDate(date)}
                    <FiX
                      size={14}
                      style={{ cursor: 'pointer' }}
                      onClick={() => removeDate(i)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'List Tool'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddToolPage;
