import api from './authService';
import type {
  MaintenanceListItem,
  MaintenanceDetail,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
  MaintenanceQuery,
} from '../types/maintenance.types';
import type { PaginatedResult } from '../types/user.types';
import type { MaintenanceStats } from '../types/maintenance.types';


// GET /api/maintenance — paginated list with search and filter
export async function getMaintenance(
  query: MaintenanceQuery
): Promise<PaginatedResult<MaintenanceListItem>> {
  const params = new URLSearchParams();

  if (query.search)   params.append('search',   query.search);
  if (query.status)   params.append('status',   query.status);
  if (query.type)     params.append('type',     query.type);
  if (query.assetId)  params.append('assetId',  String(query.assetId));
  params.append('page',     String(query.page));
  params.append('pageSize', String(query.pageSize));

  const response = await api.get<PaginatedResult<MaintenanceListItem>>(
    `/maintenance?${params.toString()}`
  );
  return response.data;
}

// GET /api/maintenance/{id}
export async function getMaintenanceById(id: number): Promise<MaintenanceDetail> {
  const response = await api.get<MaintenanceDetail>(`/maintenance/${id}`);
  return response.data;
}

// POST /api/maintenance
export async function createMaintenance(
  payload: CreateMaintenancePayload
): Promise<MaintenanceDetail> {
  try {
    const response = await api.post<MaintenanceDetail>('/maintenance', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create maintenance record.');
  }
}

// PUT /api/maintenance/{id}
export async function updateMaintenance(
  id: number,
  payload: UpdateMaintenancePayload
): Promise<MaintenanceDetail> {
  try {
    const response = await api.put<MaintenanceDetail>(`/maintenance/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update maintenance record.');
  }
}

// DELETE /api/maintenance/{id}
export async function deleteMaintenance(id: number): Promise<void> {
  try {
    await api.delete(`/maintenance/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete maintenance record.');
  }
}

// GET /api/maintenance/stats — for KPI cards
export async function getMaintenanceStats(): Promise<MaintenanceStats> {
  const response = await api.get<MaintenanceStats>('/maintenance/stats');
  return response.data;
}