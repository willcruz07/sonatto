import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AdminLayout = () => {
  return (
    <div className="flex h-screen w-dvw overflow-hidden bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 w-dvw transition-all duration-300 md:ml-64">
        <main className="h-screen overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-full mx-auto p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}; 