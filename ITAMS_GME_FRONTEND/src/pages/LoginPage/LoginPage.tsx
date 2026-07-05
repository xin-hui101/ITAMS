import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/authService';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/db');
  }, [isAuthenticated, navigate]);

  // ── Validation ────────────────────────────────────────────────
  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const data = await loginUser({ email, password });
      login(data.token, data.user);
      navigate('/db');
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-wrap">

        {/* ── Left Panel ── */}
        <div className="login-left">
          <div className="login-left-circle login-left-circle--1" />
          <div className="login-left-circle login-left-circle--2" />
          <div className="login-left-circle login-left-circle--3" />

          {/* Floating illustration */}
          <div className="login-illustration">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" fill="#fff3c4" opacity="0.8"/>
              <rect x="52" y="58" width="96" height="68" rx="12" fill="#f5c518" opacity="0.9"/>
              <rect x="64" y="70" width="72" height="10" rx="4" fill="#fff9e6"/>
              <rect x="64" y="86" width="52" height="6" rx="3" fill="#fff9e6" opacity="0.7"/>
              <rect x="64" y="98" width="38" height="6" rx="3" fill="#fff9e6" opacity="0.5"/>
              <rect x="68" y="118" width="64" height="24" rx="10" fill="#4a2f00"/>
              <rect x="80" y="126" width="40" height="8" rx="4" fill="#f5c518"/>
              <circle cx="148" cy="62" r="24" fill="#fff9e6" stroke="#f5c518" stroke-width="2.5"/>
              <path d="M138 62 L145 69 L158 55" stroke="#f5c518" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="54" cy="148" r="16" fill="#fff9e6" stroke="#f5c518" stroke-width="2"/>
              <path d="M47 148 L52 153 L61 143" stroke="#f5c518" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="152" cy="145" r="12" fill="#fff3c4" stroke="#e6b800" stroke-width="1.5"/>
              <rect x="146" y="139" width="12" height="12" rx="3" fill="none" stroke="#e6b800" stroke-width="1.5"/>
              <path d="M149 145 L151 147 L155 142" stroke="#e6b800" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <h2 className="login-left-title">Manage IT Assets</h2>
          <p className="login-left-sub">
            Track, assign and maintain all your company assets in one place.
          </p>
        </div>

        {/* ── Right Panel ── */}
        <div className="login-right">

          {/* Logo */}
          <div className="login-logo">
            <svg viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="1"  y="1"  width="8" height="8" rx="2" fill="#f5c518"/>
              <rect x="12" y="1"  width="8" height="8" rx="2" fill="#f5c518" opacity="0.5"/>
              <rect x="1"  y="12" width="8" height="8" rx="2" fill="#f5c518" opacity="0.5"/>
              <rect x="12" y="12" width="8" height="8" rx="2" fill="#f5c518"/>
            </svg>
          </div>

          <h1 className="login-title">Welcome back!</h1>
          <p className="login-subtitle">Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate>

            {/* Email field */}
            <div className="login-field">
              <label className="login-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`login-input ${errors.email ? 'login-input--error' : ''}`}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  if (apiError) setApiError('');
                }}
                disabled={loading}
              />
              {errors.email && <span className="login-error-text">{errors.email}</span>}
            </div>

            {/* Password field */}
            <div className="login-field">
              <label className="login-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`login-input ${errors.password ? 'login-input--error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  if (apiError) setApiError('');
                }}
                disabled={loading}
              />
              {errors.password && <span className="login-error-text">{errors.password}</span>}
            </div>

            {/* API error */}
            {apiError && (
              <span className="login-error-text" style={{ marginBottom: '10px', display: 'block' }}>
                {apiError}
              </span>
            )}

            {/* Submit button */}
            <div className="login-btn-wrap">
              <button type="submit" className="login-btn" disabled={loading}>
                <div className="login-btn-shine" />
                <div className={`login-btn-fill ${loading ? 'login-btn-fill--active' : ''}`} />
                {loading ? (
                  <>
                    <div className="login-btn-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span className="login-btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Footer */}
          <div className="login-footer">
            <div className="login-footer-line" />
            <span className="login-footer-text">IT Asset Management System © 2025</span>
            <div className="login-footer-line" />
          </div>

        </div>
      </div>
    </div>
  );
}