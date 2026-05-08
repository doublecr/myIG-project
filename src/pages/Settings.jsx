import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Lock, Globe, Palette, User, Camera, Check, ChevronRight } from 'lucide-react';
import API_BASE_URL from '../config';
import './Settings.css';

const Settings = () => {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [username, setUsername] = useState(currentUser.username || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [isPrivate, setIsPrivate] = useState(currentUser.isPrivate || false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('edit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/suggestions`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Failed to fetch suggestions');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setAvatar(base64);
      try {
        const response = await fetch(`${API_BASE_URL}/users/avatar`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ avatar: base64 })
        });
        if (response.ok) {
          const updatedUser = { ...currentUser, avatar: base64 };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
          setMessage('Profile picture updated!');
          setTimeout(() => setMessage(''), 3000);
        }
      } catch (err) {
        console.error('Avatar update failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username, bio })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedUser = { ...currentUser, username: data.username, bio: data.bio };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Update failed');
      }
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const togglePrivacy = async () => {
    const newVal = !isPrivate;
    try {
      const response = await fetch(`${API_BASE_URL}/users/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isPrivate: newVal })
      });
      if (response.ok) {
        setIsPrivate(newVal);
        const updatedUser = { ...currentUser, isPrivate: newVal };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error('Failed to update privacy');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <aside className="settings-sidebar">
          <h3>Settings</h3>
          <div className="settings-nav">
            <div 
              className={`nav-item ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              <User size={20} /> <span>Edit Profile</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Lock size={20} /> <span>Privacy</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={20} /> <span>Appearance</span>
            </div>
          </div>
        </aside>

        <main className="settings-main">
          {activeTab === 'edit' && (
            <section className="edit-profile-section">
              <div className="profile-photo-change">
                <div className="avatar-preview">
                  <img src={avatar || 'https://via.placeholder.com/150'} alt="Avatar" />
                </div>
                <div className="photo-info">
                  <span className="username-display">{currentUser.username}</span>
                  <button className="change-photo-btn" onClick={() => fileInputRef.current.click()}>
                    Change profile photo
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
                </div>
              </div>

              <form className="edit-form" onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                  />
                  <p className="help-text">In most cases, you'll be able to change your username back to {currentUser.username} for another 14 days.</p>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    maxLength={150}
                  ></textarea>
                  <span className="char-count">{bio.length} / 150</span>
                </div>

                <div className="form-submit">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Submit'}
                  </button>
                </div>
                
                {message && (
                  <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
                    {message.includes('success') && <Check size={16} />}
                    {message}
                  </div>
                )}
              </form>

              <div className="suggestions-section">
                <div className="section-header">
                  <h4>Suggested for you</h4>
                  <button className="see-all">See All</button>
                </div>
                <div className="suggestions-list">
                  {suggestions.map(s => (
                    <div key={s._id} className="suggestion-item">
                      <img src={s.avatar || 'https://via.placeholder.com/150'} alt={s.username} />
                      <div className="suggestion-info">
                        <strong>{s.username}</strong>
                        <span>Suggested for you</span>
                      </div>
                      <button className="follow-btn-small">Follow</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'privacy' && (
            <section className="privacy-section">
              <div className="settings-item-row" onClick={togglePrivacy}>
                <div className="item-label">
                  <Lock size={20} />
                  <div className="label-text">
                    <strong>Private Account</strong>
                    <p>When your account is private, only people you approve can see your photos and videos.</p>
                  </div>
                </div>
                <div className={`toggle-switch ${isPrivate ? 'on' : ''}`}>
                  <div className="switch-handle"></div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'appearance' && (
            <section className="appearance-section">
              <div className="settings-item-row">
                <div className="item-label">
                  <Palette size={20} />
                  <span>Theme Preference</span>
                </div>
                <div className="appearance-toggle">
                  {theme === 'light' ? (
                    <button onClick={() => setTheme('dark')} className="theme-btn"><Moon size={20} /> Switch to Dark</button>
                  ) : (
                    <button onClick={() => setTheme('light')} className="theme-btn"><Sun size={20} /> Switch to Light</button>
                  )}
                </div>
              </div>
            </section>
          )}

          <div className="other-settings">
            <div className="settings-item-row danger" onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}>
              <div className="item-label">
                <LogOut size={20} />
                <span>Log Out</span>
              </div>
              <ChevronRight size={20} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
