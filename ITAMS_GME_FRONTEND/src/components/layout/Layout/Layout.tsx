import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import ChatWidget from '../../ChatWidget/ChatWidget';
import './Layout.css';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="layout">
      <Sidebar onCollapse={setCollapsed} />
      <div className={`layout-main ${collapsed ? 'collapsed' : ''}`}>
        <Topbar collapsed={collapsed} />
        <div className="layout-content">
          <Outlet />
        </div>
        <ChatWidget />
      </div>
      
    </div>
    
  );
}