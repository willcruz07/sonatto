import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UserLayout = () => {
  const { currentUser, signOut } = useAuthStore();
  
  const handleLogout = async () => {
    await signOut();
  };
  
  return (
    <div className="flex flex-col min-h-screen h-screen w-dvw bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow">
        <div className="w-full px-4 py-3 md:py-4 mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
            Sonatto
          </h1>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center">
              {currentUser?.photoURL ? (
                <img
                  alt={currentUser.displayName || 'Usuário'}
                  className="w-8 h-8 rounded-full"
                  src={currentUser.photoURL}
                />
              ) : (
                <div className="flex items-center justify-center w-8 h-8 text-white bg-amber-600 rounded-full">
                  <User className="w-4 h-4" />
                </div>
              )}
              <span className="ml-2 text-sm font-medium hidden sm:inline-block">
                {currentUser?.displayName || 'Usuário'}
              </span>
            </div>
            
            <Button
              className="flex items-center !bg-zinc-800 !text-white hover:!bg-zinc-800/95"
              onClick={handleLogout}
              size="sm"
              variant="ghost"
            >
              <LogOut className="w-4 h-4 mr-1 text-slate-100" />
              <span className="hidden sm:inline-block text-slate-100">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 w-full overflow-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="max-w-full mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-3 text-center text-xs md:text-sm text-gray-500 border-t">
        Sonatto © {new Date().getFullYear()} - Sistema de Gerenciamento de Tarefas
      </footer>
    </div>
  );
}; 