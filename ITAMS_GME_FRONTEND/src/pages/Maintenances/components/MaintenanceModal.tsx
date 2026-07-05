import { useState, useEffect } from 'react';
import type {
  MaintenanceDetail,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from '../../../types/maintenance.types';
import { MAINTENANCE_TYPES, MAINTENANCE_STATUSES } from '../../../types/maintenance.types';
import {
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
} from '../../../services/maintenanceService';
import { getAssets } from '../../../services/assetService';
import { getAllCategories } from '../../../services/categoryService';
import type { AssetListItem } from '../../../types/asset.types';
import type { CategoryListItem } from '../../../types/category.types';
import './MaintenanceModal.css';

interface Props {
  recordId: number | null;
  onClose: (refreshed?: boolean) => void;
}

interface FormData {
  categoryId: string;
  assetId: string;
  type: string;
  status: string;
  description: string;
  technicianOrCompany: string;
  cost: string;
  completedDate: string;
  remarks: string;
}

interface FormErrors {
  categoryId?: string;
  assetId?: string;
  type?: string;
  description?: string;
}

const EMPTY_FORM: FormData = {
  categoryId:          '',
  assetId:             '',
  type:                'Repair',
  status:              'Pending',
  description:         '',
  technicianOrCompany: '',
  cost:                '',
  completedDate:       '',
  remarks:             '',
};

export default function MaintenanceModal({ recordId, onClose }: Props) {
  const isEdit = recordId !== null;

  const [form, setForm]         = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [allAssets, setAllAssets]   = useState<AssetListItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [apiError, setApiError] = useState('');

  // Load categories for the first dropdown
  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => {});
  }, []);

  // Load all assets once — filtered client-side by selected category
  useEffect(() => {
    getAssets({ page: 1, pageSize: 999 })
      .then(result => setAllAssets(result.data))
      .catch(() => {});
  }, []);

  // Load existing record when editing
  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    getMaintenanceById(recordId!)
      .then((record: MaintenanceDetail) => {
        // Find the asset's category so the category dropdown pre-selects correctly
        const matchingAsset = allAssets.find(a => a.id === record.assetId);

        setForm({
          categoryId:          matchingAsset ? String(matchingAsset.categoryId) : '',
          assetId:             String(record.assetId),
          type:                record.type,
          status:              record.status,
          description:         record.description,
          technicianOrCompany: record.technicianOrCompany ?? '',
          cost:                record.cost ? String(record.cost) : '',
          completedDate:       record.completedDate
            ? record.completedDate.split('T')[0]
            : '',
          remarks:             record.remarks ?? '',
        });
      })
      .catch(() => setApiError('Failed to load record data.'))
      .finally(() => setFetching(false));
  }, [recordId, isEdit, allAssets]);

  // ── Filtered assets — only those belonging to the selected category ──
  const filteredAssets = form.categoryId
    ? allAssets.filter(a => a.categoryId === Number(form.categoryId))
    : [];

  // ── Selected asset preview ───────────────────────────────────
  const selectedAsset = allAssets.find(a => String(a.id) === form.assetId);

  // ── Form change handler ──────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  }

  // Category change — reset asset selection since the asset list changes
  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const { value } = e.target;
    setForm(prev => ({ ...prev, categoryId: value, assetId: '' }));
    if (errors.categoryId) setErrors(prev => ({ ...prev, categoryId: '' }));
  }

  // ── Validation ───────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.categoryId)     errs.categoryId  = 'Category is required.';
    if (!form.assetId)        errs.assetId     = 'Asset is required.';
    if (!form.type)           errs.type        = 'Type is required.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    try {
      if (isEdit) {
        const payload: UpdateMaintenancePayload = {
          type:                form.type,
          status:              form.status,
          description:         form.description,
          technicianOrCompany: form.technicianOrCompany || undefined,
          cost:                form.cost ? Number(form.cost) : undefined,
          completedDate:       form.completedDate || undefined,
          remarks:             form.remarks || undefined,
        };
        await updateMaintenance(recordId!, payload);
      } else {
        const payload: CreateMaintenancePayload = {
          assetId:             Number(form.assetId),
          type:                form.type,
          status:              form.status,
          description:         form.description,
          technicianOrCompany: form.technicianOrCompany || undefined,
          cost:                form.cost ? Number(form.cost) : undefined,
          completedDate:       form.completedDate || undefined,
          remarks:             form.remarks || undefined,
        };
        await createMaintenance(payload);
      }
      onClose(true);
    } catch (err: any) {
      setApiError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="mn-modal-overlay" onClick={() => onClose()}>
      <div className="mn-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="mn-modal-header">
          <span className="mn-modal-title">
            {isEdit ? 'Edit Maintenance Record' : 'Add Maintenance Record'}
          </span>
          <button className="mn-modal-close" onClick={() => onClose()}>✕</button>
        </div>

        {/* Body */}
        <div className="mn-modal-body">
          {fetching ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
              Loading...
            </div>
          ) : (
            <>
              {apiError && (
                <div className="mn-modal-api-error">{apiError}</div>
              )}

              <div className="mn-form-grid">

                {/* Category — selecting filters the Asset dropdown below */}
                <div className="mn-form-field">
                  <label className="mn-form-label">
                    Category <span>*</span>
                  </label>
                  <select
                    className={`mn-form-select ${errors.categoryId ? 'mn-form-input--error' : ''}`}
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleCategoryChange}
                    disabled={isEdit}
                  >
                    <option value="">Select category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <span className="mn-form-error">{errors.categoryId}</span>
                  )}
                </div>

                {/* Asset — only shows assets from the selected category */}
                <div className="mn-form-field">
                  <label className="mn-form-label">
                    Asset <span>*</span>
                  </label>
                  <select
                    className={`mn-form-select ${errors.assetId ? 'mn-form-input--error' : ''}`}
                    name="assetId"
                    value={form.assetId}
                    onChange={handleChange}
                    disabled={isEdit || !form.categoryId}
                  >
                    <option value="">
                      {form.categoryId ? 'Select asset...' : 'Select a category first'}
                    </option>
                    {filteredAssets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.assetTag} — {a.name}
                      </option>
                    ))}
                  </select>
                  {errors.assetId && (
                    <span className="mn-form-error">{errors.assetId}</span>
                  )}
                </div>

                {/* Asset preview */}
                {selectedAsset && (
                  <div className="mn-form-field mn-form-field-full">
                    <div className="mn-asset-preview">
                      <span className="mn-asset-preview-tag">
                        {selectedAsset.assetTag}
                      </span>
                      <span className="mn-asset-preview-name">
                        {selectedAsset.name}
                        {selectedAsset.brand && ` · ${selectedAsset.brand}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Type */}
                <div className="mn-form-field">
                  <label className="mn-form-label">
                    Type <span>*</span>
                  </label>
                  <select
                    className={`mn-form-select ${errors.type ? 'mn-form-input--error' : ''}`}
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  >
                    {MAINTENANCE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.type && (
                    <span className="mn-form-error">{errors.type}</span>
                  )}
                </div>

                {/* Status */}
                <div className="mn-form-field">
                  <label className="mn-form-label">Status <span>*</span></label>
                  <select
                    className="mn-form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {MAINTENANCE_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="mn-form-field mn-form-field-full">
                  <label className="mn-form-label">
                    Description <span>*</span>
                  </label>
                  <textarea
                    className={`mn-form-textarea ${errors.description ? 'mn-form-input--error' : ''}`}
                    name="description"
                    placeholder="Describe the issue or work to be done..."
                    value={form.description}
                    onChange={handleChange}
                  />
                  {errors.description && (
                    <span className="mn-form-error">{errors.description}</span>
                  )}
                </div>

                {/* Technician / Service Company */}
                <div className="mn-form-field mn-form-field-full">
                  <label className="mn-form-label">Technician / Service Company</label>
                  <input
                    className="mn-form-input"
                    name="technicianOrCompany"
                    placeholder="e.g. John Doe or Tech Solutions Sdn Bhd"
                    value={form.technicianOrCompany}
                    onChange={handleChange}
                  />
                </div>

                {/* Cost */}
                <div className="mn-form-field">
                  <label className="mn-form-label">Cost (RM)</label>
                  <input
                    className="mn-form-input"
                    name="cost"
                    type="number"
                    placeholder="e.g. 350"
                    value={form.cost}
                    onChange={handleChange}
                  />
                </div>

                {/* Completed Date */}
                <div className="mn-form-field">
                  <label className="mn-form-label">Completed Date</label>
                  <input
                    className="mn-form-input"
                    name="completedDate"
                    type="date"
                    value={form.completedDate}
                    onChange={handleChange}
                  />
                </div>

                {/* Remarks */}
                <div className="mn-form-field mn-form-field-full">
                  <label className="mn-form-label">Remarks</label>
                  <textarea
                    className="mn-form-textarea"
                    name="remarks"
                    placeholder="Optional remarks..."
                    value={form.remarks}
                    onChange={handleChange}
                  />
                </div>

              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mn-modal-footer">
          <button className="mn-modal-btn-cancel" onClick={() => onClose()}>
            Cancel
          </button>
          <button
            className="mn-modal-btn-save"
            onClick={handleSubmit}
            disabled={loading || fetching}
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Record'}
          </button>
        </div>

      </div>
    </div>
  );
}