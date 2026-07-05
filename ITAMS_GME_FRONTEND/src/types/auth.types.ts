//auth.types.ts = Defines TypeScript interfaces for authentication-related data structures, 
// including login requests, responses, user info, and the shape of the auth context used across the app.

// ── Request type ─────────────────────────────────────────────
// What we send to the backend when logging in
export interface LoginRequest {
  email: string;
  password: string;
}

// ── Response types ────────────────────────────────────────────
// User info returned from backend after successful login
export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  username: string;
  role: string;
  permissions: string[]; // e.g. ["Assets:Read", "Assets:Create"]
}

// Full login response from backend
export interface LoginResponse {
  token: string;
  user: UserInfo;
}

// ── Auth context type ─────────────────────────────────────────
// Shape of the auth context shared across the app
export interface AuthContextType {
  user: UserInfo | null;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  isAuthenticated: boolean;
}