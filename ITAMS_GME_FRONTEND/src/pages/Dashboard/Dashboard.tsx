import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardData, WarrantyAlert, RecentActivity } from '../../types/dashboard.types';
import { getDashboard } from '../../services/dashboardService';
import './Dashboard.css';


// Format relative time e.g. "2m ago", "1h ago"
function timeAgo(dateStr: string): string {
  const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
  const diff   = Date.now() - new Date(utcStr).getTime();
  const mins   = Math.floor(diff / 60000);
  const hours  = Math.floor(diff / 3600000);
  const days   = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Format currency in RM
function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `RM ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000)    return `RM ${(amount / 1000).toFixed(1)}K`;
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
}

// Get initials from full name for avatar
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Action color for recent activity avatar background
function getActionColor(action: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    'Create': { bg: '#e8f5e9', color: '#2e7d32' },
    'Update': { bg: '#fff8e1', color: '#f57f17' },
    'Delete': { bg: '#fce4ec', color: '#c62828' },
    'Login':  { bg: '#e3f2fd', color: '#1565c0' },
  };
  return map[action] ?? { bg: '#f5f5f5', color: '#555' };
}

// Warranty alert color based on days left
function getWarrantyColor(daysLeft: number): { bg: string; border: string; text: string; sub: string } {
  if (daysLeft < 0)  return { bg: '#fce4ec', border: '#c62828', text: '#c62828', sub: '#e57373' };
  if (daysLeft <= 7) return { bg: '#fff8e1', border: '#f57f17', text: '#f57f17', sub: '#ffa726' };
  return { bg: '#fffde7', border: '#f5c518', text: '#b8860b', sub: '#ffa726' };
}

function getWarrantyIcon(daysLeft: number): string {
  if (daysLeft < 0)  return 'ti-alert-circle';
  if (daysLeft <= 7) return 'ti-alert-triangle';
  return 'ti-clock';
}

function getWarrantyLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`;
  if (daysLeft === 0) return 'Expires today';
  return `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
}

export default function Dashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const navigate              = useNavigate();

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="db-page">
        <div className="db-loading">
          <i className="ti ti-loader" style={{ fontSize: 32, color: '#bbb' }} />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="db-page">
        <div className="db-error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { assets, maintenance, auditLog, categories } = data;

  // Max count for category bar chart scaling
  const maxCategoryCount = assets?.byCategory?.[0]?.count ?? 1;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="db-page">

      {/* KPI Cards — only show if section data is available */}
      <div className="db-kpi-grid">
        {assets && (
          <>
            <div className="db-kpi-card" onClick={() => navigate('/assets')} style={{ cursor: 'pointer' }}>
              <div className="db-kpi-icon" style={{ color: '#1565c0' }}>
                <i className="ti ti-devices" />
              </div>
              <div className="db-kpi-info">
                <div className="db-kpi-value">{assets.totalAssets}</div>
                <div className="db-kpi-label">Total Assets</div>
              </div>
            </div>
            <div className="db-kpi-card">
              <div className="db-kpi-icon" style={{ color: '#2e7d32' }}>
                <i className="ti ti-currency-dollar" />
              </div>
              <div className="db-kpi-info">
                <div className="db-kpi-value">{formatCurrency(assets.totalValue)}</div>
                <div className="db-kpi-label">Total Asset Value</div>
              </div>
            </div>
          </>
        )}
        {categories && (
          <div className="db-kpi-card" onClick={() => navigate('/categories')} style={{ cursor: 'pointer' }}>
            <div className="db-kpi-icon" style={{ color: '#f57f17' }}>
              <i className="ti ti-category" />
            </div>
            <div className="db-kpi-info">
              <div className="db-kpi-value">{categories.totalCategories}</div>
              <div className="db-kpi-label">Total Categories</div>
            </div>
          </div>
        )}
        {maintenance && (
          <div className="db-kpi-card" onClick={() => navigate('/maintenance')} style={{ cursor: 'pointer' }}>
            <div className="db-kpi-icon" style={{ color: '#c62828' }}>
              <i className="ti ti-tool" />
            </div>
            <div className="db-kpi-info">
              <div className="db-kpi-value">{maintenance.pendingCount}</div>
              <div className="db-kpi-label">Pending Maintenance</div>
            </div>
          </div>
        )}
        {auditLog && (
          <div className="db-kpi-card" onClick={() => navigate('/audit-logs')} style={{ cursor: 'pointer' }}>
            <div className="db-kpi-icon" style={{ color: '#6a1b9a' }}>
              <i className="ti ti-clipboard-list" />
            </div>
            <div className="db-kpi-info">
              <div className="db-kpi-value">{auditLog.todayTotal}</div>
              <div className="db-kpi-label">Today's Logs</div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      {(assets || maintenance) && (
        <div className="db-charts-grid">

          {/* Asset Status Donut */}
          {assets && (
            <div className="db-card">
              <div className="db-card-title">Asset status</div>
              <div className="db-donut-wrap">
                <svg viewBox="0 0 100 100" className="db-donut">
                  {(() => {
                    const total  = assets.totalAssets || 1;
                    const slices = [
                      { value: assets.activeCount,          color: '#2e7d32' },
                      { value: assets.inactiveCount,        color: '#e0e0e0' },
                      { value: assets.underMaintenanceCount, color: '#f57f17' },
                      { value: assets.disposeCount,         color: '#c62828' },
                    ];
                    const circumference = 2 * Math.PI * 38;
                    let offset = 0;
                    return slices.map((slice, i) => {
                      const dash   = (slice.value / total) * circumference;
                      const gap    = circumference - dash;
                      const el = (
                        <circle
                          key={i}
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke={slice.color}
                          strokeWidth="16"
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-offset + circumference * 0.25}
                          transform="rotate(-90 50 50)"
                        />
                      );
                      offset += dash;
                      return el;
                    });
                  })()}
                  <text x="50" y="47" textAnchor="middle" fontSize="12" fontWeight="500" fill="#1a1a1a">{assets.totalAssets}</text>
                  <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#888">assets</text>
                </svg>
                <div className="db-donut-legend">
                  {[
                    { label: 'Active',       value: assets.activeCount,           color: '#2e7d32' },
                    { label: 'Inactive',     value: assets.inactiveCount,         color: '#e0e0e0' },
                    { label: 'Maintenance',  value: assets.underMaintenanceCount, color: '#f57f17' },
                    { label: 'Dispose',      value: assets.disposeCount,          color: '#c62828' },
                  ].map(item => (
                    <div key={item.label} className="db-legend-item">
                      <div className="db-legend-dot" style={{ background: item.color, border: item.color === '#e0e0e0' ? '1px solid #ccc' : 'none' }} />
                      <span className="db-legend-label">{item.label}</span>
                      <span className="db-legend-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Status */}
          {maintenance && (
            <div className="db-card">
              <div className="db-card-title">Maintenance status</div>
              <div className="db-bar-list">
                {[
                  { label: 'Pending',     value: maintenance.pendingCount,    color: '#c62828', total: maintenance.pendingCount + maintenance.inProgressCount + maintenance.completedCount },
                  { label: 'In progress', value: maintenance.inProgressCount, color: '#f57f17', total: maintenance.pendingCount + maintenance.inProgressCount + maintenance.completedCount },
                  { label: 'Completed',   value: maintenance.completedCount,  color: '#2e7d32', total: maintenance.pendingCount + maintenance.inProgressCount + maintenance.completedCount },
                ].map(item => (
                  <div key={item.label} className="db-bar-item">
                    <div className="db-bar-header">
                      <span className="db-bar-label">{item.label}</span>
                      <span className="db-bar-value">{item.value}</span>
                    </div>
                    <div className="db-bar-track">
                      <div
                        className="db-bar-fill"
                        style={{
                          width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assets by Category */}
          {assets && assets.byCategory.length > 0 && (
            <div className="db-card">
              <div className="db-card-title">Assets by category</div>
              <div className="db-bar-list">
                {assets.byCategory.slice(0, 6).map(cat => (
                  <div key={cat.categoryName} className="db-bar-item">
                    <div className="db-bar-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`ti ${cat.categoryIcon ?? 'ti-category'}`} style={{ fontSize: 12, color: '#888' }} />
                        <span className="db-bar-label">{cat.categoryName}</span>
                      </div>
                      <span className="db-bar-value">{cat.count}</span>
                    </div>
                    <div className="db-bar-track">
                      <div
                        className="db-bar-fill"
                        style={{
                          width: `${maxCategoryCount > 0 ? (cat.count / maxCategoryCount) * 100 : 0}%`,
                          background: '#1565c0',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Bottom Row — Warranty + Recent Activity */}
      <div className="db-bottom-grid">

        {/* Warranty Alerts */}
        {assets && assets.warrantyAlerts.length > 0 && (
          <div className="db-card">
            <div className="db-card-title-row">
              <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: '#f57f17' }} />
              <span className="db-card-title">Warranty expiring soon</span>
            </div>
            <div className="db-warranty-list">
              {assets.warrantyAlerts.map((alert: WarrantyAlert) => {
                const clr = getWarrantyColor(alert.daysLeft);
                return (
                  <div
                    key={alert.id}
                    className="db-warranty-item"
                    style={{ background: clr.bg, borderLeftColor: clr.border }}
                    onClick={() => navigate('/assets')}
                  >
                    <div>
                      <div className="db-warranty-tag" style={{ color: clr.text }}>
                        {alert.assetTag} · {alert.name}
                      </div>
                      <div className="db-warranty-sub" style={{ color: clr.sub }}>
                        {getWarrantyLabel(alert.daysLeft)}
                      </div>
                    </div>
                    <i className={`ti ${getWarrantyIcon(alert.daysLeft)}`} style={{ fontSize: 15, color: clr.text }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
{auditLog && (
  <div className="db-card">
    <div className="db-card-title">Recent activity</div>
    <div className="db-activity-list">
      {auditLog.recentActivity.map((activity: RecentActivity, i: number) => {
        const clr = getActionColor(activity.action);
        return (
          <div key={i} className="db-activity-item">
            {/* Avatar */}
            <div className="db-activity-avatar" style={{ background: clr.bg, color: clr.color }}>
              {getInitials(activity.userFullName)}
            </div>
            {/* Info */}
            <div className="db-activity-info">
              <div className="db-activity-name">{activity.userFullName}</div>
              <div className="db-activity-desc">
                {/* Highlight the action word with color */}
                <span className="db-activity-action" style={{ color: clr.color, fontWeight: 600 }}>
                  {activity.action}
                </span>
                {' '}
                {activity.description.replace(/^(Created|Updated|Deleted|Logged in)\s*/i, '')}
              </div>
            </div>
            {/* Time on the right */}
            <div className="db-activity-time">{timeAgo(activity.createdAt)}</div>
          </div>
        );
      })}
    </div>
  </div>
)}

      </div>

    </div>
  );
}