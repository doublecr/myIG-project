import React, { useState, useEffect } from 'react';
import { UserPlus, Heart, MessageCircle, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import './Activity.css';

const Activity = () => {
  const [notifications, setNotifications] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed to fetch activity');
    } finally {
      setLoading(false);
      markAsRead();
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/users/notifications/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  const handleRequest = async (requesterId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/follow-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ requesterId, action })
      });
      if (response.ok) {
        setRequests(prev => prev.filter(r => r._id !== requesterId));
      }
    } catch (err) {
      console.error('Failed to handle request');
    }
  };

  if (loading) return <div className="loading">Loading activity...</div>;

  return (
    <div className="activity-page">
      <h2>Activity</h2>
      
      {requests.length > 0 && (
        <div className="activity-section">
          <h3>Follow Requests</h3>
          {requests.map(user => (
            <div key={user._id} className="activity-item request-item">
              <div className="activity-main">
                <img src={user.avatar || 'https://via.placeholder.com/150'} alt={user.username} className="activity-avatar" />
                <div className="activity-text">
                  <strong>{user.username}</strong> wants to follow you.
                </div>
              </div>
              <div className="request-actions">
                <button className="confirm-btn" onClick={() => handleRequest(user._id, 'accept')}>Confirm</button>
                <button className="delete-btn" onClick={() => handleRequest(user._id, 'reject')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="activity-section">
        {notifications.length > 0 ? (
          notifications.map((notif, idx) => (
            <div key={idx} className="activity-item">
              <div className="activity-main">
                <Link to={`/profile/${notif.from?.username}`}>
                  <img src={notif.from?.avatar || 'https://via.placeholder.com/150'} alt={notif.from?.username} className="activity-avatar" />
                </Link>
                <div className="activity-text">
                  <Link to={`/profile/${notif.from?.username}`}>
                    <strong>{notif.from?.username}</strong>
                  </Link> {
                    notif.type === 'follow' ? 'started following you.' :
                    notif.type === 'request' ? 'requested to follow you.' :
                    notif.type === 'like' ? 'liked your post.' :
                    notif.type === 'comment' ? 'commented on your post.' : 
                    notif.type === 'mention' ? 'mentioned you in their story.' : 'interacted with you.'
                  }
                  <span className="activity-time">{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-activity">No recent activity.</p>
        )}
      </div>
    </div>
  );
};

export default Activity;
