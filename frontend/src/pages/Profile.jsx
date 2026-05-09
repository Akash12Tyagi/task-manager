import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(user?._id||'');
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  };

  return (
    <div>
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Profile</h1>
          <p className="pg-sub">Your workspace identity</p>
        </div>
      </div>

      {/* Hero */}
      <div className="card card-pad gap-bot fade-up" style={{display:'flex',alignItems:'center',gap:24}}>
        <div className="profile-orb">{user?.name?.[0]?.toUpperCase()||'?'}</div>
        <div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-email">{user?.email}</div>
          <div style={{marginTop:10}}>
            <span className={`chip ${user?.role==='admin'?'chip-admin':'chip-member'}`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card fade-up gap-bot">
        <div className="card-head"><div className="card-title">Account Details</div></div>
        <div className="card-body">
          <div className="detail-grid">
            {[
              ['Name',   user?.name],
              ['Email',  user?.email],
              ['Role',   <span className={`chip ${user?.role==='admin'?'chip-admin':'chip-member'}`}>{user?.role?.toUpperCase()}</span>],
              ['User ID',<><span className="code-tag">{user?._id}</span><button className="btn btn-ghost btn-xs ml-2" onClick={copy}>{copied?'✓ Copied':'Copy'}</button></>],
            ].map(([k,v])=>(
              <div key={k} className="detail-row">
                <div className="detail-key">{k}</div>
                <div style={{fontSize:13,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card fade-up" style={{border:'1px solid rgba(255,59,85,.2)'}}>
        <div className="card-head">
          <div className="card-title" style={{color:'var(--red)'}}>Danger Zone</div>
        </div>
        <div className="card-body" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:14,fontWeight:500,marginBottom:3}}>Sign out of TaskForge</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>You'll be returned to the login screen.</div>
          </div>
          <button className="btn btn-danger" onClick={()=>{if(window.confirm('Sign out?'))logout();}}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
