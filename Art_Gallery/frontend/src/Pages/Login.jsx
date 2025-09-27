import React, { useState } from 'react';
import './Login.css'; 
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', formData);

      if (response?.data?.status === true) {
        localStorage.setItem('token', response.data.token);
        window.dispatchEvent(new Event('authChange'));
        
        setMessage({ text: response.data.message || 'Login successful!', type: 'success' });
        setFormData({ email: '', password: '' });

        navigate('/home');

      } else {
        setMessage({ text: response?.data?.message || 'Unexpected response from server.', type: 'error' });
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || 'Login failed. Check your credentials.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Login</h1>

        {message.text && (
          <p className={`message ${message.type}`}>
            {message.text}
          </p>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="register-link">
          Don't have an account? <Link to="/register"><span>Register here</span></Link>
        </p>
      </div>
    </div>
  );
};

export default Login
