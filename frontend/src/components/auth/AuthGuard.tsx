import { useAuthStore } from '@/store/authStore';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, userData, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Restrict admin-only routes
  if (user) {
    const isAdminRoute = location.pathname.startsWith('/main');
    const isAdmin = userData?.userType === 'admin';
    if (isAdminRoute && !isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  if (!requireAuth && user) {
    const from = location.state?.from?.pathname || '/sessions';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}