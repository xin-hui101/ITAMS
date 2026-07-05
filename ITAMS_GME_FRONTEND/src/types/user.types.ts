// ── User List Item ────────────────────────────────────────────
// Used in the user table
export interface UserListItem {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// ── User Detail ───────────────────────────────────────────────
// Used in detail view and edit form
export interface UserDetail {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  roleId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
}

// ── Create User ───────────────────────────────────────────────
export interface CreateUserPayload {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number;
  isActive: boolean;
  permissionIds: number[];
}

// ── Update User ───────────────────────────────────────────────
export interface UpdateUserPayload {
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  roleId: number;
  isActive: boolean;
  permissionIds: number[];
}

// ── Query Params ──────────────────────────────────────────────
export interface UserQuery {
  search?: string;
  roleId?: number;
  isActive?: boolean;
  page: number;
  pageSize: number;
}

// ── Paginated Result ──────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Role ──────────────────────────────────────────────────────
export interface Role {
  id: number;
  name: string;
  description?: string;
}

// ── Permission ────────────────────────────────────────────────
export interface Permission {
  id: number;
  module: string;
  action: string;
  description?: string;
}