// Protected Route component - Redirects to home if not authenticated

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Redirect to home page, but save the attempted URL
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

export default ProtectedRoute;