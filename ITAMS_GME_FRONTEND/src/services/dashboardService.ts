import api from './authService';
import type { DashboardData } from '../types/dashboard.types';

// GET /api/dashboard — returns data based on current user's permissions
export async function getDashboard(): Promise<DashboardData> {
  const response = await api.get<DashboardData>('/dashboard');
  return response.data;
}