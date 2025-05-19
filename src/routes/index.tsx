import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserLayout } from '@/components/layout/UserLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Dashboard } from '@/pages/admin/Dashboard';
import { EmployeeList } from '@/pages/admin/EmployeeList';
import { EmployeeForm } from '@/pages/admin/EmployeeForm';
import { TaskList } from '@/pages/admin/TaskList';
import { TaskForm } from '@/pages/admin/TaskForm';
import { UserTaskList } from '@/pages/user/UserTaskList';
import { UserDashboard } from '@/pages/user/UserDashboard';
import { NotFound } from '@/pages/NotFound';
import { TaskAssignmentPage } from '@/pages/admin/TaskAssignmentPage';
import { EmployeeTasksPage } from '@/pages/admin/EmployeeTasksPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Rotas de Admin
  {
    path: '/admin',
    element: <ProtectedRoute requireAdmin={true} />,
    children: [
      {
        path: '',
        element: <AdminLayout />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'employees',
            element: <EmployeeList />,
          },
          {
            path: 'employees/new',
            element: <EmployeeForm />,
          },
          {
            path: 'employees/:id',
            element: <EmployeeForm />,
          },
          {
            path: 'employees/:employeeId/tasks',
            element: <EmployeeTasksPage />,
          },
          {
            path: 'tasks',
            element: <TaskList />,
          },
          {
            path: 'tasks/new',
            element: <TaskForm />,
          },
          {
            path: 'tasks/:taskId',
            element: <TaskForm />,
          },
          {
            path: 'task-assignments/:taskId',
            element: <TaskAssignmentPage />,
          },
        ],
      },
    ],
  },
  // Rotas de Usuário
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <UserLayout />,
        children: [
          {
            path: '',
            element: <UserDashboard />,
          },
          {
            path: 'tasks',
            element: <UserTaskList />,
          },
        ],
      },
    ],
  },
  // Rota 404
  {
    path: '*',
    element: <NotFound />,
  },
]); 