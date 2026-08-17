import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from './ui';
import { useAuth } from '../store/auth-context';
import { isAdminRole } from '../utils/roles';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loading />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}

export function AdminRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return isAdminRole(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}
