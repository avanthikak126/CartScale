import { useState } from 'react';
import { ShoppingCart, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import * as api from '../api';
import './Login.css';

export default function Login({ onLogin, navigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }

    setLoading(true);
    const { data, error: apiError } = await api.login(email.trim(), password);
    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    if (data?.access_token) {
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
        <p className="login-subtitle">Sign in to your account</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

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
                placeholder="Enter your password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          <button
            type="submit"
            className="btn btn-primary btn-lg login-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account? <span className="login-link" onClick={() => navigate('signup')}>Sign up</span>
        </p>
      </div>
    </div>
  );
}
