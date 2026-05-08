import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import API_BASE_URL from '../config';
import './Reels.css';

const Reels = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/explore`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (err) {
        console.error('Failed to fetch reels');
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, []);

  return (
    <div className="reels-page">
      <div className="reels-container">
        {loading ? (
          <div className="loading-reels">Preparing your feed...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post._id} className="reel-item">
              <div className="reel-video-placeholder">
                <img src={post.imageUrl} alt="Reel content" />
              </div>
              
              <div className="reel-overlay">
                <div className="reel-right-actions">
                  <div className="reel-action">
                    <Heart size={32} />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="reel-action">
                    <MessageCircle size={32} />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                  <div className="reel-action">
                    <Send size={32} />
                  </div>
                  <div className="reel-action">
                    <Bookmark size={32} />
                  </div>
                  <div className="reel-action">
                    <MoreHorizontal size={32} />
                  </div>
                </div>

                <div className="reel-bottom-info">
                  <div className="reel-user">
                    <img src={post.user.avatar || 'https://via.placeholder.com/150'} alt={post.user.username} />
                    <span>{post.user.username}</span>
                    <button className="follow-reel-btn">Follow</button>
                  </div>
                  <p className="reel-caption">{post.caption}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-reels">No reels available.</div>
        )}
      </div>
    </div>
  );
};

export default Reels;
