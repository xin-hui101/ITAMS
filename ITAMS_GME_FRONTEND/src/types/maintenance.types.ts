// ── Maintenance List Item ─────────────────────────────────────
export interface MaintenanceListItem {
  id: number;
  assetTag: string;
  assetName: string;
  type: string;
  status: string;
  description: string;
  technicianOrCompany?: string;
  cost?: number;
  completedDate?: string;
  createdBy: string;
  createdAt: string;
}

// ── Maintenance Detail ────────────────────────────────────────
export interface MaintenanceDetail {
  id: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  assetCategory: string;
  type: string;
  status: string;
  description: string;
  technicianOrCompany?: string;
  cost?: number;
  completedDate?: string;
  remarks?: string;
  createdBy: string;
  createdAt: string;
}

// ── Create ────────────────────────────────────────────────────
export interface CreateMaintenancePayload {
  assetId: number;
  type: string;
  status: string;
  description: string;
  technicianOrCompany?: string;
  cost?: number;
  completedDate?: string;
  remarks?: string;
}

// ── Update ────────────────────────────────────────────────────
export interface UpdateMaintenancePayload {
  type: string;
  status: string;
  description: string;
  technicianOrCompany?: string;
  cost?: number;
  completedDate?: string;
  remarks?: string;
}

// ── Query ─────────────────────────────────────────────────────
export interface MaintenanceQuery {
  search?: string;
  status?: string;
  type?: string;
  assetId?: number;
  page: number;
  pageSize: number;
}

// ── Maintenance Stats ─────────────────────────────────────────
export interface MaintenanceStats {
  totalRecords: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
}

// ── Fixed options ─────────────────────────────────────────────
export const MAINTENANCE_TYPES = [
  'Repair',
  'Service',
  'Inspection',
] as const;

export const MAINTENANCE_STATUSES = [
  'Pending',
  'In Progress',
  'Completed',
] as const;

export type MaintenanceType = typeof MAINTENANCE_TYPES[number];
export type MaintenanceStatus = typeof MAINTENANCE_STATUSES[number];