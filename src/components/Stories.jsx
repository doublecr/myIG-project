import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, Check } from 'lucide-react';
import StoryViewer from './StoryViewer';
import API_BASE_URL from '../config';
import './Stories.css';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isMentionModalOpen, setIsMentionModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stories/feed`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Group stories by user
        const grouped = data.reduce((acc, story) => {
          const userId = story.user._id;
          if (!acc[userId]) {
            acc[userId] = {
              ...story.user,
              stories: []
            };
          }
          acc[userId].stories.push(story);
          return acc;
        }, {});
        setStories(Object.values(grouped));
      }
    } catch (err) {
      console.error('Failed to fetch stories');
    }
  };

  const handleAddStoryClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsMentionModalOpen(true);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      try {
        const res = await fetch(`${API_BASE_URL}/users/search?query=${query}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search failed');
      }
    } else {
      setSearchResults([]);
    }
  };

  const toggleMention = (user) => {
    if (mentions.find(m => m._id === user._id)) {
      setMentions(mentions.filter(m => m._id !== user._id));
    } else {
      setMentions([...mentions, user]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        const response = await fetch(`${API_BASE_URL}/stories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            imageUrl: base64String,
            mentions: mentions.map(m => m._id)
          })
        });
        if (response.ok) {
          setIsMentionModalOpen(false);
          setMentions([]);
          fetchStories();
        }
      } catch (err) {
        console.error('Failed to post story');
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const openViewer = (index) => {
    setStartIndex(index);
    setIsViewerOpen(true);
  };

  return (
    <div className="stories-bar">
      <div className="story-item own-story">
        <div className="story-avatar" onClick={handleAddStoryClick}>
          <img src={currentUser.avatar || 'https://via.placeholder.com/150'} alt="Your Story" />
          <div className="add-story-badge">
            <Plus size={14} color="white" />
          </div>
        </div>
        <span className="story-username">Your Story</span>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {stories.map((user, index) => {
        const isAllViewed = user.stories.every(story => 
          story.views?.some(view => view._id === currentUser.userId || view === currentUser.userId)
        );
        
        return (
          <div key={user._id} className="story-item" onClick={() => openViewer(index)}>
            <div className={`story-avatar ${isAllViewed ? 'viewed' : 'has-story'}`}>
              <img src={user.avatar || 'https://via.placeholder.com/150'} alt={user.username} />
            </div>
            <span className="story-username">{user.username}</span>
          </div>
        );
      })}

      {isViewerOpen && (
        <StoryViewer 
          users={stories} 
          initialUserIndex={startIndex} 
          onClose={() => setIsViewerOpen(false)} 
        />
      )}
      {isMentionModalOpen && (
        <div className="mention-modal-overlay">
          <div className="mention-modal">
            <div className="mention-header">
              <h3>Mention People</h3>
              <button onClick={() => setIsMentionModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="mention-search">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search people..." 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="search-results">
              {searchResults.map(user => (
                <div key={user._id} className="search-user-item" onClick={() => toggleMention(user)}>
                  <div className="user-info">
                    <img src={user.avatar || 'https://via.placeholder.com/150'} alt="" />
                    <span>{user.username}</span>
                  </div>
                  <div className={`checkbox ${mentions.find(m => m._id === user._id) ? 'checked' : ''}`}>
                    {mentions.find(m => m._id === user._id) && <Check size={14} color="white" />}
                  </div>
                </div>
              ))}
            </div>
            {mentions.length > 0 && (
              <div className="selected-mentions">
                {mentions.map(user => (
                  <div key={user._id} className="mention-tag">
                    @{user.username}
                    <X size={12} onClick={() => toggleMention(user)} />
                  </div>
                ))}
              </div>
            )}
            <button className="story-share-btn" onClick={handleUpload}>Share Story</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;
