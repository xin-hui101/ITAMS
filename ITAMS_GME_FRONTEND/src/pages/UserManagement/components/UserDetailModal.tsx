import { useState, useEffect } from 'react';
import type { UserDetail } from '../../../types/user.types';
import { getUserById } from '../../../services/userService';
import { usePermission } from '../../../hooks/usePermission';
import './UserDetailModal.css';

interface Props {
  userId: number;
  onClose: () => void;
  onEdit: (id: number) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// AuditLogs module only has Read action — no Create/Update/Delete
const ACTIONS_BY_MODULE: Record<string, string[]> = {
  AuditLogs: ['Read'],
};
const DEFAULT_ACTIONS = ['Create', 'Read', 'Update', 'Delete'];

export default function UserDetailModal({ userId, onClose, onEdit }: Props) {
  const [user, setUser]       = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Permission hook — controls whether Edit button is shown
  const { hasPermission } = usePermission();

  useEffect(() => {
    getUserById(userId)
      .then(setUser)
      .catch(() => setError('Failed to load user details.'))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="detail-modal-header">
          <span className="detail-modal-title">User Details</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#e74c3c' }}>
            {error}
          </div>
        ) : user ? (
          <>
            {/* Avatar section */}
            <div className="detail-avatar-section">
              <div className="detail-avatar">{getInitials(user.fullName)}</div>
              <div>
                <div className="detail-name">{user.fullName}</div>
                <div className="detail-email">{user.email}</div>
                <div className="detail-role-badge">{user.role}</div>
              </div>
            </div>

            {/* Info */}
            <div className="detail-body">
              <div className="detail-section-title">Account Info</div>

              <div className="detail-row">
                <span className="detail-row-label">Username</span>
                <span className="detail-row-value">{user.username}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">Phone</span>
                <span className="detail-row-value">{user.phone ?? '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">Status</span>
                <span className={user.isActive ? 'detail-status-active' : 'detail-status-inactive'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">Created</span>
                <span className="detail-row-value">{formatDate(user.createdAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">Last Updated</span>
                <span className="detail-row-value">{formatDate(user.updatedAt)}</span>
              </div>

              {/* Permissions */}

{user.permissions.length > 0 && (
  <div className="detail-permissions">
    <div className="detail-section-title">Permissions</div>
    {/* Group by module */}
    {(() => {
      // Group permissions by module
      const grouped: Record<string, string[]> = {};
      user.permissions.forEach(perm => {
        const [module, action] = perm.split(':');
        if (!grouped[module]) grouped[module] = [];
        grouped[module].push(action);
      });

      return Object.entries(grouped).map(([module, actions]) => {
        // AuditLogs only shows Read — other modules show all 4 actions
        const moduleActions = ACTIONS_BY_MODULE[module] ?? DEFAULT_ACTIONS;

        return (
          <div key={module} className="detail-perm-group">
            <div className="detail-perm-module">{module}</div>
            <div className="detail-perm-items">
              {moduleActions.map(action => {
  const granted = actions.includes(action);
  return (
    <label key={action} className="detail-perm-item">
      <input
        type="checkbox"
        checked={granted}
        disabled
        readOnly
        style={{ accentColor: granted ? '#4caf50' : '#ccc' }}
      />
      {action}
    </label>
  );
})}
            </div>
          </div>
        );
      });
    })()}
  </div>
)}
            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="detail-modal-footer">
          <button className="detail-btn-close" onClick={onClose}>Close</button>
          {/* Edit button — only show if user has Users:Update permission */}
          {user && hasPermission('Users', 'Update') && (
            <button className="detail-btn-edit" onClick={() => onEdit(user.id)}>
              ✏️ Edit User
            </button>
          )}
        </div>

      </div>
    </div>
  );
}