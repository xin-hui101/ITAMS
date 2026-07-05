import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CategoryRefreshProvider } from './context/CategoryRefreshContext';
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
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="assets"      element={<AssetManagement />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="users"       element={<UserManagement />} />
            <Route path="categories"  element={<CategoryManagement />} />
            <Route path="audit-logs"  element={<AuditLog />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
      </CategoryRefreshProvider>
    </AuthProvider>
  );
}