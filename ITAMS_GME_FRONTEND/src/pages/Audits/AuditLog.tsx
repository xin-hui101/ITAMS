import { useState, useEffect, useCallback } from 'react';
import type { AuditLogListItem, AuditLogQuery, AuditLogStats } from '../../types/auditLog.types';
import { AUDIT_MODULES, AUDIT_ACTIONS } from '../../types/auditLog.types';
import { getAuditLogs, getAuditLogStats } from '../../services/auditLogService';
import AuditLogDetailModal from './components/AuditLogDetailModal';
import './AuditLog.css';

// Convert a UTC ISO date string to Malaysia time (UTC+8) for display
function formatDateTime(dateStr: string): string {
  const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
  return new Date(utcStr).toLocaleString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function ModuleBadge({ module }: { module: string }) {
  const map: Record<string, string> = {
    'Auth':        'al-badge-auth',
    'Users':       'al-badge-users',
    'Categories':  'al-badge-categories',
    'Assets':      'al-badge-assets',
    'Maintenance': 'al-badge-maintenance',
  };
  return (
    <span className={`al-badge ${map[module] ?? 'al-badge-auth'}`}>
      {module}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, string> = {
    'Login':  'al-badge-login',
    'Create': 'al-badge-create',
    'Update': 'al-badge-update',
    'Delete': 'al-badge-delete',
  };
  return (
    <span className={`al-badge ${map[action] ?? 'al-badge-create'}`}>
      {action}
    </span>
  );
}

export default function AuditLog() {
  // ── State ───────────────────────────────────────────────────
  const [logs, setLogs]             = useState<AuditLogListItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch]             = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 10;

  // KPI stats
  const [stats, setStats] = useState<AuditLogStats | null>(null);

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailId, setDetailId]     = useState<number | null>(null);

  // ── Fetch stats for KPI cards ──────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const result = await getAuditLogStats();
      setStats(result);
    } catch {
      setStats(null);
    }
  }, []);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: AuditLogQuery = {
        search:   search || undefined,
        module:   moduleFilter || undefined,
        action:   actionFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo:   dateTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      };
      const result = await getAuditLogs(query);
      setLogs(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, moduleFilter, actionFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [search, moduleFilter, actionFilter, dateFrom, dateTo]);

  const startRecord = (page - 1) * PAGE_SIZE + 1;
  const endRecord   = Math.min(page * PAGE_SIZE, total);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="al-page">

      {/* KPI Cards — matches the icon+value layout used elsewhere */}
      {stats && (
        <div className="al-kpi-grid">
          <div className="al-kpi-card al-kpi-total">
            <div className="al-kpi-icon">
              <i className="ti ti-clipboard-list" />
            </div>
            <div className="al-kpi-info">
              <div className="al-kpi-value">{stats.todayTotal}</div>
              <div className="al-kpi-label">Today's Logs</div>
            </div>
          </div>
          <div className="al-kpi-card al-kpi-create">
            <div className="al-kpi-icon">
              <i className="ti ti-circle-plus" />
            </div>
            <div className="al-kpi-info">
              <div className="al-kpi-value">{stats.todayCreate}</div>
              <div className="al-kpi-label">Today Create</div>
            </div>
          </div>
          <div className="al-kpi-card al-kpi-update">
            <div className="al-kpi-icon">
              <i className="ti ti-edit" />
            </div>
            <div className="al-kpi-info">
              <div className="al-kpi-value">{stats.todayUpdate}</div>
              <div className="al-kpi-label">Today Update</div>
            </div>
          </div>
          <div className="al-kpi-card al-kpi-delete">
            <div className="al-kpi-icon">
              <i className="ti ti-trash" />
            </div>
            <div className="al-kpi-info">
              <div className="al-kpi-value">{stats.todayDelete}</div>
              <div className="al-kpi-label">Today Delete</div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
<div className="al-toolbar">
  <div className="al-search-wrap">
    <i className="ti ti-search al-search-icon" aria-hidden="true" />
    <input
      className="al-search-input"
      placeholder="Search by user name or email..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>
  <select
    className="al-filter-select"
    value={moduleFilter}
    onChange={e => setModuleFilter(e.target.value)}
  >
    <option value="">All Modules</option>
    {AUDIT_MODULES.map(m => (
      <option key={m} value={m}>{m}</option>
    ))}
  </select>
  <select
    className="al-filter-select"
    value={actionFilter}
    onChange={e => setActionFilter(e.target.value)}
  >
    <option value="">All Actions</option>
    {AUDIT_ACTIONS.map(a => (
      <option key={a} value={a}>{a}</option>
    ))}
  </select>
  <div className="al-date-range">
    <input
      className="al-date-input"
      type="date"
      value={dateFrom}
      onChange={e => setDateFrom(e.target.value)}
    />
    <span className="al-date-sep">to</span>
    <input
      className="al-date-input"
      type="date"
      value={dateTo}
      onChange={e => setDateTo(e.target.value)}
    />
  </div>
  {/* Print button — triggers browser print dialog */}
  <button className="al-btn-print" onClick={() => window.print()}>
    <i className="ti ti-printer" />
    Print
  </button>
</div>

      {/* Table */}
      <div
  className="al-table-wrap"
  data-print-date={new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })}
>
        <table className="al-table">
          <thead>
            <tr>
              <th style={{ width: 150 }}>User</th>
              <th style={{ width: 110 }}>Module</th>
              <th style={{ width: 90 }}>Action</th>
              <th>Description</th>
              <th style={{ width: 120 }}>IP Address</th>
              <th style={{ width: 160 }}>Date & Time</th>
              <th style={{ width: 60 }}>View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="al-loading">Loading audit logs...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7}>
                  <div className="al-error">{error}</div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="al-empty">
                    <div className="al-empty-icon">
                      <i className="ti ti-clipboard-list" style={{ fontSize: 36 }} />
                    </div>
                    <div className="al-empty-text">No audit logs found</div>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div className="al-user-name">{log.userFullName}</div>
                    <div className="al-user-email">{log.userEmail}</div>
                  </td>
                  <td><ModuleBadge module={log.module} /></td>
                  <td><ActionBadge action={log.action} /></td>
                  <td style={{ fontSize: 13, color: '#333' }}>
                    {log.description}
                  </td>
                  <td>
                    <span className="al-ip">{log.ipAddress ?? '—'}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td>
                    <button
                      className="al-btn-view"
                      title="View details"
                      onClick={() => { setDetailId(log.id); setShowDetail(true); }}
                    >
                      <i className="ti ti-eye" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="al-pagination">
          <span className="al-pagination-info">
            Showing {startRecord}–{endRecord} of {total} records
          </span>
          <div className="al-pagination-btns">
            <button
              className="al-page-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`al-page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >{p}</button>
            ))}
            <button
              className="al-page-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >→</button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && detailId && (
        <AuditLogDetailModal
          logId={detailId}
          onClose={() => { setShowDetail(false); setDetailId(null); }}
        />
      )}

    </div>
  );
}