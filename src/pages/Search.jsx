import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, User, MessageCircle } from 'lucide-react';
import API_BASE_URL from '../config';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/search?query=${val}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Search</h1>
        <div className="search-input-wrapper">
          <SearchIcon size={18} className="search-icon-svg" />
          <input 
            type="text" 
            placeholder="Search accounts..." 
            value={query}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="search-results">
        {loading ? (
          <div className="search-status">Searching...</div>
        ) : results.length > 0 ? (
          results.map(user => (
            <div key={user._id} className="search-result-item">
              <Link to={`/profile/${user.username}`} className="result-main-info">
                <div className="result-avatar">
                  <img src={user.avatar || 'https://via.placeholder.com/150'} alt={user.username} />
                </div>
                <div className="result-info">
                  <span className="result-username">{user.username}</span>
                  <span className="result-bio">{user.bio || 'Voltext user'}</span>
                </div>
              </Link>
              <Link 
                to="/messages" 
                state={{ selectedUser: user }} 
                className="result-message-btn"
              >
                Message
              </Link>
            </div>
          ))
        ) : query.length >= 2 ? (
          <div className="search-status">No users found for "{query}"</div>
        ) : (
          <div className="search-status">Recent searches will appear here.</div>
        )}
      </div>
    </div>
  );
};

export default Search;
