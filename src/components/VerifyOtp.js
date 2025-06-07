import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VerifyOtp.css';

function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  // Start countdown timer
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  // Format timer as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { otp, userId });
      setMessage(res.data.message);
      if (res.data.success) {
        navigate('/unit-selector');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setMessage('User ID missing. Please login again.');
      return;
    }

    try {
      setMessage('Resending OTP...');
      await axios.post('http://localhost:5000/api/auth/resend-otp', { userId });
      setMessage('OTP resent successfully. Please check your email.');
      setOtp('');
      setTimeLeft(300);
      setCanResend(false);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="verify-otp-container">
      <form onSubmit={handleSubmit} className="verify-otp-form">
        <h2>Verify OTP</h2>
        {message && <p className="message">{message}</p>}

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
          disabled={canResend}
        />

        <button type="submit" disabled={canResend || otp.length !== 6}>
          Verify OTP
        </button>
      </form>

      <div className="timer-section">
        {canResend ? (
          <p>
            OTP expired.{' '}
            <button onClick={handleResendOtp} className="resend-button">
              Resend OTP
            </button>
          </p>
        ) : (
          <p>Time left: {formatTime(timeLeft)}</p>
        )}
      </div>
    </div>
  );
}

export default VerifyOtp;
