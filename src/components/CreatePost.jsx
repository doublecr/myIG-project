import React, { useState, useRef } from 'react';
import { Camera, X, Send, Image as ImageIcon, Video, Film, CheckCircle2, ArrowLeft } from 'lucide-react';
import API_BASE_URL from '../config';
import './CreatePost.css';

const CreatePost = ({ isOpen, onClose, onPostCreated }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select, 2: Destination, 3: Editor
  const [destination, setDestination] = useState('post'); // 'post' or 'story'
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const pressTimerRef = useRef(null);

  const startCamera = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      setStream(userStream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
    } catch (err) {
      alert('Could not access camera or microphone. Please check permissions.');
    }
  };

  const startRecording = () => {
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result); // This is now Base64
        setFile({ type: 'video/mp4' });
        setStep(2);
        stopCamera();
      };
      reader.readAsDataURL(blob);
    };
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    const imageData = canvasRef.current.toDataURL('image/png');
    setFilePreview(imageData);
    setFile({ type: 'image/png' });
    setStep(2);
    stopCamera();
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
        setStep(2);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const type = file?.type?.includes('video') ? 'video' : 'image';
    const url = destination === 'post' ? `${API_BASE_URL}/posts` : `${API_BASE_URL}/stories`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          imageUrl: filePreview, 
          caption: destination === 'post' ? caption : undefined,
          mediaType: type,
          mentions: [] // Simple for now
        })
      });
      if (response.ok) {
        handleClose();
        if (onPostCreated) onPostCreated();
      }
    } catch (err) {
      console.error(`Failed to create ${destination}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setFile(null);
    setFilePreview('');
    setCaption('');
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`create-post-modal step-${step}`}>
        <div className="modal-header">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)}><ArrowLeft size={24} /></button>
          ) : isCameraOpen ? (
            <button onClick={stopCamera}><ArrowLeft size={24} /></button>
          ) : (
            <button onClick={handleClose}><X size={24} /></button>
          )}
          <h2>{isCameraOpen ? 'Camera' : step === 1 ? 'Create' : step === 2 ? 'Share to' : 'New Post'}</h2>
          {(step === 2 && destination === 'story') && (
            <button className="share-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sharing...' : 'Share'}
            </button>
          )}
          {step === 3 && (
            <button className="share-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sharing...' : 'Share'}
            </button>
          )}
        </div>

        <div className="modal-body">
          {isCameraOpen ? (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline muted className="camera-stream"></video>
              <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              
              {isRecording && <div className="recording-indicator"><span></span> REC</div>}

              <div className="camera-actions">
                <button 
                  className={`capture-btn ${isRecording ? 'recording' : ''}`} 
                  onMouseDown={() => {
                    pressTimerRef.current = setTimeout(startRecording, 500);
                  }}
                  onMouseUp={() => {
                    clearTimeout(pressTimerRef.current);
                    if (isRecording) {
                      stopRecording();
                    } else {
                      takePhoto();
                    }
                  }}
                  onMouseLeave={() => {
                    clearTimeout(pressTimerRef.current);
                    if (isRecording) stopRecording();
                  }}
                >
                  <div className="inner-circle"></div>
                </button>
                <p className="camera-hint">Tap for photo, hold for video</p>
              </div>
            </div>
          ) : step === 1 ? (
            <div className="select-file-view">
              <ImageIcon size={96} strokeWidth={1} />
              <p>Drag photos and videos here</p>
              <div className="selection-actions">
                <button className="select-btn" onClick={() => fileInputRef.current.click()}>
                  Select from computer
                </button>
                <button className="camera-btn" onClick={startCamera}>
                  <Camera size={20} /> Use Camera
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*,video/*"
                onChange={handleFileSelect}
              />
            </div>
          ) : step === 2 ? (
            <div className="destination-view">
              <div className="preview-container">
                {file?.type?.includes('video') ? (
                  <video src={filePreview} autoPlay muted loop playsInline className="preview-media" />
                ) : (
                  <img src={filePreview} alt="Preview" className="preview-media" />
                )}
              </div>
              <div className="choice-container">
                <h3>Share to</h3>
                <button 
                  className="choice-btn" 
                  onClick={() => { setDestination('post'); setStep(3); }}
                >
                  <div className="choice-icon"><ImageIcon size={24} /></div>
                  <div className="choice-text">
                    <strong>Feed Post</strong>
                    <span>Share to your followers and profile</span>
                  </div>
                </button>
                <button 
                  className="choice-btn" 
                  onClick={() => { setDestination('story'); handleSubmit(); }}
                >
                  <div className="choice-icon story"><div className="story-ring"></div><Camera size={18} /></div>
                  <div className="choice-text">
                    <strong>Your Story</strong>
                    <span>Share for 24 hours</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="editor-view">
              <div className="image-preview-section">
                {file?.type?.includes('video') ? (
                  <video src={filePreview} autoPlay muted loop playsInline className="preview-media" />
                ) : (
                  <img src={filePreview} alt="Preview" className="preview-media" />
                )}
              </div>

              <div className="caption-section">
                <div className="user-info">
                  <img src={JSON.parse(localStorage.getItem('user'))?.avatar} alt="Me" className="mini-avatar-img" />
                  <span>{JSON.parse(localStorage.getItem('user'))?.username}</span>
                </div>
                <textarea 
                  placeholder="Write a caption..." 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  autoFocus
                ></textarea>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
