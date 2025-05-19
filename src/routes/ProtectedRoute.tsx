import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface IProtectedRouteProps {
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ requireAdmin = false }: IProtectedRouteProps) => {
  const { currentUser, loading, isAdmin } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-dvw">
        <div className="w-6 h-6 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/tasks" replace />;
  }

  return <Outlet />;
}; 