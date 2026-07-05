import { useState, useEffect } from 'react';
import type { AssetDetail } from '../../../types/asset.types';
import { getAssetById } from '../../../services/assetService';
import { usePermission } from '../../../hooks/usePermission';
import './AssetDetailModal.css';

interface Props {
  assetId: number;
  onClose: () => void;
  onEdit: (id: number) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return '—';
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Active':            'am-detail-badge-active',
    'Inactive':          'am-detail-badge-inactive',
    'Under Maintenance': 'am-detail-badge-maintenance',
    'Dispose':           'am-detail-badge-dispose',
  };
  return (
    <span className={`am-detail-badge ${map[status] ?? 'am-detail-badge-inactive'}`}>
      {status}
    </span>
  );
}

function getFieldDisplayValue(fieldType: string, valueText?: string, valueNumber?: number, valueDate?: string): string {
  if (fieldType === 'number' && valueNumber !== undefined) return String(valueNumber);
  if (fieldType === 'date' && valueDate)   return formatDate(valueDate);
  if (valueText) return valueText;
  return '—';
}

export default function AssetDetailModal({ assetId, onClose, onEdit }: Props) {
  const [asset, setAsset]   = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Permission hook — controls whether Edit button is shown
  const { hasPermission } = usePermission();

  useEffect(() => {
    getAssetById(assetId)
      .then(setAsset)
      .catch(() => setError('Failed to load asset details.'))
      .finally(() => setLoading(false));
  }, [assetId]);

  return (
    <div className="am-detail-overlay" onClick={onClose}>
      <div className="am-detail-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="am-detail-header">
          <span className="am-detail-title">Asset Details</span>
          <button className="am-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#e74c3c' }}>
            {error}
          </div>
        ) : asset ? (
          <>
            {/* Top section */}
            <div className="am-detail-top">
              <div className="am-detail-icon">
                <i className="ti ti-device-laptop" aria-hidden="true" />
              </div>
              <div>
                <div className="am-detail-tag">{asset.assetTag}</div>
                <div className="am-detail-name">{asset.name}</div>
                {(asset.brand || asset.model) && (
                  <div className="am-detail-sub">
                    {[asset.brand, asset.model].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>

            <div className="am-detail-body">

              {/* General Info */}
              <div className="am-detail-section-title">General Info</div>

              <div className="am-detail-row">
                <span className="am-detail-row-label">Category</span>
                <span className="am-detail-row-value">{asset.category}</span>
              </div>
              <div className="am-detail-row">
                <span className="am-detail-row-label">Status</span>
                <StatusBadge status={asset.status} />
              </div>
              <div className="am-detail-row">
                <span className="am-detail-row-label">Serial Number</span>
                <span className="am-detail-row-value">{asset.serialNumber ?? '—'}</span>
              </div>
              <div className="am-detail-row">
                <span className="am-detail-row-label">Location</span>
                <span className="am-detail-row-value">{asset.location ?? '—'}</span>
              </div>

              {/* Purchase Info */}
              <div className="am-detail-section-title">Purchase Info</div>

              <div className="am-detail-row">
                <span className="am-detail-row-label">Purchase Price</span>
                <span className="am-detail-row-value">{formatCurrency(asset.purchasePrice)}</span>
              </div>
              <div className="am-detail-row">
                <span className="am-detail-row-label">Purchase Date</span>
                <span className="am-detail-row-value">{formatDate(asset.purchaseDate)}</span>
              </div>
              <div className="am-detail-row">
                <span className="am-detail-row-label">Warranty Expiry</span>
                <span className="am-detail-row-value">{formatDate(asset.warrantyExpiry)}</span>
              </div>

              {/* Notes */}
              {asset.notes && (
                <>
                  <div className="am-detail-section-title">Notes</div>
                  <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                    {asset.notes}
                  </p>
                </>
              )}

              {/* Custom Fields */}
              {asset.customFields.length > 0 && (
                <>
                  <div className="am-detail-section-title">
                    {asset.category} Fields
                  </div>
                  {asset.customFields.map(field => (
                    <div key={field.categoryFieldId} className="am-detail-custom-field">
                      <span className="am-detail-custom-label">{field.fieldLabel}</span>
                      <span className="am-detail-custom-value">
                        {getFieldDisplayValue(
                          field.fieldType,
                          field.valueText,
                          field.valueNumber,
                          field.valueDate
                        )}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {/* Timestamps */}
              <div className="am-detail-section-title">Record Info</div>
              <div className="am-detail-row">
                <span className="am-detail-row-label">Created</span>
                <span className="am-detail-row-value">{formatDate(asset.createdAt)}</span>
              </div>
              <div className="am-detail-row">
                <span className="am-detail-row-label">Last Updated</span>
                <span className="am-detail-row-value">{formatDate(asset.updatedAt)}</span>
              </div>

            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="am-detail-footer">
          <button className="am-detail-btn-close" onClick={onClose}>Close</button>
          {/* Edit button — only show if user has Assets:Update permission */}
          {asset && hasPermission('Assets', 'Update') && (
            <button
              className="am-detail-btn-edit"
              onClick={() => onEdit(asset.id)}
            >
              <i className="ti ti-pencil" /> Edit Asset
            </button>
          )}
        </div>

      </div>
    </div>
  );
}