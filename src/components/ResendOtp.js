import React, { useState } from 'react';
import axios from 'axios';
import './ResendOtp.css';

function ResendOtp() {
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/resend-otp', { userId });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div>
      <h2>Resend OTP</h2>
      {message && <p>{message}</p>}
      <button onClick={handleResend}>Resend OTP</button>
    </div>
  );
}

export default ResendOtp;