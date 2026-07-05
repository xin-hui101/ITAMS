//authService.ts = Handles API calls related to authentication, such as login and logout, using axios for HTTP requests.
import axios from 'axios';
import type { LoginRequest, LoginResponse } from '../types/auth.types';

// Base URL from environment variable, fallback to localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 automatically
api.interceptors.response.use(
  // Success — return response normally
  (response) => response,

  // Error — if 401, clear token and redirect to login
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// POST /api/auth/login
// Returns LoginResponse on success, throws error on failure
export async function loginUser(request: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', request);
    return response.data;
  } catch (error: any) {
    // Extract error message from backend response
    throw new Error(error.response?.data?.message || 'Login failed. Please try again.');
  }
}

// POST /api/auth/logout
export async function logoutUser(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore logout errors — frontend will clear token regardless
  }
}

export default api;