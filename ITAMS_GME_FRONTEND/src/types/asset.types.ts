// ── Status options ────────────────────────────────────────────
export const ASSET_STATUSES = [
  'Active',
  'Inactive',
  'Under Maintenance',
  'Dispose',
] as const;

export type AssetStatus = typeof ASSET_STATUSES[number];

// ── Asset List Item ───────────────────────────────────────────
export interface AssetListItem {
  id: number;
  assetTag: string;
  name: string;
  category: string;
  categoryId: number;
  status: AssetStatus;
  brand?: string;
  model?: string;
  location?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  purchasePrice?: number;
  createdAt: string;
}

// ── Asset Detail ──────────────────────────────────────────────
export interface AssetDetail {
  id: number;
  assetTag: string;
  name: string;
  categoryId: number;
  category: string;
  status: AssetStatus;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customFields: AssetFieldValue[];
}

// ── Asset Field Value ─────────────────────────────────────────
export interface AssetFieldValue {
  categoryFieldId: number;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
}

// ── Create Asset ──────────────────────────────────────────────
export interface CreateAssetPayload {
  categoryId: number;
  name: string;
  status: AssetStatus;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
  customFields: AssetFieldInputPayload[];
}

// ── Update Asset ──────────────────────────────────────────────
export interface UpdateAssetPayload {
  name: string;
  status: AssetStatus;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  location?: string;
  notes?: string;
  customFields: AssetFieldInputPayload[];
}

// ── Asset Field Input ─────────────────────────────────────────
export interface AssetFieldInputPayload {
  categoryFieldId: number;
  fieldKey: string;
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
}

// ── Query ─────────────────────────────────────────────────────
export interface AssetQuery {
  search?: string;
  status?: string;
  categoryId?: number;
  page: number;
  pageSize: number;
}

// ── Asset Stats ───────────────────────────────────────────────
export interface AssetStats {
  totalCategories: number;
  totalAssets: number;
  activeCount: number;
  inactiveCount: number;
  underMaintenanceCount: number;
  disposeCount: number;
  totalValue: number;
}