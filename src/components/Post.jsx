import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import API_BASE_URL from '../config';
import './Post.css';

const Post = ({ post, onLike, onDelete }) => {
  const [comment, setComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    if (post.likes.includes(currentUser.userId)) {
      setIsLiked(true);
    }
    const localUser = JSON.parse(localStorage.getItem('user')) || {};
    if (localUser.savedPosts?.includes(post._id)) {
      setIsSaved(true);
    }
  }, [post, currentUser.userId]);

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setIsLiked(!isLiked);
        if (onLike) onLike();
      }
    } catch (err) {
      console.error('Like failed');
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.saved);
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (data.saved) {
          localUser.savedPosts = [...(localUser.savedPosts || []), post._id];
        } else {
          localUser.savedPosts = localUser.savedPosts.filter(id => id !== post._id);
        }
        localStorage.setItem('user', JSON.stringify(localUser));
      }
    } catch (err) {
      console.error('Save failed');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${post._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          if (onDelete) onDelete(post._id);
        }
      } catch (err) {
        console.error('Delete failed');
      }
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${post._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: comment })
      });
      if (response.ok) {
        setComment('');
        if (onLike) onLike();
      }
    } catch (err) {
      console.error('Comment failed');
    }
  };

  const isAuthor = currentUser.userId === post.user._id;

  return (
    <article className="post">
      <div className="post-header">
        <Link to={`/profile/${post.user.username}`} className="post-user">
          <img src={post.user.avatar || 'https://via.placeholder.com/150'} alt={post.user.username} />
          <span className="username">{post.user.username}</span>
        </Link>
        <div className="post-more-container">
          <button className="post-more" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <MoreHorizontal size={20} />
          </button>
          {isMenuOpen && (
            <div className="post-dropdown-menu">
              {isAuthor && (
                <button className="delete-option" onClick={handleDelete}>Delete</button>
              )}
              <button onClick={() => setIsMenuOpen(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="post-image">
        {post.mediaType === 'video' ? (
          <video 
            src={post.imageUrl} 
            controls 
            autoPlay
            muted
            loop
            playsInline
            className="post-video" 
            onDoubleClick={handleLike}
          />
        ) : (
          <img src={post.imageUrl} alt="Post" onDoubleClick={handleLike} />
        )}
      </div>

      <div className="post-actions">
        <div className="left-actions">
          <button onClick={handleLike} className={isLiked ? 'liked' : ''}>
            <Heart size={24} fill={isLiked ? 'var(--error)' : 'none'} stroke={isLiked ? 'var(--error)' : 'currentColor'} />
          </button>
          <button><MessageCircle size={24} /></button>
          <button><Send size={24} /></button>
        </div>
        <button onClick={handleSave} className={isSaved ? 'saved' : ''}>
          <Bookmark size={24} fill={isSaved ? 'var(--text-primary)' : 'none'} stroke="currentColor" />
        </button>
      </div>

      <div className="post-content">
        <p className="likes-count"><strong>{post.likes.length} likes</strong></p>
        <p className="caption">
          <strong>{post.user.username}</strong> {post.caption}
        </p>
        
        {post.comments.length > 0 && (
          <div className="comments-preview">
            <p className="view-all">View all {post.comments.length} comments</p>
            {post.comments.slice(-2).map((c, i) => (
              <p key={i} className="comment-item">
                <strong>{c.username}</strong> {c.text}
              </p>
            ))}
          </div>
        )}
        
        <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      <form className="post-comment-input" onSubmit={handleComment}>
        <input 
          type="text" 
          placeholder="Add a comment..." 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit" disabled={!comment.trim()}>Post</button>
      </form>
    </article>
  );
};

export default Post;
