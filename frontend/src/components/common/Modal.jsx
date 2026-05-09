import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(()=>{
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return ()=>{ document.body.style.overflow=''; };
  },[isOpen]);
  useEffect(()=>{
    const fn=(e)=>{ if(e.key==='Escape') onClose(); };
    if(isOpen) document.addEventListener('keydown',fn);
    return ()=>document.removeEventListener('keydown',fn);
  },[isOpen,onClose]);
  if(!isOpen) return null;
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-head-title">{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
