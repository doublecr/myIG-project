import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import API_BASE_URL from '../config';
import './MobileHeader.css';

const MobileHeader = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  useEffect(() => {
    fetchAllCounts();
    const interval = setInterval(fetchAllCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllCounts = () => {
    fetchUnreadCount();
    fetchMessageUnreadCount();
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Failed to fetch notification count');
    }
  };

  const fetchMessageUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessageUnreadCount(data.count);
      }
    } catch (err) {
      console.error('Failed to fetch message count');
    }
  };

  return (
    <header className="mobile-header">
      <Link to="/" className="mobile-logo">
        <h1 className="logo-text">Voltext</h1>
      </Link>
      
      <div className="mobile-header-actions">
        <Link to="/activity" className="mobile-header-icon">
          <Heart size={24} />
          {unreadCount > 0 && <span className="notification-dot"></span>}
        </Link>
        <Link to="/messages" className="mobile-header-icon">
          <MessageCircle size={24} />
          {messageUnreadCount > 0 && (
            <span className="message-badge">
              {messageUnreadCount > 4 ? '4+' : messageUnreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default MobileHeader;
