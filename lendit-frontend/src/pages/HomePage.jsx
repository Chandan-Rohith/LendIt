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
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  }, []);

  const fetchTools = useCallback(async () => {
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
    fetchTools();
    fetchCategories();
  }, [fetchTools, fetchCategories]);

  // Re-fetch tools when ephemeral location becomes available so distances update
  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  

  const handleSearch = async () => {
    if (!keyword.trim()) {
      fetchTools();
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
