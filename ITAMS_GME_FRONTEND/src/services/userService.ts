import api from './authService';
import type {
  UserListItem,
  UserDetail,
  CreateUserPayload,
  UpdateUserPayload,
  UserQuery,
  PaginatedResult,
  Role,
  Permission,
} from '../types/user.types';

// GET /api/users — get paginated user list with search and filter
export async function getUsers(
  query: UserQuery
): Promise<PaginatedResult<UserListItem>> {
  const params = new URLSearchParams();

  if (query.search)              params.append('search',   query.search);
  if (query.roleId !== undefined) params.append('roleId',  String(query.roleId));
  if (query.isActive !== undefined) params.append('isActive', String(query.isActive));
  params.append('page',     String(query.page));
  params.append('pageSize', String(query.pageSize));

  const response = await api.get<PaginatedResult<UserListItem>>(
    `/users?${params.toString()}`
  );
  return response.data;
}

// GET /api/users/{id} — get single user detail
export async function getUserById(id: number): Promise<UserDetail> {
  const response = await api.get<UserDetail>(`/users/${id}`);
  return response.data;
}

// POST /api/users — create new user
export async function createUser(payload: CreateUserPayload): Promise<UserDetail> {
  try {
    const response = await api.post<UserDetail>('/users', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create user.');
  }
}

// PUT /api/users/{id} — update existing user
export async function updateUser(
  id: number,
  payload: UpdateUserPayload
): Promise<UserDetail> {
  try {
    const response = await api.put<UserDetail>(`/users/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update user.');
  }
}

// DELETE /api/users/{id} — delete user
export async function deleteUser(id: number): Promise<void> {
  try {
    await api.delete(`/users/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete user.');
  }
}

// GET /api/users/roles — get all roles for dropdown
export async function getRoles(): Promise<Role[]> {
  const response = await api.get<Role[]>('/users/roles');
  return response.data;
}

// GET /api/users/permissions — get all permissions for checkboxes
export async function getPermissions(): Promise<Permission[]> {
  const response = await api.get<Permission[]>('/users/permissions');
  return response.data;
}