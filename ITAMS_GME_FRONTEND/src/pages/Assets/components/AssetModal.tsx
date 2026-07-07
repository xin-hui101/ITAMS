import { useState, useEffect } from 'react';
import AutocompleteInput from '../../../components/AutocompleteInput/AutocompleteInput';
import type {
  AssetDetail,
  CreateAssetPayload,
  UpdateAssetPayload,
  AssetFieldInputPayload,
} from '../../../types/asset.types';
import { ASSET_STATUSES } from '../../../types/asset.types';
import type { CategoryField, FixedFieldsConfig } from '../../../types/category.types';
import { getAssetById, createAsset, updateAsset } from '../../../services/assetService';
import { getAllCategories } from '../../../services/categoryService';
import { getCategoryById } from '../../../services/categoryService';
import type { CategoryListItem } from '../../../types/category.types';
import './AssetModal.css';

interface Props {
  assetId: number | null;
  defaultCategoryId?: number;
  onClose: (refreshed?: boolean) => void;
}

interface FormData {
  categoryId:     string;
  name:           string;
  status:         string;
  serialNumber:   string;
  brand:          string;
  model:          string;
  purchasePrice:  string;
  purchaseDate:   string;
  warrantyExpiry: string;
  location:       string;
  notes:          string;
}

interface FormErrors {
  categoryId?:   string;
  name?:         string;
  status?:       string;
  serialNumber?: string;
  brand?:        string;
  model?:        string;
  location?:     string;
}

const EMPTY_FORM: FormData = {
  categoryId:     '',
  name:           '',
  status:         'Active',
  serialNumber:   '',
  brand:          '',
  model:          '',
  purchasePrice:  '',
  purchaseDate:   '',
  warrantyExpiry: '',
  location:       '',
  notes:          '',
};

const DEFAULT_FIXED: FixedFieldsConfig = {
  serialNumber:          false,
  serialNumberInTable:   false,
  brand:                 false,
  brandInTable:          false,
  model:                 false,
  modelInTable:          false,
  location:              false,
  locationInTable:       false,
  purchasePrice:         false,
  purchasePriceInTable:  false,
  warrantyExpiry:        false,
  warrantyExpiryInTable: false,
};

export default function AssetModal({ assetId, defaultCategoryId, onClose }: Props) {
  const isEdit = assetId !== null;

const [form, setForm] = useState<FormData>({
  ...EMPTY_FORM,
  categoryId: defaultCategoryId ? String(defaultCategoryId) : '',
});
  const [errors, setErrors]                 = useState<FormErrors>({});
  const [categories, setCategories]         = useState<CategoryListItem[]>([]);
  const [categoryFields, setCategoryFields] = useState<CategoryField[]>([]);
  const [fixedConfig, setFixedConfig]       = useState<FixedFieldsConfig>(DEFAULT_FIXED);
  const [customValues, setCustomValues]     = useState<Record<number, string>>({});
  const [previewTag, setPreviewTag]         = useState('');
  const [loading, setLoading]               = useState(false);
  const [fetching, setFetching]             = useState(false);
  const [apiError, setApiError]             = useState('');

  // Load all categories for dropdown
  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => {});
  }, []);

  // Load existing asset when editing
  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    getAssetById(assetId!)
      .then((asset: AssetDetail) => {
        setForm({
          categoryId:     String(asset.categoryId),
          name:           asset.name,
          status:         asset.status,
          serialNumber:   asset.serialNumber ?? '',
          brand:          asset.brand ?? '',
          model:          asset.model ?? '',
          purchasePrice:  asset.purchasePrice ? String(asset.purchasePrice) : '',
          purchaseDate:   asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
          warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
          location:       asset.location ?? '',
          notes:          asset.notes ?? '',
        });
        setPreviewTag(asset.assetTag);

        // Set custom values
        const vals: Record<number, string> = {};
        asset.customFields.forEach(f => {
          vals[f.categoryFieldId] =
            f.valueText ?? f.valueNumber?.toString() ?? f.valueDate ?? '';
        });
        setCustomValues(vals);
      })
      .catch(() => setApiError('Failed to load asset data.'))
      .finally(() => setFetching(false));
  }, [assetId, isEdit]);

  // Load category fields and fixedFieldsConfig when category changes
  useEffect(() => {
    if (!form.categoryId) {
      setCategoryFields([]);
      setFixedConfig(DEFAULT_FIXED);
      setPreviewTag('');
      return;
    }

    getCategoryById(Number(form.categoryId))
      .then(cat => {
        setCategoryFields(cat.fields);

        // Parse fixed fields config
        if (cat.fixedFieldsConfig) {
          try {
            setFixedConfig(JSON.parse(cat.fixedFieldsConfig));
          } catch { setFixedConfig(DEFAULT_FIXED); }
        } else {
          setFixedConfig(DEFAULT_FIXED);
        }

        if (!isEdit) {
          setPreviewTag(`${cat.assetPrefix.replace(/\d+$/, '')}???`);
        }
      })
      .catch(() => {});
  }, [form.categoryId, isEdit]);

  // ── Form change ──────────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  }

  function handleCustomChange(fieldId: number, value: string) {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  }

  // ── Build custom fields payload ──────────────────────────────
  function buildCustomFields(): AssetFieldInputPayload[] {
    return categoryFields
      .filter(f => customValues[f.id] !== undefined && customValues[f.id] !== '')
      .map(f => {
        const val = customValues[f.id];
        return {
          categoryFieldId: f.id,
          fieldKey:        f.fieldKey,
          valueText:   f.fieldType === 'text' || f.fieldType === 'select' ? val : undefined,
          valueNumber: f.fieldType === 'number' ? Number(val) : undefined,
          valueDate:   f.fieldType === 'date' ? val : undefined,
        };
      });
  }

  // ── Validation ───────────────────────────────────────────────
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.categoryId)      errs.categoryId   = 'Category is required.';
    if (!form.name.trim())     errs.name         = 'Asset name is required.';
    if (!form.status)          errs.status       = 'Status is required.';

    // Validate required fixed fields based on category config
    if (fixedConfig.serialNumber && !form.serialNumber.trim())
      errs.serialNumber = 'Serial number is required for this category.';
    if (fixedConfig.brand && !form.brand.trim())
      errs.brand = 'Brand is required for this category.';
    if (fixedConfig.model && !form.model.trim())
      errs.model = 'Model is required for this category.';
    if (fixedConfig.location && !form.location.trim())
      errs.location = 'Location is required for this category.';

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
        const payload: UpdateAssetPayload = {
          name:           form.name,
          status:         form.status as any,
          serialNumber:   form.serialNumber || undefined,
          brand:          form.brand || undefined,
          model:          form.model || undefined,
          purchasePrice:  form.purchasePrice ? Number(form.purchasePrice) : undefined,
          purchaseDate:   form.purchaseDate || undefined,
          warrantyExpiry: form.warrantyExpiry || undefined,
          location:       form.location || undefined,
          notes:          form.notes || undefined,
          customFields:   buildCustomFields(),
        };
        await updateAsset(assetId!, payload);
      } else {
        const payload: CreateAssetPayload = {
          categoryId:     Number(form.categoryId),
          name:           form.name,
          status:         form.status as any,
          serialNumber:   form.serialNumber || undefined,
          brand:          form.brand || undefined,
          model:          form.model || undefined,
          purchasePrice:  form.purchasePrice ? Number(form.purchasePrice) : undefined,
          purchaseDate:   form.purchaseDate || undefined,
          warrantyExpiry: form.warrantyExpiry || undefined,
          location:       form.location || undefined,
          notes:          form.notes || undefined,
          customFields:   buildCustomFields(),
        };
        await createAsset(payload);
      }
      onClose(true);
    } catch (err: any) {
      setApiError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render custom field input ─────────────────────────────────
function renderFieldInput(field: CategoryField) {
  const value = customValues[field.id] ?? '';

  if (field.fieldType === 'number') {
    return (
      <input
        className="am-form-input"
        type="number"
        placeholder={field.defaultValue ?? ''}
        value={value}
        onChange={e => handleCustomChange(field.id, e.target.value)}
      />
    );
  }
  if (field.fieldType === 'date') {
    return (
      <input
        className="am-form-input"
        type="date"
        value={value}
        onChange={e => handleCustomChange(field.id, e.target.value)}
      />
    );
  }
  // Text and select — use autocomplete
  return (
    <AutocompleteInput
      fieldKey={field.fieldKey}
      categoryId={form.categoryId ? Number(form.categoryId) : undefined}
      value={value}
      onChange={v => handleCustomChange(field.id, v)}
      placeholder={field.defaultValue ?? ''}
      className="am-form-input"
    />
  );
}

  // Helper — render required asterisk based on fixedConfig
  function requiredMark(isRequired: boolean) {
    return isRequired ? <span style={{ color: '#e74c3c', marginLeft: 2 }}>*</span> : null;
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="am-modal-overlay" onClick={() => onClose()}>
      <div className="am-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="am-modal-header">
          <span className="am-modal-title">
            {isEdit ? 'Edit Asset' : 'Add New Asset'}
          </span>
          <button className="am-modal-close" onClick={() => onClose()}>✕</button>
        </div>

        {/* Body */}
        <div className="am-modal-body">
          {fetching ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
              Loading...
            </div>
          ) : (
            <>
              {apiError && (
                <div className="am-modal-api-error">{apiError}</div>
              )}

              {/* Basic Info */}
              <div className="am-section-title">Basic Info</div>
              <div className="am-form-grid">

                {/* Category */}
                <div className="am-form-field">
                  <label className="am-form-label">
                    Category <span>*</span>
                  </label>
                  <select
    className={`am-form-select ${errors.categoryId ? 'am-form-input--error' : ''}`}
    name="categoryId"
    value={form.categoryId}
    onChange={handleChange}
    disabled={isEdit || !!defaultCategoryId}
    style={(isEdit || !!defaultCategoryId) ? { background: '#f5f5f5', color: '#999', cursor: 'not-allowed' } : {}}
  >
                    <option value="">Select category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <span className="am-form-error">{errors.categoryId}</span>
                  )}
                </div>

                {/* Asset ID Preview */}
                <div className="am-form-field">
                  <label className="am-form-label">Asset ID</label>
                  <div className="am-tag-preview">
                    <span className="am-tag-preview-label">
                      {isEdit ? 'Assigned:' : 'Will be:'}
                    </span>
                    <span className="am-tag-preview-value">
                      {previewTag || '—'}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="am-form-field">
                  <label className="am-form-label">
                    Name <span>*</span>
                  </label>
                  <AutocompleteInput
    fieldKey="name"
    categoryId={form.categoryId ? Number(form.categoryId) : undefined}
    value={form.name}
    onChange={v => setForm(prev => ({ ...prev, name: v }))}
    placeholder="e.g. Dell XPS 15"
    className={`am-form-input ${errors.name ? 'am-form-input--error' : ''}`}
  />
                  {errors.name && (
                    <span className="am-form-error">{errors.name}</span>
                  )}
                </div>

                {/* Status */}
                <div className="am-form-field">
                  <label className="am-form-label">
                    Status <span>*</span>
                  </label>
                  <select
                    className={`am-form-select ${errors.status ? 'am-form-input--error' : ''}`}
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {ASSET_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.status && (
                    <span className="am-form-error">{errors.status}</span>
                  )}
                </div>

                {/* Serial Number */}
<div className="am-form-field">
  <label className="am-form-label">
    Serial Number {requiredMark(fixedConfig.serialNumber)}
  </label>
  <AutocompleteInput
    fieldKey="serialNumber"
    categoryId={form.categoryId ? Number(form.categoryId) : undefined}
    value={form.serialNumber}
    onChange={v => setForm(prev => ({ ...prev, serialNumber: v }))}
    placeholder="e.g. SN-123456"
    className={`am-form-input ${errors.serialNumber ? 'am-form-input--error' : ''}`}
  />
  {errors.serialNumber && (
    <span className="am-form-error">{errors.serialNumber}</span>
  )}
</div>

{/* Brand */}
<div className="am-form-field">
  <label className="am-form-label">
    Brand {requiredMark(fixedConfig.brand)}
  </label>
  <AutocompleteInput
    fieldKey="brand"
    categoryId={form.categoryId ? Number(form.categoryId) : undefined}
    value={form.brand}
    onChange={v => setForm(prev => ({ ...prev, brand: v }))}
    placeholder="e.g. Dell"
    className={`am-form-input ${errors.brand ? 'am-form-input--error' : ''}`}
  />
  {errors.brand && (
    <span className="am-form-error">{errors.brand}</span>
  )}
</div>

{/* Model */}
<div className="am-form-field">
  <label className="am-form-label">
    Model {requiredMark(fixedConfig.model)}
  </label>
  <AutocompleteInput
    fieldKey="model"
    categoryId={form.categoryId ? Number(form.categoryId) : undefined}
    value={form.model}
    onChange={v => setForm(prev => ({ ...prev, model: v }))}
    placeholder="e.g. XPS 15 9500"
    className={`am-form-input ${errors.model ? 'am-form-input--error' : ''}`}
  />
  {errors.model && (
    <span className="am-form-error">{errors.model}</span>
  )}
</div>

{/* Location */}
<div className="am-form-field">
  <label className="am-form-label">
    Location {requiredMark(fixedConfig.location)}
  </label>
  <AutocompleteInput
    fieldKey="location"
    categoryId={form.categoryId ? Number(form.categoryId) : undefined}
    value={form.location}
    onChange={v => setForm(prev => ({ ...prev, location: v }))}
    placeholder="e.g. Office A"
    className={`am-form-input ${errors.location ? 'am-form-input--error' : ''}`}
  />
  {errors.location && (
    <span className="am-form-error">{errors.location}</span>
  )}
</div>

                {/* Purchase Price */}
                <div className="am-form-field">
                  <label className="am-form-label">Purchase Price (RM)</label>
                  <input
                    className="am-form-input"
                    name="purchasePrice"
                    type="number"
                    placeholder="e.g. 5000"
                    value={form.purchasePrice}
                    onChange={handleChange}
                  />
                </div>

                {/* Purchase Date */}
                <div className="am-form-field">
                  <label className="am-form-label">Purchase Date</label>
                  <input
                    className="am-form-input"
                    name="purchaseDate"
                    type="date"
                    value={form.purchaseDate}
                    onChange={handleChange}
                  />
                </div>

                {/* Warranty Expiry */}
                <div className="am-form-field">
                  <label className="am-form-label">Warranty Expiry</label>
                  <input
                    className="am-form-input"
                    name="warrantyExpiry"
                    type="date"
                    value={form.warrantyExpiry}
                    onChange={handleChange}
                  />
                </div>

                {/* Notes */}
                <div className="am-form-field am-form-field-full">
                  <label className="am-form-label">Notes</label>
                  <textarea
                    className="am-form-textarea"
                    name="notes"
                    placeholder="Optional notes..."
                    value={form.notes}
                    onChange={handleChange}
                  />
                </div>

              </div>

              {/* Custom Fields */}
              {categoryFields.length > 0 && (
                <div className="am-custom-fields">
                  <div className="am-section-title">
                    {categories.find(c => c.id === Number(form.categoryId))?.name} Fields
                  </div>
                  <div className="am-form-grid">
                    {categoryFields.map(field => (
                      <div key={field.id} className="am-form-field">
                        <label className="am-form-label">
                          {field.fieldLabel}
                          {field.isRequired && <span> *</span>}
                        </label>
                        {renderFieldInput(field)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No custom fields */}
              {form.categoryId && categoryFields.length === 0 && (
                <div className="am-custom-fields-empty">
                  This category has no custom fields.
                </div>
              )}

            </>
          )}
        </div>

        {/* Footer */}
        <div className="am-modal-footer">
          <button className="am-modal-btn-cancel" onClick={() => onClose()}>
            Cancel
          </button>
          <button
            className="am-modal-btn-save"
            onClick={handleSubmit}
            disabled={loading || fetching}
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Asset'}
          </button>
        </div>

      </div>
    </div>
  );
}