import api from './authService';
import type {
  AssetListItem,
  AssetDetail,
  AssetStats,
  CreateAssetPayload,
  UpdateAssetPayload,
  AssetQuery,
} from '../types/asset.types';
import type { PaginatedResult } from '../types/user.types';


// GET /api/assets — paginated list with search and filter
export async function getAssets(
  query: AssetQuery
): Promise<PaginatedResult<AssetListItem>> {
  const params = new URLSearchParams();

  if (query.search)     params.append('search',     query.search);
if (query.status)     params.append('status',     query.status);
if (query.categoryId) params.append('categoryId', String(query.categoryId));
params.append('page',     String(query.page));
params.append('pageSize', String(query.pageSize));
if (query.sortField)  params.append('sortField',  query.sortField);
if (query.sortOrder)  params.append('sortOrder',  query.sortOrder);

  const response = await api.get<PaginatedResult<AssetListItem>>(
    `/assets?${params.toString()}`
  );
  return response.data;
}

// GET /api/assets/{id}
export async function getAssetById(id: number): Promise<AssetDetail> {
  const response = await api.get<AssetDetail>(`/assets/${id}`);
  return response.data;
}

// GET /api/assets/stats — for KPI cards
export async function getAssetStats(categoryId?: number): Promise<AssetStats> {
  const params = categoryId ? `?categoryId=${categoryId}` : '';
  const response = await api.get<AssetStats>(`/assets/stats${params}`);
  return response.data;
}

// POST /api/assets
export async function createAsset(
  payload: CreateAssetPayload
): Promise<AssetDetail> {
  try {
    const response = await api.post<AssetDetail>('/assets', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create asset.');
  }
}

// PUT /api/assets/{id}
export async function updateAsset(
  id: number,
  payload: UpdateAssetPayload
): Promise<AssetDetail> {
  try {
    const response = await api.put<AssetDetail>(`/assets/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update asset.');
  }
}

// DELETE /api/assets/{id}
export async function deleteAsset(id: number): Promise<void> {
  try {
    await api.delete(`/assets/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete asset.');
  }
}

// GET /api/assets/next-tag?categoryId=xx — preview next asset tag
export async function getNextAssetTag(categoryId: number): Promise<string> {
  const response = await api.get<{ assetTag: string }>(
    `/assets/next-tag?categoryId=${categoryId}`
  );
  return response.data.assetTag;
}