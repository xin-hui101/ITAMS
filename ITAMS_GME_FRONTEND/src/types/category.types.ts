// ── Category List Item ────────────────────────────────────────
export interface CategoryListItem {
  id: number;
  categoryCode: string;
  name: string;
  assetPrefix: string;
  description?: string;
  fixedFieldsConfig?: string;
  icon: string;
  assetCount: number;
  fieldCount: number;
  createdAt: string;
  createdBy: string;
}

// ── Category Detail ───────────────────────────────────────────
export interface CategoryDetail {
  id: number;
  categoryCode: string;
  name: string;
  assetPrefix: string;
  description?: string;
  icon: string;
  fixedFieldsConfig?: string;
  assetCount: number;
  createdAt: string;
  createdBy: string;
  fields: CategoryField[];
}

// ── Category Field ────────────────────────────────────────────
export interface CategoryField {
  id: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select';
  isRequired: boolean;
  showInTable: boolean;
  defaultValue?: string;
  sortOrder: number;
}

// ── Fixed Fields Config ───────────────────────────────────────
export interface FixedFieldsConfig {
  serialNumber:        boolean;
  serialNumberInTable: boolean;
  brand:               boolean;
  brandInTable:        boolean;
  model:               boolean;
  modelInTable:        boolean;
  location:            boolean;
  locationInTable:     boolean;
  purchasePrice:       boolean;
  purchasePriceInTable: boolean;
  warrantyExpiry:      boolean;
  warrantyExpiryInTable: boolean;
}

// ── Create Category ───────────────────────────────────────────
export interface CreateCategoryPayload {
  name: string;
  assetPrefix: string;
  description?: string;
  icon: string;
  fixedFieldsConfig?: string;
  fields: CreateCategoryFieldPayload[];
}

// ── Update Category ───────────────────────────────────────────
export interface UpdateCategoryPayload {
  name: string;
  assetPrefix: string;
  description?: string;
  icon: string;
  fixedFieldsConfig?: string;
  fields: CreateCategoryFieldPayload[];
}

// ── Create Field ──────────────────────────────────────────────
export interface CreateCategoryFieldPayload {
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  showInTable: boolean;
  defaultValue?: string;
  sortOrder: number;
}

// ── Query ─────────────────────────────────────────────────────
export interface CategoryQuery {
  search?: string;
  page: number;
  pageSize: number;
}

// ── Available icons for category ──────────────────────────────
export const CATEGORY_ICONS = [
  { value: 'ti-device-laptop',    label: 'Laptop'         },
  { value: 'ti-desktop',          label: 'Desktop'        },
  { value: 'ti-printer',          label: 'Printer'        },
  { value: 'ti-network',          label: 'Network'        },
  { value: 'ti-server',           label: 'Server'         },
  { value: 'ti-device-mobile',    label: 'Mobile'         },
  { value: 'ti-camera',           label: 'Camera'         },
  { value: 'ti-phone',            label: 'Phone'          },
  { value: 'ti-keyboard',         label: 'Keyboard'       },
  { value: 'ti-mouse',            label: 'Mouse'          },
  { value: 'ti-router',           label: 'Router'         },
  { value: 'ti-cpu',              label: 'CPU'            },
  { value: 'ti-device-tv',        label: 'TV/Monitor'     },
  { value: 'ti-tool',             label: 'Tool'           },
  { value: 'ti-plug',             label: 'Power'          },
  { value: 'ti-battery',          label: 'Battery'        },
  { value: 'ti-headphones',       label: 'Headphones'     },
  { value: 'ti-scan',             label: 'Scanner'        },
  { value: 'ti-box',              label: 'Equipment'      },
  { value: 'ti-category',         label: 'Other'          },
] as const;