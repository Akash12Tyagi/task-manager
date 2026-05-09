import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar isOpen={open} onClose={()=>setOpen(false)}/>
      <div className="main-col">
        <Navbar onMenu={()=>setOpen(true)}/>
        <div className="page-wrap">
          <Outlet/>
        </div>
      </div>
    </div>
  );
}
