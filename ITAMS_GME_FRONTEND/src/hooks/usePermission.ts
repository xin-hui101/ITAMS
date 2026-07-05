import { useAuth } from '../context/AuthContext';

// Check if current user has a specific permission
export function usePermission() {
  const { user } = useAuth();

  function hasPermission(module: string, action: string): boolean {
    if (!user) return false;
    return user.permissions.includes(`${module}:${action}`);
  }

  function hasAnyPermission(module: string): boolean {
    if (!user) return false;
    return user.permissions.some(p => p.startsWith(`${module}:`));
  }

  return { hasPermission, hasAnyPermission };
}