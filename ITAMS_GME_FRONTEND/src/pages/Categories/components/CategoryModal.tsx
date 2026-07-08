import { useState, useEffect } from 'react';
import type {
  CategoryDetail,
  CreateCategoryFieldPayload,
  FixedFieldsConfig,
} from '../../../types/category.types';
import { CATEGORY_ICONS } from '../../../types/category.types';
import {
  getCategoryById,
  createCategory,
  updateCategory,
} from '../../../services/categoryService';
import './CategoryModal.css';

interface Props {
  categoryId: number | null;
  onClose: (refreshed?: boolean) => void;
}

interface FieldRow {
  fieldKey:   string;
  fieldLabel: string;
  fieldType:  string;
  isRequired: boolean;
  showInTable: boolean;
}

interface FormData {
  name:        string;
  description: string;
  assetPrefix: string;
  icon:        string;
}

interface FormErrors {
  name?:        string;
  assetPrefix?: string;
}

const EMPTY_FORM: FormData = {
  name:        '',
  description: '',
  assetPrefix: '',
  icon:        'ti-category',
};

const DEFAULT_FIXED: FixedFieldsConfig = {
  name:                 false,
  nameInTable:          false,
  serialNumber:         false,
  serialNumberInTable:  false,
  brand:                false,
  brandInTable:         false,
  model:                false,
  modelInTable:         false,
  location:             false,
  locationInTable:      false,
  purchasePrice:        false,
  purchasePriceInTable: false,
  warrantyExpiry:       false,
  warrantyExpiryInTable: false,
  purchaseDate:         false,
  purchaseDateInTable:  false,
};

const FIELD_TYPES = [
  { value: 'text',   label: 'Text'   },
  { value: 'number', label: 'Number' },
  { value: 'date',   label: 'Date'   },
  { value: 'select', label: 'Select' },
];

// Fixed fields definition
const FIXED_FIELD_DEFS = [
  { key: 'serialNumber', tableKey: 'serialNumberInTable', label: 'Serial Number', icon: 'ti-barcode'  },
  { key: 'brand',        tableKey: 'brandInTable',        label: 'Brand',         icon: 'ti-building' },
  { key: 'model',        tableKey: 'modelInTable',        label: 'Model',         icon: 'ti-tag'      },
  { key: 'location',     tableKey: 'locationInTable',     label: 'Location',      icon: 'ti-map-pin'  },
  { key: 'purchasePrice',  tableKey: 'purchasePriceInTable',  label: 'Purchase Price', icon: 'ti-currency-dollar' },
  { key: 'warrantyExpiry', tableKey: 'warrantyExpiryInTable', label: 'Warranty Expiry', icon: 'ti-calendar' },
  { key: 'purchaseDate', tableKey: 'purchaseDateInTable', label: 'Purchase Date', icon: 'ti-calendar-event' }
];

export default function CategoryModal({ categoryId, onClose }: Props) {
  const isEdit = categoryId !== null;

  const [form, setForm]           = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [fields, setFields]       = useState<FieldRow[]>([]);
  const [fixedConfig, setFixedConfig] = useState<FixedFieldsConfig>(DEFAULT_FIXED);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);
  const [apiError, setApiError]   = useState('');

  // Load existing category when editing
  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    getCategoryById(categoryId!)
      .then((cat: CategoryDetail) => {
        setForm({
          name:        cat.name,
          description: cat.description ?? '',
          assetPrefix: cat.assetPrefix,
          icon:        cat.icon,
        });
        setFields(cat.fields.map(f => ({
          fieldKey:   f.fieldKey,
          fieldLabel: f.fieldLabel,
          fieldType:  f.fieldType,
          isRequired: f.isRequired,
          showInTable: f.showInTable,
        })));
        if (cat.fixedFieldsConfig) {
          try {
            setFixedConfig(JSON.parse(cat.fixedFieldsConfig));
          } catch { setFixedConfig(DEFAULT_FIXED); }
        }
      })
      .catch(() => setApiError('Failed to load category data.'))
      .finally(() => setFetching(false));
  }, [categoryId, isEdit]);

  // ── Field handlers ───────────────────────────────────────────
  function addField() {
    setFields(prev => [...prev, {
      fieldKey:   '',
      fieldLabel: '',
      fieldType:  'text',
      isRequired: false,
      showInTable: false,
    }]);
  }

  function removeField(index: number) {
    setFields(prev => prev.filter((_, i) => i !== index));
  }

  function handleLabelChange(index: number, value: string) {
    const fieldKey = value
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    setFields(prev => prev.map((f, i) =>
      i === index ? { ...f, fieldLabel: value, fieldKey } : f
    ));
  }

  function updateField(index: number, key: keyof FieldRow, value: string | boolean) {
    setFields(prev => prev.map((f, i) =>
      i === index ? { ...f, [key]: value } : f
    ));
  }

  // ── Form handlers ────────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors(prev => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  }

  // ── Validation ───────────────────────────────────────────────//test
  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())
      errs.name = 'Category name is required.';
    if (!form.assetPrefix.trim()) {
      errs.assetPrefix = 'Asset prefix is required.';
    } else if (!/^[A-Za-z0-9]+-[A-Za-z]*\d+$/.test(form.assetPrefix.trim())) {
  errs.assetPrefix = 'Format must end with numbers. e.g. NF-000, GME-SL0000';
  }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');

    const payload = {
      name:             form.name,
      assetPrefix:      form.assetPrefix.trim(),
      description:      form.description || undefined,
      icon:             form.icon,
      fixedFieldsConfig: JSON.stringify(fixedConfig),
      fields:           fields
        .filter(f => f.fieldLabel.trim())
        .map((f, i): CreateCategoryFieldPayload => ({
          fieldKey:   f.fieldKey || f.fieldLabel.toLowerCase().replace(/\s+/g, '_'),
          fieldLabel: f.fieldLabel,
          fieldType:  f.fieldType,
          isRequired: f.isRequired,
          showInTable: f.showInTable,
          sortOrder:  i,
        })),
    };

    try {
      if (isEdit) {
        await updateCategory(categoryId!, payload);
      } else {
        await createCategory(payload);
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
    <div className="cat-modal-overlay" onClick={() => onClose()}>
      <div className="cat-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cat-modal-header">
          <span className="cat-modal-title">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </span>
          <button className="cat-modal-close" onClick={() => onClose()}>✕</button>
        </div>

        {/* Body */}
        <div className="cat-modal-body">
          {fetching ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
              Loading...
            </div>
          ) : (
            <>
              {apiError && (
                <div className="cat-modal-api-error">{apiError}</div>
              )}

              {/* Basic Info */}
              <div className="cat-form-grid">

                {/* Name */}
                <div className="cat-form-field">
                  <label className="cat-form-label">
                    Name <span>*</span>
                  </label>
                  <input
                    className={`cat-form-input ${errors.name ? 'cat-form-input--error' : ''}`}
                    name="name"
                    placeholder="e.g. Laptop"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && (
                    <span className="cat-form-error">{errors.name}</span>
                  )}
                </div>

                {/* Asset Prefix */}
                <div className="cat-form-field">
                  <label className="cat-form-label">
                    Asset ID Prefix <span>*</span>
                  </label>
                  <input
                    className={`cat-form-input ${errors.assetPrefix ? 'cat-form-input--error' : ''}`}
                    name="assetPrefix"
                    placeholder="e.g. NF-000 or LAP-0000"
                    value={form.assetPrefix}
                    onChange={handleChange}
                    // Cannot change prefix after creation
                    disabled={isEdit}
                    style={isEdit ? { background: '#f5f5f5', color: '#999', cursor: 'not-allowed' } : {}}
                  />
                  {errors.assetPrefix ? (
                    <span className="cat-form-error">{errors.assetPrefix}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#888' }}>
                      {isEdit
                        ? 'Prefix cannot be changed after creation'
                        : 'e.g. NF-000 → first asset will be NF-001'}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="cat-form-field cat-form-field-full">
                  <label className="cat-form-label">Description</label>
                  <textarea
                    className="cat-form-textarea"
                    name="description"
                    placeholder="Optional description..."
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

              </div>

              {/* Icon Picker */}
              <div className="cat-fields-section" style={{ marginBottom: 20 }}>
                <div className="cat-fields-header">
                  <span className="cat-fields-title">Category Icon</span>
                </div>
                <div className="cat-icon-grid">
                  {CATEGORY_ICONS.map(icon => (
                    <div
                      key={icon.value}
                      className={`cat-icon-item ${form.icon === icon.value ? 'selected' : ''}`}
                      onClick={() => setForm(prev => ({ ...prev, icon: icon.value }))}
                    >
                      <i className={`ti ${icon.value}`} />
                      <span>{icon.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Fields */}
              <div className="cat-fields-section" style={{ marginBottom: 20 }}>
                <div className="cat-fields-header">
                  <span className="cat-fields-title">Fixed Fields</span>
                </div>
                <div className="cat-fixed-fields">

                  {/* Always required — locked */}
                  <div className="cat-fixed-field-row">
                    <div className="cat-fixed-field-left">
                      <i className="ti ti-tag" />
                      Asset Tag
                    </div>
                    <span className="cat-fixed-field-locked">Auto Generated</span>
                  </div>
                  <div className="cat-fixed-field-row">
                    <div className="cat-fixed-field-left">
                      <i className="ti ti-forms" />
                      Name
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <label className="cat-fixed-field-required">
        <input
          type="checkbox"
          checked={fixedConfig.name ?? false}
          onChange={e => setFixedConfig(prev => ({
            ...prev,
            name: e.target.checked,
          }))}
        />
        Required
      </label>
      <label className="cat-fixed-field-required">
        <input
          type="checkbox"
          checked={fixedConfig.nameInTable ?? false}
          onChange={e => setFixedConfig(prev => ({
            ...prev,
            nameInTable: e.target.checked,
          }))}
        />
        Table
      </label>
                    </div>  
                  </div>
                  <div className="cat-fixed-field-row">
                    <div className="cat-fixed-field-left">
                      <i className="ti ti-circle-check" />
                      Status
                    </div>
                    <span className="cat-fixed-field-locked">Always Required</span>
                  </div>

                  {/* Optional fixed fields — user can set required */}
                  {FIXED_FIELD_DEFS.map(def => (
  <div key={def.key} className="cat-fixed-field-row">
    <div className="cat-fixed-field-left">
      <i className={`ti ${def.icon}`} />
      {def.label}
    </div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {/* Required checkbox */}
      <label className="cat-fixed-field-required">
        <input
          type="checkbox"
          checked={fixedConfig[def.key as keyof FixedFieldsConfig]}
          onChange={e => setFixedConfig(prev => ({
            ...prev,
            [def.key]: e.target.checked,
          }))}
        />
        Required
      </label>
      {/* Show in table checkbox */}
      <label className="cat-fixed-field-required">
        <input
          type="checkbox"
          checked={fixedConfig[def.tableKey as keyof FixedFieldsConfig]}
          onChange={e => setFixedConfig(prev => ({
            ...prev,
            [def.tableKey]: e.target.checked,
          }))}
        />
        Table
      </label>
    </div>
  </div>
))}

                </div>
              </div>

              {/* Custom Fields */}
              <div className="cat-fields-section">
                <div className="cat-fields-header">
                  <span className="cat-fields-title">Custom Fields</span>
                  <button className="cat-btn-add-field" onClick={addField}>
                    <i className="ti ti-plus" /> Add Field
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="cat-fields-empty">
                    No custom fields yet. Click "Add Field" to add one.
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <div key={index} className="cat-field-row">
                      <input
                        className="cat-field-input"
                        placeholder="Field label"
                        value={field.fieldLabel}
                        onChange={e => handleLabelChange(index, e.target.value)}
                      />
                      <select
                        className="cat-field-select"
                        value={field.fieldType}
                        onChange={e => updateField(index, 'fieldType', e.target.value)}
                      >
                        {FIELD_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <label className="cat-field-required">
                        <input
                          type="checkbox"
                          checked={field.isRequired}
                          onChange={e => updateField(index, 'isRequired', e.target.checked)}
                        />
                        Req
                      </label>

                      {/* Show in table checkbox */}
                      <label className="cat-field-required">
                      <input
                       type="checkbox"
                        checked={field.showInTable}
                        onChange={e => updateField(index, 'showInTable', e.target.checked)}
                      />
                        Table
                      </label>

                      <button
                        className="cat-btn-remove-field"
                        onClick={() => removeField(index)}
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  ))
                )}
              </div>

            </>
          )}
        </div>

        {/* Footer */}
        <div className="cat-modal-footer">
          <button className="cat-modal-btn-cancel" onClick={() => onClose()}>
            Cancel
          </button>
          <button
            className="cat-modal-btn-save"
            onClick={handleSubmit}
            disabled={loading || fetching}
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>

      </div>
    </div>
  );
}
