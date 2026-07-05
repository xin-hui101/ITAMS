// ── Asset by Category ─────────────────────────────────────────
export interface AssetByCategory {
  categoryName: string;
  categoryIcon: string;
  count: number;
}

// ── Warranty Alert ────────────────────────────────────────────
export interface WarrantyAlert {
  id: number;
  assetTag: string;
  name: string;
  categoryName: string;
  warrantyExpiry: string;
  daysLeft: number;
}

// ── Assets Section ────────────────────────────────────────────
export interface DashboardAssets {
  totalAssets: number;
  totalValue: number;
  activeCount: number;
  inactiveCount: number;
  underMaintenanceCount: number;
  disposeCount: number;
  byCategory: AssetByCategory[];
  warrantyAlerts: WarrantyAlert[];
}

// ── Maintenance Section ───────────────────────────────────────
export interface DashboardMaintenance {
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
}

// ── Recent Activity Item ──────────────────────────────────────
export interface RecentActivity {
  userFullName: string;
  action: string;
  description: string;
  createdAt: string;
}

// ── Audit Log Section ─────────────────────────────────────────
export interface DashboardAuditLog {
  todayTotal: number;
  recentActivity: RecentActivity[];
}

// ── Categories Section ────────────────────────────────────────
export interface DashboardCategories {
  totalCategories: number;
}

// ── Dashboard ─────────────────────────────────────────────────
export interface DashboardData {
  assets?: DashboardAssets;
  maintenance?: DashboardMaintenance;
  auditLog?: DashboardAuditLog;
  categories?: DashboardCategories;
}