import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Settings, Grid, Bookmark, Tag, Heart, MessageCircle, Camera, Lock, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config';
import './Profile.css';

const Profile = () => {
  const { username: urlUsername } = useParams();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const targetUsername = urlUsername || currentUser.username;
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'posts'); // 'posts' or 'saved'
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [targetUsername]);

  const handleBioUpdate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/bio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bio: tempBio })
      });
      if (response.ok) {
        setProfile({ ...profile, bio: tempBio });
        setIsEditingBio(false);
        // Update local storage too
        const localUser = JSON.parse(localStorage.getItem('user'));
        localUser.bio = tempBio;
        localStorage.setItem('user', JSON.stringify(localUser));
      }
    } catch (err) {
      console.error('Failed to update bio');
    }
  };

  const fetchData = async () => {
    try {
      const profResponse = await fetch(`${API_BASE_URL}/users/profile/${targetUsername}`);
      if (profResponse.ok) {
        const profData = await profResponse.json();
        setProfile(profData);

        const isFollowing = profData.followers?.some(f => f._id === currentUser.userId);
        const isOwn = currentUser.username === targetUsername;

        if (isOwn || !profData.isPrivate || isFollowing) {
          const postsResponse = await fetch(`${API_BASE_URL}/posts/user/${targetUsername}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            setPosts(postsData);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/saved`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch saved posts');
    }
  };

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedPosts();
    }
  }, [activeTab]);

  const handleFollow = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/follow/${profile._id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to follow');
    }
  };

  const handleAvatarClick = () => {
    if (currentUser.username === profile?.username) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        const response = await fetch(`${API_BASE_URL}/users/avatar`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ avatar: base64String })
        });
        if (response.ok) {
          const updatedUser = await response.json();
          setProfile({ ...profile, avatar: updatedUser.avatar });
          const localUser = JSON.parse(localStorage.getItem('user'));
          localUser.avatar = updatedUser.avatar;
          localStorage.setItem('user', JSON.stringify(localUser));
        }
      } catch (err) {
        console.error('Failed to upload avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!profile) return <div className="error">User not found</div>;

  const isOwnProfile = currentUser.username === profile.username;
  const isFollowing = profile.followers?.some(f => f._id === currentUser.userId);
  const showContent = isOwnProfile || !profile.isPrivate || isFollowing;

  const displayPosts = activeTab === 'posts' ? posts : savedPosts;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-image-container">
          <div className={`profile-image ${isOwnProfile ? 'editable' : ''}`} onClick={handleAvatarClick}>
            {profile.avatar ? <img src={profile.avatar} alt="Profile" /> : <div className="avatar-placeholder"><Camera size={40} color="var(--text-secondary)" /></div>}
            {isOwnProfile && <div className="edit-overlay"><Camera size={24} /></div>}
          </div>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
        </div>

        <section className="profile-details">
          <div className="profile-title">
            <h2>{profile.username}</h2>
            <div className="profile-actions">
              {isOwnProfile ? (
                <>
                  <Link to="/settings" className="edit-btn">Edit Profile</Link>
                  <Link to="/settings" className="settings-btn"><Settings size={20} /></Link>
                </>
              ) : (
                <>
                  {isFollowing ? (
                    <button className="unfollow-btn-main">Following</button>
                  ) : (
                    <button className="follow-btn-main" onClick={handleFollow}>Follow</button>
                  )}
                  <Link to="/messages" state={{ selectedUser: profile }} className="message-btn-main">Message</Link>
                </>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item"><strong>{posts.length}</strong> <span>posts</span></div>
            <div className="stat-item"><strong>{profile.followers?.length || 0}</strong> <span>followers</span></div>
            <div className="stat-item"><strong>{profile.following?.length || 0}</strong> <span>following</span></div>
          </div>

          <div className="profile-bio">
            <div className="bio-header">
              <span className="full-name">{profile.username}</span>
              {isOwnProfile && !isEditingBio && (
                <button 
                  className="edit-bio-btn" 
                  onClick={() => {
                    setTempBio(profile.bio || '');
                    setIsEditingBio(true);
                  }}
                >
                  Edit Bio
                </button>
              )}
            </div>
            
            {isEditingBio ? (
              <div className="bio-edit-container">
                <textarea 
                  value={tempBio} 
                  onChange={(e) => setTempBio(e.target.value)}
                  placeholder="Write a bio..."
                  maxLength={150}
                />
                <div className="bio-edit-actions">
                  <button onClick={handleBioUpdate} className="save-bio-btn">Save</button>
                  <button onClick={() => setIsEditingBio(false)} className="cancel-bio-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <p>{profile.bio || 'Welcome to my Voltext profile! 🚀'}</p>
            )}
          </div>
        </section>
      </header>

      {showContent ? (
        <>
          <div className="profile-tabs">
            <div 
              className={`tab ${activeTab === 'posts' ? 'active' : ''}`} 
              onClick={() => setActiveTab('posts')}
            >
              <Grid size={12} /> POSTS
            </div>
            {isOwnProfile && (
              <div 
                className={`tab ${activeTab === 'saved' ? 'active' : ''}`} 
                onClick={() => setActiveTab('saved')}
              >
                <Bookmark size={12} /> SAVED
              </div>
            )}
            <div className="tab"><Tag size={12} /> TAGGED</div>
          </div>

          <div className="profile-grid">
            {displayPosts.length > 0 ? (
              displayPosts.map((post) => (
                <div key={post._id} className="grid-item">
                  <img src={post.imageUrl} alt="Post" />
                  {post.mediaType === 'video' && (
                    <div className="video-icon-indicator">
                      <Play size={18} fill="white" />
                    </div>
                  )}
                  <div className="grid-overlay">
                    <span><Heart size={20} fill="white" /> {post.likes?.length || 0}</span>
                    <span><MessageCircle size={20} fill="white" /> {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-posts">
                <p>{activeTab === 'posts' ? 'No Posts Yet' : 'No Saved Posts Yet'}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="private-placeholder">
          <div className="lock-icon-circle"><Lock size={40} /></div>
          <h3>This account is private</h3>
          <p>Follow to see their photos and videos.</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
