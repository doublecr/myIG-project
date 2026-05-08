import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import './StoryViewer.css';

const StoryViewer = ({ users, initialUserIndex, onClose }) => {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  const currentUserStories = users[currentUserIndex]?.stories || [];
  const currentStory = currentUserStories[currentStoryIndex];

  useEffect(() => {
    if (currentStory) {
      setIsLiked(currentStory.likes?.includes(currentUser.userId));
      recordView();
    }
  }, [currentStory, currentUser.userId]);

  const recordView = async () => {
    if (!currentStory || users[currentUserIndex]._id === currentUser.userId) return;
    try {
      await fetch(`${API_BASE_URL}/stories/${currentStory._id}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error('Failed to record view');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 50); // 5 seconds per story

    return () => clearInterval(timer);
  }, [currentUserIndex, currentStoryIndex]);

  const handleNext = () => {
    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(users[currentUserIndex - 1].stories.length - 1);
      setProgress(0);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE_URL}/stories/${currentStory._id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setIsLiked(!isLiked);
      }
    } catch (err) {
      console.error('Failed to like story');
    }
  };

  const handleRepost = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE_URL}/stories/${currentStory._id}/repost`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        alert('Added to your story!');
        window.location.reload();
      }
    } catch (err) {
      console.error('Repost failed');
    }
  };

  if (!currentStory) return null;

  const isMentioned = currentStory.mentions?.includes(currentUser.userId);

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-container" onClick={e => e.stopPropagation()}>
        <div className="story-progress-bars">
          {currentUserStories.map((_, idx) => (
            <div key={idx} className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        <div className="story-header">
          <Link to={`/profile/${users[currentUserIndex].username}`} className="story-user-info" onClick={onClose}>
            <img src={users[currentUserIndex].avatar || 'https://via.placeholder.com/150'} alt="" />
            <span>{users[currentUserIndex].username}</span>
            <span className="story-time">
              {(() => {
                const diff = Date.now() - new Date(currentStory.createdAt).getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor(diff / (1000 * 60));
                if (hours > 0) return `${hours}h`;
                if (minutes > 0) return `${minutes}m`;
                return 'Just now';
              })()}
            </span>
          </Link>
          <div className="story-header-actions">
            {users[currentUserIndex]._id === currentUser.userId && (
              <button onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm('Delete this story?')) {
                  try {
                    const response = await fetch(`${API_BASE_URL}/stories/${currentStory._id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (response.ok) {
                      window.location.reload();
                    }
                  } catch (err) {
                    console.error('Delete failed');
                  }
                }
              }} className="delete-story-btn">
                <Trash2 size={20} color="white" />
              </button>
            )}
            <button onClick={onClose}><X size={24} color="white" /></button>
          </div>
        </div>

        <div className="story-content">
          <img src={currentStory.imageUrl} alt="" />
          <div className="story-nav">
            <button className="nav-btn prev" onClick={handlePrev}><ChevronLeft size={32} /></button>
            <button className="nav-btn next" onClick={handleNext}><ChevronRight size={32} /></button>
          </div>
        </div>

        <div className="story-footer">
          {users[currentUserIndex]._id === currentUser.userId ? (
            <div className="seen-by" onClick={() => setShowViewers(true)}>
              <div className="seen-avatars">
                {currentStory.views?.slice(0, 3).map((viewer, i) => (
                  <img key={i} src={viewer.avatar || 'https://via.placeholder.com/150'} alt="" />
                ))}
              </div>
              <span>Activity {currentStory.views?.length || 0}</span>
            </div>
          ) : (
            <div className="story-footer-left">
              {isMentioned && (
                <button className="add-to-story-btn" onClick={handleRepost}>
                  Add to your story
                </button>
              )}
              <div className="story-reply-input">
                <input type="text" placeholder={`Reply to ${users[currentUserIndex].username}...`} />
              </div>
            </div>
          )}
          
          <div className="story-footer-actions">
            <button onClick={handleLike} className={isLiked ? 'liked' : ''}>
              <Heart size={24} fill={isLiked ? '#ed4956' : 'none'} color={isLiked ? '#ed4956' : 'white'} />
            </button>
            <button><Send size={24} color="white" /></button>
          </div>
        </div>

        {showViewers && (
          <div className="viewers-modal-overlay" onClick={() => setShowViewers(false)}>
            <div className="viewers-modal" onClick={e => e.stopPropagation()}>
              <div className="viewers-header">
                <h3>Viewers</h3>
                <button onClick={() => setShowViewers(false)}><X size={20} /></button>
              </div>
              <div className="viewers-list">
                {currentStory.views?.length > 0 ? currentStory.views.map((viewer, i) => (
                  <div key={i} className="viewer-item">
                    <div className="viewer-info">
                      <img src={viewer.avatar || 'https://via.placeholder.com/150'} alt="" />
                      <span>{viewer.username}</span>
                    </div>
                    <Link to={`/profile/${viewer.username}`} className="view-profile-btn" onClick={onClose}>View</Link>
                  </div>
                )) : (
                  <div className="no-viewers">No viewers yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
