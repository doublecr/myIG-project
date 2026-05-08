import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import './CallOverlay.css';

const CallOverlay = ({ type, user, onClose }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`call-overlay ${type}`}>
      <div className="call-background">
        <img src={user.avatar || 'https://via.placeholder.com/600'} alt="Background" />
        <div className="glass-blur"></div>
      </div>

      <div className="call-content">
        <div className="call-info">
          <div className="call-avatar-main">
            <img src={user.avatar || 'https://via.placeholder.com/150'} alt={user.username} />
          </div>
          <h2>{user.username}</h2>
          <p className="call-status">{formatTime(duration)}</p>
        </div>

        {type === 'video' && !isVideoOff && (
          <div className="video-stream-main">
             <div className="user-video-preview">
                <User size={48} color="white" />
             </div>
          </div>
        )}

        <div className="call-controls">
          <button 
            className={`control-btn ${isMuted ? 'active' : ''}`} 
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          {type === 'video' && (
            <button 
              className={`control-btn ${isVideoOff ? 'active' : ''}`} 
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          <button className="control-btn hangup" onClick={onClose}>
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
