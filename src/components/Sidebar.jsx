import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Search, Compass, Film, MessageCircle, Heart, PlusSquare, User, Settings as SettingsIcon, Menu, Bookmark, LogOut, Activity, Moon, Sun } from 'lucide-react';
import API_BASE_URL from '../config';
import './Sidebar.css';

const Sidebar = ({ onCreateClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // General notifications
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const moreRef = useRef(null);
  const theme = localStorage.getItem('theme') || 'light';

  useEffect(() => {
    fetchAllCounts();
    const interval = setInterval(fetchAllCounts, 10000); // Check every 10 seconds
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

  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  const menuItems = [
    { icon: <HomeIcon size={24} />, label: 'Home', path: '/' },
    { icon: <Search size={24} />, label: 'Search', path: '/search' },
    { icon: <Compass size={24} />, label: 'Explore', path: '/explore' },
    { icon: <Film size={24} />, label: 'Reels', path: '/reels' },
    { icon: <MessageCircle size={24} />, label: 'Messages', path: '/messages' },
    { icon: <Heart size={24} />, label: 'Notifications', path: '/activity' },
    { icon: <PlusSquare size={24} />, label: 'Create', path: '/create' },
    { 
      icon: <img 
        src={currentUser.avatar || 'https://via.placeholder.com/150'} 
        alt="P" 
        className="sidebar-avatar-icon" 
      />, 
      label: 'Profile', 
      path: `/profile/${currentUser.username}` 
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    document.body.className = `theme-${newTheme}`;
    setIsMoreOpen(false);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="sidebar">
      <Link to="/" className="sidebar-logo">
        <h1 className="logo-text">Voltext</h1>
        <div className="logo-icon">
          <Heart size={24} fill="currentColor" />
        </div>
      </Link>
      
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          item.label === 'Create' ? (
            <div 
              key={index} 
              className="nav-item" 
              onClick={onCreateClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          ) : (
            <Link 
              key={index} 
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">
                {item.icon}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="notification-dot"></span>
                )}
                {item.label === 'Messages' && messageUnreadCount > 0 && (
                  <span className="message-badge">
                    {messageUnreadCount > 4 ? '4+' : messageUnreadCount}
                  </span>
                )}
              </span>
              <span className="nav-label">{item.label}</span>
            </Link>
          )
        ))}
      </nav>

      <div className="sidebar-more" ref={moreRef}>
        {isMoreOpen && (
          <div className="more-dropdown">
            <Link to="/settings" className="dropdown-item" onClick={() => setIsMoreOpen(false)}>
              <SettingsIcon size={18} />
              <span>Settings</span>
            </Link>
            <Link to="/activity" className="dropdown-item" onClick={() => setIsMoreOpen(false)}>
              <Activity size={18} />
              <span>Your activity</span>
            </Link>
            <Link to="/profile" state={{ activeTab: 'saved' }} className="dropdown-item" onClick={() => setIsMoreOpen(false)}>
              <Bookmark size={18} />
              <span>Saved</span>
            </Link>
            <div className="dropdown-item" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              <span>Switch appearance</span>
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Log out</span>
            </div>
          </div>
        )}
        <div 
          className={`nav-item ${isMoreOpen ? 'active-more' : ''}`} 
          onClick={() => setIsMoreOpen(!isMoreOpen)}
        >
          <span className="nav-icon"><Menu size={24} /></span>
          <span className="nav-label">More</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
