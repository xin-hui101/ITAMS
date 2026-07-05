import { useState, useEffect } from 'react';
import type { AuditLogDetail } from '../../../types/auditLog.types';
import { getAuditLogById } from '../../../services/auditLogService';
import './AuditLogDetailModal.css';

interface Props {
  logId: number;
  onClose: () => void;
}

// Convert a UTC ISO date string to Malaysia time (UTC+8) for display
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Format JSON string for display
function formatJson(jsonStr?: string): string {
  if (!jsonStr) return '—';
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
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

export default function AuditLogDetailModal({ logId, onClose }: Props) {
  const [log, setLog]       = useState<AuditLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getAuditLogById(logId)
      .then(setLog)
      .catch(() => setError('Failed to load audit log details.'))
      .finally(() => setLoading(false));
  }, [logId]);

  return (
    <div className="al-detail-overlay" onClick={onClose}>
      <div className="al-detail-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="al-detail-header">
          <span className="al-detail-title">Audit Log Details</span>
          <button className="mn-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#e74c3c' }}>
            {error}
          </div>
        ) : log ? (
          <div className="al-detail-body">

            {/* User Info */}
            <div className="al-detail-section-title">User</div>
            <div className="al-detail-row">
              <span className="al-detail-row-label">Name</span>
              <span className="al-detail-row-value">{log.userFullName}</span>
            </div>
            <div className="al-detail-row">
              <span className="al-detail-row-label">Email</span>
              <span className="al-detail-row-value">{log.userEmail}</span>
            </div>

            {/* Action Info */}
            <div className="al-detail-section-title">Action</div>
            <div className="al-detail-row">
              <span className="al-detail-row-label">Module</span>
              <ModuleBadge module={log.module} />
            </div>
            <div className="al-detail-row">
              <span className="al-detail-row-label">Action</span>
              <ActionBadge action={log.action} />
            </div>
            <div className="al-detail-row">
              <span className="al-detail-row-label">Description</span>
              <span className="al-detail-row-value">{log.description}</span>
            </div>
            <div className="al-detail-row">
              <span className="al-detail-row-label">IP Address</span>
              <span className="al-detail-row-value" style={{ fontFamily: 'monospace' }}>
                {log.ipAddress ?? '—'}
              </span>
            </div>
            <div className="al-detail-row">
              <span className="al-detail-row-label">Date & Time</span>
              <span className="al-detail-row-value">{formatDateTime(log.createdAt)}</span>
            </div>

            {/* Old Values */}
            {log.oldValues && (
              <>
                <div className="al-detail-section-title">Before</div>
                <div className="al-detail-json">{formatJson(log.oldValues)}</div>
              </>
            )}

            {/* New Values */}
            {log.newValues && (
              <>
                <div className="al-detail-section-title">After</div>
                <div className="al-detail-json">{formatJson(log.newValues)}</div>
              </>
            )}

          </div>
        ) : null}

        {/* Footer */}
        <div className="al-detail-footer">
          <button className="al-detail-btn-close" onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}