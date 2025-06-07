import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Register.css';

const roles = ['Principal', 'Suresh'];
const units = ['VIIT', 'VIEW', 'VIPT', 'WoS', 'VSCPS', 'City Office'];

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    role: '',
    unit: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      setMessage(res.data.message);
      localStorage.setItem('userId', res.data.userId);
      window.location.href = '/verify-otp';
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Register</h2>

        <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} required onChange={handleChange} />
        <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} required onChange={handleChange} />
        <input type="email" name="email" placeholder="Email" value={formData.email} required onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" value={formData.password} required onChange={handleChange} />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} required onChange={handleChange} />
        <input type="text" name="mobile" placeholder="Mobile Number" value={formData.mobile} required onChange={handleChange} />

        <select name="role" value={formData.role} required onChange={handleChange}>
          <option value="">Select Role</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select name="unit" value={formData.unit} required onChange={handleChange}>
          <option value="">Select Unit</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>

        <button type="submit">Register</button>

        {message && <p className="message">{message}</p>}

        <div className="nav-links">
          <p>Already registered? <Link to="/login">Login</Link></p>
          <p>Need to verify OTP? <Link to="/verify-otp">Verify OTP</Link></p>
        </div>
      </form>
    </div>
  );
};

export default Register;
