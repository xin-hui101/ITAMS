import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCategoryRefresh } from '../../../context/CategoryRefreshContext';
import { logoutUser } from '../../../services/authService';
import { getAllCategories } from '../../../services/categoryService';
import { usePermission } from '../../../hooks/usePermission';
import type { CategoryListItem } from '../../../types/category.types';
import './Sidebar.css';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Sidebar({ onCollapse }: { onCollapse?: (collapsed: boolean) => void }) {
  const { user, logout }         = useAuth();
  const navigate                 = useNavigate();
  const location                 = useLocation();
  const { hasPermission} = usePermission();

  const [collapsed, setCollapsed]   = useState(false);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [assetOpen, setAssetOpen]   = useState(false);

  const { refreshKey } = useCategoryRefresh();

useEffect(() => {
  getAllCategories().then(setCategories).catch(() => {});
}, [refreshKey]);

  useEffect(() => {
    if (location.pathname.startsWith('/am')) setAssetOpen(true);
  }, [location.pathname]);

  const isAssetActive = location.pathname.startsWith('/am');

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  }

  async function handleLogout() {
    try { await logoutUser(); } finally {
      logout();
      navigate('/login');
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>

      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={handleToggle}>
        <i className={`ti ${collapsed ? 'ti-chevron-right' : 'ti-chevron-left'}`} />
      </button>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="sidebar-user-top">
          <div className="sidebar-avatar">
            {user ? getInitials(user.fullName) : 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName ?? 'User'}</div>
            <div className="sidebar-user-email">{user?.email ?? ''}</div>
          </div>
        </div>
        {!collapsed && (
          <span className="sidebar-user-role">{user?.role ?? 'Staff'}</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && <span className="sidebar-nav-label">Menu</span>}

        {/* Dashboard — always visible */}
        <NavLink
          to="/db"
          className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
        >
          <i className="ti ti-layout-dashboard" aria-hidden="true" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* User Management — Users:Read */}
        {hasPermission('Users', 'Read') && (
          <NavLink
            to="/um"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="ti ti-users" aria-hidden="true" />
            {!collapsed && <span>User Management</span>}
          </NavLink>
        )}

        {/* Asset Management — Assets:Read */}
        {hasPermission('Assets', 'Read') && (
          <div className="sidebar-nav-item-wrap">
            <div
              className={`sidebar-nav-item-row ${isAssetActive ? 'active' : ''}`}
              onClick={() => collapsed ? navigate('/assets') : setAssetOpen(prev => !prev)}
            >
              <div className="sidebar-nav-item-left">
                <i className="ti ti-device-laptop" aria-hidden="true" />
                {!collapsed && <span>Asset Management</span>}
              </div>
              {!collapsed && (
                <i className={`ti ti-chevron-down sidebar-chevron ${assetOpen ? 'open' : ''}`} />
              )}
            </div>

            {!collapsed && (
              <div className={`sidebar-dropdown ${assetOpen ? 'open' : ''}`}>
                <NavLink
                  to="/am"
                  end
                  className={({ isActive }) =>
                    `sidebar-dropdown-item ${isActive && !location.search ? 'active' : ''}`
                  }
                >
                  <i className="ti ti-list" aria-hidden="true" />
                  All Assets
                </NavLink>
                {categories.map(cat => (
  <NavLink
    key={cat.id}
    to={`/am?categoryId=${cat.id}`}
    className={() =>
      `sidebar-dropdown-item ${
        location.search === `?categoryId=${cat.id}` ? 'active' : ''
      }`
    }
  >
    <i className={`ti ${cat.icon ?? 'ti-tag'}`} aria-hidden="true" />
    {cat.name}
  </NavLink>
))}
              </div>
            )}
          </div>
        )}

        {/* Maintenance — Maintenance:Read */}
        {hasPermission('Maintenance', 'Read') && (
          <NavLink
            to="/mn"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="ti ti-tool" aria-hidden="true" />
            {!collapsed && <span>Maintenance</span>}
          </NavLink>
        )}

        {/* Categories — Categories:Read */}
        {hasPermission('Categories', 'Read') && (
          <NavLink
            to="/cm"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="ti ti-category" aria-hidden="true" />
            {!collapsed && <span>Categories</span>}
          </NavLink>
        )}

        {/* Audit Log — AuditLogs:Read */}
        {hasPermission('AuditLogs', 'Read') && (
          <NavLink
            to="/al"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <i className="ti ti-clipboard-list" aria-hidden="true" />
            {!collapsed && <span>Audit Log</span>}
          </NavLink>
        )}

      </nav>

      {/* Logout */}
      <div className="sidebar-logout">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
}