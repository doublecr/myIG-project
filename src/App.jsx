import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Search from './pages/Search';
import Messages from './pages/Messages';
import Explore from './pages/Explore';
import Reels from './pages/Reels';
import Settings from './pages/Settings';
import Activity from './pages/Activity';
import CreatePost from './components/CreatePost';
import MobileHeader from './components/MobileHeader';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.className = `theme-${theme}`;
    
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
      const newTheme = localStorage.getItem('theme') || 'light';
      document.body.className = `theme-${newTheme}`;
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const ProtectedLayout = ({ children }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    if (!isAuthenticated) return <Navigate to="/login" />;
    return (
      <div className="app-container">
        <MobileHeader />
        <Sidebar onCreateClick={() => setIsCreateModalOpen(true)} />
        <main className="main-content">
          {children}
        </main>
        <BottomNav onCreateClick={() => setIsCreateModalOpen(true)} />
        <CreatePost 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onPostCreated={() => window.location.reload()} 
        />
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
        
        <Route path="/" element={
          <ProtectedLayout>
            <Home />
          </ProtectedLayout>
        } />
        
        <Route path="/profile" element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        } />

        <Route path="/profile/:username" element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        } />

        <Route path="/search" element={
          <ProtectedLayout>
            <Search />
          </ProtectedLayout>
        } />

        <Route path="/messages" element={
          <ProtectedLayout>
            <Messages />
          </ProtectedLayout>
        } />

        <Route path="/explore" element={
          <ProtectedLayout>
            <Explore />
          </ProtectedLayout>
        } />

        <Route path="/reels" element={
          <ProtectedLayout>
            <Reels />
          </ProtectedLayout>
        } />

        <Route path="/settings" element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        } />

        <Route path="/activity" element={
          <ProtectedLayout>
            <Activity />
          </ProtectedLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
