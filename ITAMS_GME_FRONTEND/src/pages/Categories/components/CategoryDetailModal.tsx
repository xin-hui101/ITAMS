import { useState, useEffect } from 'react';
import type { CategoryDetail, FixedFieldsConfig } from '../../../types/category.types';
import { getCategoryById } from '../../../services/categoryService';
import { usePermission } from '../../../hooks/usePermission';
import './CategoryDetailModal.css';

interface Props {
  categoryId: number;
  onClose: () => void;
  onEdit: (id: number) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// Parse fixedFieldsConfig into readable list
function parseFixedFields(config?: string): { label: string; required: boolean }[] {
  const always = [
    { label: 'Asset Tag', required: true  },
    { label: 'Name',      required: true  },
    { label: 'Status',    required: true  },
  ];

  if (!config) return always;

  try {
    const parsed: FixedFieldsConfig = JSON.parse(config);
    const optional = [
      { label: 'Serial Number', required: parsed.serialNumber },
      { label: 'Brand',         required: parsed.brand        },
      { label: 'Model',         required: parsed.model        },
      { label: 'Location',      required: parsed.location     },
    ];
    return [...always, ...optional];
  } catch {
    return always;
  }
}

export default function CategoryDetailModal({ categoryId, onClose, onEdit }: Props) {
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Permission hook — controls whether Edit button is shown
  const { hasPermission } = usePermission();

  useEffect(() => {
    getCategoryById(categoryId)
      .then(setCategory)
      .catch(() => setError('Failed to load category details.'))
      .finally(() => setLoading(false));
  }, [categoryId]);

  return (
    <div className="cat-detail-overlay" onClick={onClose}>
      <div className="cat-detail-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cat-detail-header">
          <span className="cat-detail-title">Category Details</span>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#e74c3c' }}>
            {error}
          </div>
        ) : category ? (
          <>
            {/* Icon + Name */}
            <div className="cat-detail-icon-section">
              <div className="cat-detail-icon">
                <i className={`ti ${category.icon ?? 'ti-category'}`} aria-hidden="true" />
              </div>
              <div>
              <div className="cat-detail-name">{category.name}</div>
              <div className="cat-detail-desc">
                {category.description || 'No description'}
              </div>
              </div>
              </div>

            <div className="cat-detail-body">

              {/* Info */}
              <div className="cat-detail-section-title">Info</div>
              <div className="cat-detail-row">
                <span className="cat-detail-row-label">Asset ID Prefix</span>
                <span style={{
                  background: '#e8eaf6', color: '#3949ab',
                  padding: '2px 10px', borderRadius: 20,
                  fontSize: 12, fontWeight: 600,
                  fontFamily: 'Courier New, monospace',
                }}>
                  {category.assetPrefix}
                </span>
              </div>
              <div className="cat-detail-row">
                <span className="cat-detail-row-label">Total Assets</span>
                <span className="cat-detail-row-value">{category.assetCount}</span>
              </div>
              <div className="cat-detail-row">
                <span className="cat-detail-row-label">Created By</span>
                <span className="cat-detail-row-value">{category.createdBy}</span>
              </div>
              <div className="cat-detail-row">
                <span className="cat-detail-row-label">Created At</span>
                <span className="cat-detail-row-value">
                  {formatDate(category.createdAt)}
                </span>
              </div>

              {/* Fixed Fields */}
              <div className="cat-detail-section-title">
                Fixed Fields
              </div>
              {parseFixedFields(category.fixedFieldsConfig).map(f => (
                <div key={f.label} className="cat-detail-row">
                  <span className="cat-detail-row-label">{f.label}</span>
                  {f.required ? (
                    <span style={{
                      background: '#e8f5e9', color: '#2e7d32',
                      fontSize: 11, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      Required
                    </span>
                  ) : (
                    <span style={{
                      background: '#f5f5f5', color: '#888',
                      fontSize: 11, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      Optional
                    </span>
                  )}
                </div>
              ))}

              {/* Custom Fields */}
              {category.fields.length > 0 && (
                <>
                  <div className="cat-detail-section-title">
                    Custom Fields ({category.fields.length})
                  </div>
                  {category.fields.map(field => (
                    <div key={field.id} className="cat-detail-field-item">
                      <span className="cat-detail-field-label">
                        {field.fieldLabel}
                      </span>
                      <div className="cat-detail-field-meta">
                        <span className="cat-detail-field-type">
                          {field.fieldType}
                        </span>
                        {field.isRequired && (
                          <span className="cat-detail-field-required">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="cat-detail-footer">
          <button className="cat-detail-btn-close" onClick={onClose}>
            Close
          </button>
          {/* Edit button — only show if user has Categories:Update permission */}
          {category && hasPermission('Categories', 'Update') && (
            <button
              className="cat-detail-btn-edit"
              onClick={() => onEdit(category.id)}
            >
              <i className="ti ti-pencil" /> Edit Category
            </button>
          )}
        </div>

      </div>
    </div>
  );
}