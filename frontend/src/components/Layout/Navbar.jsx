import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const META = {
  '/dashboard':{ trail:['Workspace','Dashboard'] },
  '/projects' :{ trail:['Workspace','Projects'] },
  '/tasks'    :{ trail:['Workspace','Tasks'] },
  '/profile'  :{ trail:['Workspace','Profile'] },
};

export default function Navbar({ onMenu }) {
  const location = useLocation();
  const { user } = useAuth();
  const key  = Object.keys(META).find(k => location.pathname.startsWith(k)) || '/dashboard';
  const meta = META[key];

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon topbar-hamburger" onClick={onMenu} aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="15" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="topbar-breadcrumb">
        {meta.trail.map((crumb,i)=>(
          <React.Fragment key={crumb}>
            {i>0 && <span className="topbar-breadcrumb-sep">›</span>}
            <span className={i===meta.trail.length-1 ? 'topbar-page' : ''}>{crumb}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="topbar-right">
        <div className="topbar-live">
          <span className="live-dot"/>
          <span style={{display:'none'}}>LIVE</span>
        </div>
        <Link to="/profile">
          <div className="topbar-avatar" title={user?.name}>
            {user?.name?.[0]?.toUpperCase()||'?'}
          </div>
        </Link>
      </div>
    </header>
  );
}
