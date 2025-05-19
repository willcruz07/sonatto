import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuthStore } from '@/store/authStore';

export const LoginPage = () => {
  const { currentUser, isAdmin, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/tasks');
      }
    }
  }, [currentUser, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen h-screen w-dvw">
        <div className="w-6 h-6 border-t-2 border-b-2 border-amber-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen h-screen w-dvw bg-gray-100 p-4">
      <LoginForm />
    </div>
  );
}; 