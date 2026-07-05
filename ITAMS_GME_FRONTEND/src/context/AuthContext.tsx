//AuthContext.tsx = Manages authentication state across the pages in the app using React Context API.

import  { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, UserInfo } from '../types/auth.types';

// Step 1: Create the context with null as default
const AuthContext = createContext<AuthContextType | null>(null);

// Step 2: Create the provider component
// - Wraps the whole app so any component can access auth state
export function AuthProvider({ children }: { children: ReactNode }) {

  // Step 3: Initialize user state from localStorage
  // - If user refreshes the page, restore their session
  const [user, setUser] = useState<UserInfo | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Step 4: Login — save token + user to localStorage and update state
  function login(token: string, userData: UserInfo) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }

  // Step 5: Logout — clear localStorage and reset state
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user, // true if user is not null
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Step 6: Custom hook for easy access
// - Instead of useContext(AuthContext) everywhere, just use useAuth()
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}