import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireManager?: boolean;
}

export default function ProtectedRoute({ children, requireManager = false }: ProtectedRouteProps) {
  const { user, isManager } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if manager-only route accessed by contributor
  if (requireManager && !isManager) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}