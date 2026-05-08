import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import './Explore.css';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExplore = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/explore`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (err) {
        console.error('Failed to fetch explore');
      } finally {
        setLoading(false);
      }
    };
    fetchExplore();
  }, []);

  return (
    <div className="explore-page">
      <div className="explore-grid">
        {loading ? (
          <div className="loading">Discovery in progress...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Link key={post._id} to={`/post/${post._id}`} className="explore-item">
              <img src={post.imageUrl} alt="Explore content" />
              {post.mediaType === 'video' && (
                <div className="video-icon-indicator">
                  <Play size={18} fill="white" />
                </div>
              )}
              <div className="explore-overlay">
                <div className="overlay-info">
                  <span><Heart size={20} fill="white" /> {post.likes?.length || 0}</span>
                  <span><MessageCircle size={20} fill="white" /> {post.comments?.length || 0}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-discovery">No posts yet to discover.</div>
        )}
      </div>
    </div>
  );
};

export default Explore;
