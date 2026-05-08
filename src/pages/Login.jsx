import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Something went wrong. Is the backend running?');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="logo-text">Voltext</h1>
        <p className="auth-subtitle">Login with username, email, or phone.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            name="identifier" 
            placeholder="Username, email, or phone number" 
            onChange={handleChange} 
            required 
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            onChange={handleChange} 
            required 
          />
          <button type="submit" className="auth-btn">Log in</button>
        </form>

        {error && <p className="auth-error">{error}</p>}
      </div>

      <div className="auth-switch">
        <span>Don't have an account? <Link to="/signup">Sign up</Link></span>
      </div>
    </div>
  );
};

export default Login;
