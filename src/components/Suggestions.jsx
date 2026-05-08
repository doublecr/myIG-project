import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import './Suggestions.css';

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/suggestions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions');
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollow = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/follow/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setSuggestions(suggestions.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error('Follow failed');
    }
  };

  return (
    <div className="suggestions">
      <div className="current-user">
        <Link to={`/profile/${currentUser.username}`} className="user-profile">
          <div className="profile-avatar main">
             <img src={currentUser.avatar || 'https://via.placeholder.com/150'} alt="avatar" style={{width: '100%', height: '100%', borderRadius: '50%'}} />
          </div>
          <div className="user-info">
            <span className="username">{currentUser.username}</span>
            <span className="fullname">{currentUser.fullname || currentUser.username}</span>
          </div>
        </Link>
        <button className="switch-btn" onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>
      </div>

      <div className="suggestions-header">
        <span>Suggested for you</span>
        <button className="see-all">See All</button>
      </div>

      <div className="suggestions-list">
        {suggestions.length > 0 ? suggestions.map((user) => (
          <div key={user._id} className="suggestion-item">
            <Link to={`/profile/${user.username}`} className="user-profile">
              <div className="profile-avatar">
                <img src={user.avatar || 'https://via.placeholder.com/150'} alt={user.username} style={{width: '100%', height: '100%', borderRadius: '50%'}} />
              </div>
              <div className="user-info">
                <span className="username">{user.username}</span>
                <span className="relation">Suggested for you</span>
              </div>
            </Link>
            <button className="follow-btn" onClick={() => handleFollow(user._id)}>Follow</button>
          </div>
        )) : (
          <p style={{fontSize: '12px', color: 'var(--text-secondary)'}}>No new suggestions</p>
        )}
      </div>

      <footer className="sidebar-footer">
        <nav>
          <a href="#">About</a> • <a href="#">Help</a> • <a href="#">Press</a> • <a href="#">API</a> • 
          <a href="#">Jobs</a> • <a href="#">Privacy</a> • <a href="#">Terms</a> • <a href="#">Locations</a>
        </nav>
        <div className="copyright">© 2026 VOLTEXT BY ANTIGRAVITY</div>
      </footer>
    </div>
  );
};

export default Suggestions;
