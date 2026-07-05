import api from './authService';
import type {
  CategoryListItem,
  CategoryDetail,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryQuery,
} from '../types/category.types';
import type { PaginatedResult } from '../types/user.types';

// GET /api/categories — paginated list with search
export async function getCategories(
  query: CategoryQuery
): Promise<PaginatedResult<CategoryListItem>> {
  const params = new URLSearchParams();

  if (query.search) params.append('search', query.search);
  params.append('page',     String(query.page));
  params.append('pageSize', String(query.pageSize));

  const response = await api.get<PaginatedResult<CategoryListItem>>(
    `/categories?${params.toString()}`
  );
  return response.data;
}

// GET /api/categories/all — full list for dropdown
export async function getAllCategories(): Promise<CategoryListItem[]> {
  const response = await api.get<CategoryListItem[]>('/categories/all');
  return response.data;
}

// GET /api/categories/{id}
export async function getCategoryById(id: number): Promise<CategoryDetail> {
  const response = await api.get<CategoryDetail>(`/categories/${id}`);
  return response.data;
}

// POST /api/categories
export async function createCategory(
  payload: CreateCategoryPayload
): Promise<CategoryDetail> {
  try {
    const response = await api.post<CategoryDetail>('/categories', payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create category.');
  }
}

// PUT /api/categories/{id}
export async function updateCategory(
  id: number,
  payload: UpdateCategoryPayload
): Promise<CategoryDetail> {
  try {
    const response = await api.put<CategoryDetail>(`/categories/${id}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update category.');
  }
}

// DELETE /api/categories/{id}
export async function deleteCategory(id: number): Promise<void> {
  try {
    await api.delete(`/categories/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete category.');
  }
}