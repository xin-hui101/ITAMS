import api from './authService';
import type {
  AuditLogListItem,
  AuditLogDetail,
  AuditLogStats,
  AuditLogQuery,
} from '../types/auditLog.types';
import type { PaginatedResult } from '../types/user.types';

// GET /api/audit-logs — paginated list with search and filter
export async function getAuditLogs(
  query: AuditLogQuery
): Promise<PaginatedResult<AuditLogListItem>> {
  const params = new URLSearchParams();

  if (query.search)   params.append('search',   query.search);
  if (query.module)   params.append('module',   query.module);
  if (query.action)   params.append('action',   query.action);
  if (query.userId)   params.append('userId',   String(query.userId));
  if (query.dateFrom) params.append('dateFrom', query.dateFrom);
  if (query.dateTo)   params.append('dateTo',   query.dateTo);
  params.append('page',     String(query.page));
  params.append('pageSize', String(query.pageSize));

  const response = await api.get<PaginatedResult<AuditLogListItem>>(
    `/audit-logs?${params.toString()}`
  );
  return response.data;
}

// GET /api/audit-logs/{id}
export async function getAuditLogById(id: number): Promise<AuditLogDetail> {
  const response = await api.get<AuditLogDetail>(`/audit-logs/${id}`);
  return response.data;
}

// GET /api/audit-logs/stats — for KPI cards
export async function getAuditLogStats(): Promise<AuditLogStats> {
  const response = await api.get<AuditLogStats>('/audit-logs/stats');
  return response.data;
}