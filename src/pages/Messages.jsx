import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Phone, Video, Info, Mic, X, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import CallOverlay from '../components/CallOverlay';
import API_BASE_URL from '../config';
import './Messages.css';

const Messages = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [activeCall, setActiveCall] = useState(null); // { type: 'voice' | 'video', user: {} }
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const messagesEndRef = useRef(null);
  const chatMediaInputRef = useRef(null);

  const handleMediaSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedUser) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Media = reader.result;
      const type = file.type.startsWith('video') ? 'video' : 'image';
      
      try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            receiverId: selectedUser._id, 
            messageType: type,
            [type === 'image' ? 'imageUrl' : 'videoUrl']: base64Media 
          })
        });
        if (response.ok) {
          const data = await response.json();
          setMessages(prev => [...prev, data]);
          fetchConversations();
        }
      } catch (err) {
        console.error('Failed to send media');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Unsend this message?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to delete message');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await sendAudioMessage(base64Audio);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioUrl) => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          receiverId: selectedUser._id, 
          messageType: 'audio',
          audioUrl 
        })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data]);
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send audio message');
    }
  };

  useEffect(() => {
    if (location.state?.selectedUser) {
      setSelectedUser(location.state.selectedUser);
    }
  }, [location.state]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    let interval;
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      interval = setInterval(() => {
        fetchMessages(selectedUser._id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations');
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (JSON.stringify(data) !== JSON.stringify(messages)) {
          setMessages(data);
          // If the last message is from the other user and is unread, mark all as read
          const hasUnread = data.some(m => m.sender === userId && !m.isRead);
          if (hasUnread) {
            markAsRead(userId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages');
    }
  };

  const markAsRead = async (userId) => {
    try {
      await fetch(`${API_BASE_URL}/messages/${userId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      // Optionally refresh conversations list to update unread count
      fetchConversations();
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ receiverId: selectedUser._id, text: newMessage })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  return (
    <div className={`messages-page ${selectedUser ? 'chat-active' : ''}`}>
      <div className="messages-layout">
        <aside className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>{currentUser.username}</h2>
          </div>
          <div className="conversations-list">
            {conversations.length > 0 ? conversations.map(user => (
              <div 
                key={user._id} 
                className={`conversation-item ${selectedUser?._id === user._id ? 'active' : ''} ${user.unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="conv-avatar">
                  <img src={user.avatar || 'https://via.placeholder.com/150'} alt={user.username} />
                </div>
                <div className="conv-info">
                  <span className="conv-username">{user.username}</span>
                  <span className="last-message">
                    {user.lastMessageType === 'audio' ? 'Voice note' : user.lastMessageText}
                  </span>
                </div>
                {user.unreadCount > 0 && <div className="unread-dot"></div>}
              </div>
            )) : (
              <p className="no-conv">No conversations yet</p>
            )}
          </div>
        </aside>

        <main className="chat-area">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div className="chat-user">
                  <button className="mobile-back-btn" onClick={() => setSelectedUser(null)}>
                    <ArrowLeft size={24} />
                  </button>
                  <img src={selectedUser.avatar || 'https://via.placeholder.com/150'} alt={selectedUser.username} />
                  <span>{selectedUser.username}</span>
                </div>
                <div className="chat-header-actions">
                  <button onClick={() => setActiveCall({ type: 'voice', user: selectedUser })}><Phone size={24} /></button>
                  <button onClick={() => setActiveCall({ type: 'video', user: selectedUser })}><Video size={24} /></button>
                  <button><Info size={24} /></button>
                </div>
              </div>

              <div className="chat-messages">
                {messages.map(msg => (
                   <div key={msg._id} className={`message-bubble ${msg.sender === currentUser.userId ? 'sent' : 'received'}`}>
                    <div className="message-content">
                      {msg.messageType === 'audio' ? (
                        <div className="audio-message">
                          <audio src={msg.audioUrl} controls controlsList="nodownload" />
                        </div>
                      ) : msg.messageType === 'image' ? (
                        <div className="image-message">
                          <img src={msg.imageUrl} alt="Shared" />
                        </div>
                      ) : msg.messageType === 'video' ? (
                        <div className="video-message">
                          <video src={msg.videoUrl} controls />
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      {msg.sender === currentUser.userId && (
                        <button className="unsend-btn" onClick={() => handleDeleteMessage(msg._id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-container">
                {isRecording ? (
                  <div className="recording-ui">
                    <div className="recording-dot"></div>
                    <span>Recording voice note...</span>
                    <button className="cancel-record" onClick={stopRecording}><X size={20} /></button>
                    <button className="send-record" onClick={stopRecording}><Send size={24} color="#0095f6" /></button>
                  </div>
                ) : (
                  <form className="chat-input" onSubmit={handleSendMessage}>
                    <button type="button" className="media-btn" onClick={() => chatMediaInputRef.current.click()}>
                      <ImageIcon size={24} />
                    </button>
                    <input 
                      type="file" 
                      ref={chatMediaInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/*,video/*"
                      onChange={handleMediaSelect}
                    />
                    <input 
                      type="text" 
                      placeholder="Message..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    {newMessage.trim() ? (
                      <button type="submit"><Send size={24} /></button>
                    ) : (
                      <button type="button" onClick={startRecording} className="mic-btn">
                        <Mic size={24} />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon"><MessageSquare size={64} /></div>
              <h2>Your Messages</h2>
              <p>Send private photos and messages to a friend.</p>
              <button className="new-message-btn" onClick={() => window.location.href='/search'}>Send Message</button>
            </div>
          )}
        </main>
      </div>

      {activeCall && (
        <CallOverlay 
          type={activeCall.type} 
          user={activeCall.user} 
          onClose={() => setActiveCall(null)} 
        />
      )}
    </div>
  );
};

export default Messages;
