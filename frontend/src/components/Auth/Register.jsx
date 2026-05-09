import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [form, setForm]       = useState({name:'',email:'',password:'',role:'member'});
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const set = (k) => (e) => setForm(f => ({...f,[k]:e.target.value}));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    try { await register(form.name, form.email, form.password, form.role); navigate('/dashboard'); }
    catch(err){ setError(err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-left fade-in">
        <div className="auth-hero stagger">
          <div className="auth-hero-badge fade-up">
            <span className="auth-hero-badge-dot"/>GET STARTED FREE
          </div>
          <h1 className="auth-hero-title fade-up">
            Your team's<br/><span>new mission</span><br/>control.
          </h1>
          <p className="auth-hero-sub fade-up">
            Create your workspace in seconds. Invite your team, build projects, and ship faster — all from one beautifully designed command center.
          </p>
          <div style={{marginTop:40,display:'flex',flexDirection:'column',gap:14}} className="stagger">
            {[
              ['⚡','Instant setup — no credit card needed'],
              ['◎','Role-based access for admins & members'],
              ['✦','Kanban, list, and dashboard views built-in'],
            ].map(([icon,text]) => (
              <div key={text} className="fade-up" style={{display:'flex',alignItems:'center',gap:12,fontSize:13,color:'var(--muted)'}}>
                <span style={{color:'var(--lime)',fontSize:16,width:20,textAlign:'center'}}>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div style={{width:'100%'}} className="fade-up">
          <div style={{marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
              <div className="sidebar-brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0F0E0D" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <span style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,letterSpacing:'.08em'}}>TASKFORGE</span>
            </div>
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-sub">Join your team on TaskForge</p>
          </div>

          {error && <div className="alert alert-err gap-bot">{error}</div>}

          <form onSubmit={submit} className="form-stack">
            <div className="field">
              <label className="field-label">Full name</label>
              <input className="input" type="text" value={form.name}
                onChange={set('name')} placeholder="Jane Smith"
                required autoComplete="name"/>
            </div>
            <div className="field">
              <label className="field-label">Email address</label>
              <input className="input" type="email" value={form.email}
                onChange={set('email')} placeholder="jane@company.com"
                required autoComplete="email"/>
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="input" type="password" value={form.password}
                onChange={set('password')} placeholder="Min. 6 characters"
                required autoComplete="new-password"/>
            </div>
            <div className="field">
              <label className="field-label">I am a…</label>
              <select className="input input--select" value={form.role} onChange={set('role')}>
                <option value="member">Member — part of a team</option>
                <option value="admin">Admin — managing projects</option>
              </select>
            </div>
            <button type="submit" className="btn btn-lime btn-lg btn-full" disabled={loading}
              style={{marginTop:6}}>
              {loading ? <><div className="spinner-ring spinner"/>Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <div className="auth-footer-link" style={{marginTop:20}}>
            Already have an account?{' '}
            <Link to="/login">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
