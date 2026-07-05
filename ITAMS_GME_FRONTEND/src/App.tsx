import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CategoryRefreshProvider } from './context/CategoryRefreshContext';
import { usePermission } from './hooks/usePermission';
import LoginPage from './pages/LoginPage/LoginPage';
import Layout from './components/layout/Layout/Layout';
import UserManagement from './pages/UserManagement/UserManagement';
import CategoryManagement from './pages/Categories/CategoryManagement';
import AssetManagement from './pages/Assets/AssetManagement';
import Maintenance from './pages/Maintenances/Maintenance';
import Dashboard from './pages/Dashboard/Dashboard';
import AuditLog from './pages/Audits/AuditLog';

// Protect routes — redirect to /login if not authenticated
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Permission guard — redirect to /dashboard if user lacks permission
// Even if the user knows the URL, they cannot access the page
function PermissionRoute({
  children,
  module,
}: {
  children: React.ReactNode;
  module: string;
}) {
  const { hasAnyPermission } = usePermission();

  if (!hasAnyPermission(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Set up routes
export default function App() {
  return (
    <AuthProvider>
      <CategoryRefreshProvider>
        <BrowserRouter>
          <Routes>

            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes — all wrapped inside Layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/db" replace />} />

              {/* Obfuscated route paths — harder to guess */}
              <Route path="db" element={<Dashboard />} />

              <Route path="um" element={
                <PermissionRoute module="Users">
                  <UserManagement />
                </PermissionRoute>
              } />

              <Route path="am" element={
                <PermissionRoute module="Assets">
                  <AssetManagement />
                </PermissionRoute>
              } />

              <Route path="mn" element={
                <PermissionRoute module="Maintenance">
                  <Maintenance />
                </PermissionRoute>
              } />

              <Route path="cm" element={
                <PermissionRoute module="Categories">
                  <CategoryManagement />
                </PermissionRoute>
              } />

              <Route path="al" element={
                <PermissionRoute module="AuditLogs">
                  <AuditLog />
                </PermissionRoute>
              } />

            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
      </CategoryRefreshProvider>
    </AuthProvider>
  );
}