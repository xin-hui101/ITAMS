// ── Audit Log List Item ───────────────────────────────────────
export interface AuditLogListItem {
  id: number;
  userFullName: string;
  userEmail: string;
  module: string;
  action: string;
  recordType: string;
  recordId: number;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

// ── Audit Log Detail ──────────────────────────────────────────
export interface AuditLogDetail {
  id: number;
  userFullName: string;
  userEmail: string;
  module: string;
  action: string;
  recordType: string;
  recordId: number;
  description: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  createdAt: string;
}

// ── Stats ─────────────────────────────────────────────────────
export interface AuditLogStats {
  todayTotal: number;
  todayCreate: number;
  todayUpdate: number;
  todayDelete: number;
}

// ── Query ─────────────────────────────────────────────────────
export interface AuditLogQuery {
  search?: string;
  module?: string;
  action?: string;
  userId?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

// ── Fixed options ─────────────────────────────────────────────
export const AUDIT_MODULES = [
  'Auth',
  'Users',
  'Categories',
  'Assets',
  'Maintenance',
] as const;

export const AUDIT_ACTIONS = [
  'Login',
  'Create',
  'Update',
  'Delete',
] as const;