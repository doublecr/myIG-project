import React, { useState, useEffect } from 'react';
import Stories from '../components/Stories';
import Post from '../components/Post';
import Suggestions from '../components/Suggestions';
import API_BASE_URL from '../config';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/feed`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (err) {
        console.error('Failed to fetch feed');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  return (
    <div className="home-page">
      <div className="feed-layout">
        <div className="feed-content">
          <Stories />
          <div className="posts-list">
            {loading ? (
              <div className="loading">Loading feed...</div>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <Post 
                  key={post._id} 
                  post={post}
                  onLike={() => {}}
                  onDelete={(postId) => {
                    setPosts(prev => prev.filter(p => p._id !== postId));
                  }}
                />
              ))
            ) : (
              <div className="empty-feed">
                <h2>Welcome to Voltext</h2>
                <p>Follow people to see their posts here!</p>
              </div>
            )}
          </div>
        </div>
        <div className="suggestions-aside">
          <Suggestions />
        </div>
      </div>
    </div>
  );
};

export default Home;
