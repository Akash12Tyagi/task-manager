import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to:'/dashboard', label:'Dashboard', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { to:'/projects',  label:'Projects',  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7l10-5 10 5v10l-10 5L2 17V7z"/><polyline points="12 2 12 22"/><polyline points="2 7 22 7"/></svg> },
  { to:'/tasks',     label:'All Tasks', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/></svg> },
  { to:'/profile',   label:'Profile',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {isOpen && <div className="mob-overlay" onClick={onClose}/>}
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0F0E0D" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-brand-name">TASKFORGE</div>
            <div className="sidebar-brand-sub">COMMAND CENTER</div>
          </div>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="user-orb">{user?.name?.[0]?.toUpperCase()||'?'}</div>
          <div style={{overflow:'hidden',flex:1}}>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">
              <span className={`chip ${user?.role==='admin'?'chip-admin':'chip-member'}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              className={({isActive})=>`nav-link${isActive?' active':''}`}>
              <div className="nav-icon" style={{width:28,height:28}}>
                <div style={{width:15,height:15}}>{item.icon}</div>
              </div>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="nav-section-label" style={{marginTop:10}}>Admin</div>
              <div className="nav-link" style={{opacity:.5,fontSize:12,cursor:'default'}}>
                <div className="nav-icon" style={{width:28,height:28}}>
                  <div style={{width:15,height:15}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                    </svg>
                  </div>
                </div>
                Manage via DB
              </div>
            </>
          )}
        </nav>

        {/* Sign out */}
        <div className="sidebar-footer">
          <button className="signout-btn" onClick={()=>{logout();navigate('/login');}}>
            <div style={{width:15,height:15,flexShrink:0}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
