import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Topbar.css';

const ROUTE_CONFIG: Record<string, { name: string; icon: string }> = {
  '/dashboard':   { name: 'Dashboard',            icon: 'ti-layout-dashboard' },
  '/users':       { name: 'User Management',      icon: 'ti-users'           },
  '/assets':      { name: 'Asset Management',     icon: 'ti-device-laptop'   },
  '/maintenance': { name: 'Maintenance',           icon: 'ti-tool'            },
  '/categories':  { name: 'Categories Management', icon: 'ti-category'       },
  '/audit-logs':  { name: 'Audit Log',             icon: 'ti-clipboard-list' },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function Topbar({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const current = ROUTE_CONFIG[location.pathname] ?? ROUTE_CONFIG['/dashboard'];

  return (
    <header className={`topbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="topbar-left" />
      <div className="topbar-module">
        <i className={`ti ${current.icon}`} aria-hidden="true" />
        {current.name}
      </div>
      <div className="topbar-right">
        <span className="topbar-time">{formatTime(now)}</span>
        <span className="topbar-sep">·</span>
        <span className="topbar-date">{formatDate(now)}</span>
      </div>
    </header>
  );
}