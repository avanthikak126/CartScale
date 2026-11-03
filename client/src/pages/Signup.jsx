import { useState } from 'react';
import { ShoppingCart, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import * as api from '../api';
import './Login.css'; // Reusing Login CSS for identical card layout

export default function Signup({ onLogin, navigate }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    const { data, error: apiError } = await api.signup(fullName.trim(), email.trim(), password);
    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (data?.emailConfirmRequired) {
      setMessage(data.message);
    } else if (data?.access_token) {
      onLogin(data.access_token);
    } else {
      setError('Unexpected response. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <ShoppingCart size={32} />
          <h1 className="login-title">CartScale</h1>
        </div>
        <p className="login-subtitle">Create a new account</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          {message && <div className="login-error" style={{ background: 'var(--cs-success-light)', color: 'var(--cs-success)', borderColor: 'rgba(16,185,129,0.2)' }}>{message}</div>}

          <div className="login-field">
            <label className="login-label" htmlFor="fullName">Full Name</label>
            <div className="login-input-wrapper">
              <User size={18} className="login-input-icon" />
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                className="login-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="email">Email</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Password</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Create a password (min. 6 chars)"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                tabIndex={-1}
              >
                {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg login-submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="login-footer">
          Already have an account? <span className="login-link" onClick={() => navigate('login')}>Log in</span>
        </p>
      </div>
    </div>
  );
}
