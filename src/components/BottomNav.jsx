import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Film, PlusSquare, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ onCreateClick }) => {
  const location = useLocation();

  return (
    <div className="bottom-nav">
      <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={26} />
      </Link>
      <Link to="/search" className={`bottom-nav-item ${location.pathname === '/search' ? 'active' : ''}`}>
        <Search size={26} />
      </Link>
      <Link to="/reels" className={`bottom-nav-item ${location.pathname === '/reels' ? 'active' : ''}`}>
        <Film size={26} />
      </Link>
      <div className="bottom-nav-item" onClick={onCreateClick}>
        <PlusSquare size={26} />
      </div>
      <Link to="/profile" className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <User size={26} />
      </Link>
    </div>
  );
};

export default BottomNav;
