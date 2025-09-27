import React, { useState } from 'react';
import './Register.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState('');
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
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password,
      });

      if (response?.data?.status === true) {
        setMessage(response.data.message || 'Registration successful!');
        setFormData({ name: '', surname: '', email: '', password: '', confirmPassword: '' });
        navigate('/login');
      } else {
        setMessage(response.data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error('Register error:', error);
      const errMsg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      setMessage(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register">
        <h1>Register</h1>

        {message && (
          <p className="message" style={{ color: message.includes('successful') ? 'green' : 'red' }}>
            {message}
          </p>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">First Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Your First Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="surname">Surname</label>
            <input
              type="text"
              id="surname"
              name="surname"
              placeholder="Your Surname"
              value={formData.surname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Your Email Address"
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
              placeholder="Your Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter Your Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login"><span>Login here</span></Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
