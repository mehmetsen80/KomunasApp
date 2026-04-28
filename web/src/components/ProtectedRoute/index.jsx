import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isSuperAdmin, isAdmin } from '../../utils/roleUtils';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    if (requiredRole === 'SUPER_ADMIN' && !isSuperAdmin(user)) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole === 'ADMIN' && !isAdmin(user)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
