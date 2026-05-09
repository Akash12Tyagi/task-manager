import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm]       = useState({ email:'', password:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from        = location.state?.from?.pathname || '/dashboard';

  const set = (k) => (e) => setForm(f => ({...f,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate(from, {replace:true}); }
    catch(err){ setError(err.message || 'Invalid email or password'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      {/* LEFT — hero panel */}
      <div className="auth-left fade-in">
        <div className="auth-hero stagger">
          <div className="auth-hero-badge fade-up">
            <span className="auth-hero-badge-dot"/>
            TEAM COMMAND CENTER
          </div>
          <h1 className="auth-hero-title fade-up">
            Ship projects.<br/><span>Not excuses.</span>
          </h1>
          <p className="auth-hero-sub fade-up">
            TaskForge gives your team a single place to create, assign, and track every piece of work — from sprint to delivery.
          </p>
          <div className="auth-hero-stats stagger fade-up">
            {[['12k+','Teams'], ['99ms','Response'], ['100%','Uptime']].map(([v,l]) => (
              <div key={l}>
                <div className="auth-stat-val">{v}</div>
                <div className="auth-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="auth-right">
        <div style={{width:'100%'}} className="fade-up">
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
              <div className="sidebar-brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0F0E0D" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <span style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,letterSpacing:'.08em'}}>TASKFORGE</span>
            </div>
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-sub">Sign in to your workspace</p>
          </div>

          {error && <div className="alert alert-err gap-bot">{error}</div>}

          <form onSubmit={submit} className="form-stack">
            <div className="field">
              <label className="field-label">Email address</label>
              <input className="input" type="email" value={form.email}
                onChange={set('email')} placeholder="you@company.com"
                required autoComplete="email"/>
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="input" type="password" value={form.password}
                onChange={set('password')} placeholder="••••••••"
                required autoComplete="current-password"/>
            </div>
            <button type="submit" className="btn btn-lime btn-lg btn-full" disabled={loading}
              style={{marginTop:6}}>
              {loading ? <><div className="spinner-ring spinner"/>Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider">OR</div>

          <div className="auth-footer-link">
            Don't have an account?{' '}
            <Link to="/register">Create one free →</Link>
          </div>

          <div className="demo-box">
            <div className="demo-box-label">DEMO CREDENTIALS</div>
            <div className="demo-box-cred">
              admin@demo.com / password123<br/>
              member@demo.com / password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
