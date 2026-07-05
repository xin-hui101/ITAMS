import { useState, useEffect } from 'react';
import type { MaintenanceDetail } from '../../../types/maintenance.types';
import { getMaintenanceById } from '../../../services/maintenanceService';
import { usePermission } from '../../../hooks/usePermission';
import './MaintenanceDetailModal.css';

interface Props {
  recordId: number;
  onClose: () => void;
  onEdit: (id: number) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCost(cost?: number): string {
  if (!cost) return '—';
  return `RM ${cost.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    'Repair':     'mn-detail-badge-repair',
    'Service':    'mn-detail-badge-service',
    'Inspection': 'mn-detail-badge-inspection',
  };
  return (
    <span className={`mn-detail-badge ${map[type] ?? 'mn-detail-badge-inspection'}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Pending':     'mn-detail-badge-pending',
    'In Progress': 'mn-detail-badge-inprogress',
    'Completed':   'mn-detail-badge-completed',
  };
  return (
    <span className={`mn-detail-badge ${map[status] ?? 'mn-detail-badge-pending'}`}>
      {status}
    </span>
  );
}

export default function MaintenanceDetailModal({ recordId, onClose, onEdit }: Props) {
  const [record, setRecord]   = useState<MaintenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Permission hook — controls whether Edit button is shown
  const { hasPermission } = usePermission();

  useEffect(() => {
    getMaintenanceById(recordId)
      .then(setRecord)
      .catch(() => setError('Failed to load maintenance record.'))
      .finally(() => setLoading(false));
  }, [recordId]);

  return (
    <div className="mn-detail-overlay" onClick={onClose}>
      <div className="mn-detail-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mn-detail-header">
          <span className="mn-detail-title">Maintenance Details</span>
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
        ) : record ? (
          <>
            {/* Top section */}
            <div className="mn-detail-top">
              <div className="mn-detail-icon">
                <i className="ti ti-tool" aria-hidden="true" />
              </div>
              <div>
                <div className="mn-detail-asset-tag">{record.assetTag}</div>
                <div className="mn-detail-asset-name">{record.assetName}</div>
                <div className="mn-detail-asset-cat">{record.assetCategory}</div>
              </div>
            </div>

            <div className="mn-detail-body">

              {/* Maintenance Info */}
              <div className="mn-detail-section-title">Maintenance Info</div>

              <div className="mn-detail-row">
                <span className="mn-detail-row-label">Type</span>
                <TypeBadge type={record.type} />
              </div>
              <div className="mn-detail-row">
                <span className="mn-detail-row-label">Status</span>
                <StatusBadge status={record.status} />
              </div>
              <div className="mn-detail-row">
                <span className="mn-detail-row-label">Technician / Company</span>
                <span className="mn-detail-row-value">
                  {record.technicianOrCompany ?? '—'}
                </span>
              </div>
              <div className="mn-detail-row">
                <span className="mn-detail-row-label">Cost</span>
                <span className="mn-detail-row-value">{formatCost(record.cost)}</span>
              </div>
              <div className="mn-detail-row">
                <span className="mn-detail-row-label">Completed Date</span>
                <span className="mn-detail-row-value">
                  {formatDate(record.completedDate)}
                </span>
              </div>

              {/* Description */}
              <div className="mn-detail-section-title">Description</div>
              <div className="mn-detail-text">{record.description}</div>

              {/* Remarks */}
              {record.remarks && (
                <>
                  <div className="mn-detail-section-title">Remarks</div>
                  <div className="mn-detail-text">{record.remarks}</div>
                </>
              )}

              {/* Record Info */}
              <div className="mn-detail-section-title">Record Info</div>
              <div className="mn-detail-row">
                <span className="mn-detail-row-label">Created By</span>
                <span className="mn-detail-row-value">{record.createdBy}</span>
              </div>
              <div className="mn-detail-row">
                <span className="mn-detail-row-label">Created At</span>
                <span className="mn-detail-row-value">
                  {formatDate(record.createdAt)}
                </span>
              </div>

            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="mn-detail-footer">
          <button className="mn-detail-btn-close" onClick={onClose}>Close</button>
          {/* Edit button — only show if user has Maintenance:Update permission */}
          {record && hasPermission('Maintenance', 'Update') && (
            <button
              className="mn-detail-btn-edit"
              onClick={() => onEdit(record.id)}
            >
              <i className="ti ti-pencil" /> Edit Record
            </button>
          )}
        </div>

      </div>
    </div>
  );
}