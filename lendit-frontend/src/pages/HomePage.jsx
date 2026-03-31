import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTools, getCategories, searchTools, getToolsByCategory } from '../api/api';
import ToolCard from '../components/ToolCard';
import '../App.css';

const HomePage = () => {
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const { location } = useAuth();

  const fetchCategories = useCallback(async () => {
    try 
    {
      const res = await getCategories();
      setCategories(res.data);
    } 
    catch (err) 
    {
      console.error('Failed to fetch categories', err);
    }
  }, []);

  const fetchTools = useCallback(async () => {
    // Wait for live browser location before fetching. If `location` is
    // null it means we haven't obtained coordinates yet (or the user
    // hasn't allowed them) — do not make the tools request.
    if (!location || location.latitude == null || location.longitude == null) return;

    setLoading(true);
    try {
      const res = await getTools(location);
      setTools(res.data);
    } catch (err) {
      console.error('Failed to fetch tools', err);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch nearby tools only after a live location is available.
  useEffect(() => {
    if (!location || location.latitude == null || location.longitude == null) return;
    fetchTools();
  }, [location, fetchTools]);

  

  const handleSearch = async () => {
    if (!keyword.trim()) {
      fetchTools();
      return;
    }
    if (!location || location.latitude == null || location.longitude == null) {
      setTools([]);
      return;
    }

    setLoading(true);
    try {
      const res = await searchTools(keyword, location);
      setTools(res.data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (categoryId) => {
    setSelectedCategory(categoryId);
    if (!categoryId) {
      fetchTools();
      return;
    }
    if (!location || location.latitude == null || location.longitude == null) 
      {
      setTools([]);
      return;
    }

    setLoading(true);
    try {
      const res = await getToolsByCategory(categoryId, location);
      setTools(res.data);
    } catch (err) {
      console.error('Category filter failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <h2>Browse Tools Nearby</h2>
        {(!location || location.latitude == null || location.longitude == null) && (
          <p className="loading">Allow location access to view tools within 10 km of your current position.</p>
        )}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search tools..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
        <div className="category-filter">
          <button
            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => handleCategoryFilter('')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading tools...</p>
      ) : tools.length === 0 ? (
        <div className="empty-state">
          <p>No tools found nearby. Be the first to list one!</p>
        </div>
      ) : (
        <div className="tools-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
