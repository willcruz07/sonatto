import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

interface INavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut } = useAuthStore();
  const location = useLocation();
  
  // Fechar a sidebar quando mudar de rota em dispositivos móveis
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  // Fechar a sidebar quando clicar fora dela (em dispositivos móveis)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.contains(event.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);
  
  const navItems: INavItem[] = [
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard',
      path: '/admin/dashboard'
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Funcionários',
      path: '/admin/employees'
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      label: 'Tarefas',
      path: '/admin/tasks'
    }
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="fixed p-2 text-white bg-gray-800 rounded-md md:hidden top-4 left-4 z-50"
        onClick={toggleMobileMenu}
        type="button"
        aria-label="Menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      
      {/* Sidebar - Desktop and Mobile */}
      <aside
        id="sidebar"
        className={cn(
          'bg-amber-700 text-white h-screen w-[280px] fixed left-0 top-0 transition-transform duration-300 transform z-40 md:translate-x-0 overflow-y-auto',
          isMobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-amber-800">
          <h1 className="text-xl font-bold">
            Sonatto Admin
          </h1>
          <button
            className="p-1 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="py-6">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  className={cn(
                    'flex items-center px-6 py-3 !text-gray-300 hover:bg-amber-800 hover:text-white transition-colors',
                    isActive(item.path) && 'bg-amber-800 !text-white !font-bold'
                  )}
                  to={item.path}
                >
                  {item.icon}
                  <span className="ml-3 text-amber-50">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-amber-800">
          <Button
            className="flex items-center justify-center w-full text-white bg-zinc-800 hover:bg-zinc-800/95"
            onClick={signOut}
            variant="destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}; 