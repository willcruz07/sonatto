import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { Users, CheckSquare, Activity } from 'lucide-react';
import { TaskStatus, type IEmployee } from '@/types';
import dayjs from '@/lib/dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Dashboard = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [todayTasksCount, setTodayTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [taskStatusData, setTaskStatusData] = useState<Array<{ name: string; value: number }>>([]);
  const [employeeTaskData, setEmployeeTaskData] = useState<Array<{ name: string; tasks: number }>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Buscar contagem de funcionários (usuários não-admin)
        const usersQuery = query(collection(db, 'users'), where('isAdmin', '==', false));
        const usersSnapshot = await getDocs(usersQuery);
        const employees = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as IEmployee[];
        setEmployeeCount(employees.length);
        
        // Buscar tarefas do dia atual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('dueDate', '>=', today),
          where('dueDate', '<', tomorrow)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const todayTasks = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTodayTasksCount(todayTasks.length);
        
        // Buscar tarefas completadas
        const completedTasksQuery = query(
          collection(db, 'tasks'),
          where('status', '==', TaskStatus.COMPLETED)
        );
        const completedTasksSnapshot = await getDocs(completedTasksQuery);
        setCompletedTasksCount(completedTasksSnapshot.size);
        
        // Dados para o gráfico de status das tarefas
        const allTasksQuery = query(collection(db, 'tasks'));
        const allTasksSnapshot = await getDocs(allTasksQuery);
        const allTasks = allTasksSnapshot.docs.map(doc => doc.data());
        
        const statusCounts = allTasks.reduce((acc: any, task: any) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {});
        
        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status === TaskStatus.PENDING 
            ? 'Pendentes' 
            : status === TaskStatus.IN_PROGRESS 
              ? 'Em Progresso' 
              : 'Concluídas',
          value: count as number
        }));
        setTaskStatusData(statusData);
        
        // Dados para o gráfico de tarefas por funcionário
        const employeeTaskCounts: Record<string, { name: string; tasks: number }> = {};
        
        for (const task of allTasks) {
          if (task.assignedTo) {
            const employeeId = task.assignedTo;
            const employee = employees.find(emp => emp.id === employeeId);
            
            if (employee) {
              const name = employee.displayName || 'Funcionário';
              
              if (!employeeTaskCounts[employeeId]) {
                employeeTaskCounts[employeeId] = {
                  name,
                  tasks: 0
                };
              }
              
              employeeTaskCounts[employeeId].tasks += 1;
            }
          }
        }
        
        setEmployeeTaskData(Object.values(employeeTaskCounts).slice(0, 10)); // Limitar aos 10 principais
      } catch (error) {
        console.error('Erro ao buscar dados para o dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Dashboard
      </h1>
      
      <div className="text-sm text-gray-500">
        {dayjs().format('dddd, DD [de] MMMM [de] YYYY')}
      </div>
      
      {/* Cards com informações resumidas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Funcionários
              </p>
              <p className="text-3xl font-bold">
                {employeeCount}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Tarefas para Hoje
              </p>
              <p className="text-3xl font-bold">
                {todayTasksCount}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CheckSquare className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Tarefas Concluídas
              </p>
              <p className="text-3xl font-bold">
                {completedTasksCount}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Gráfico de Status de Tarefas */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-medium">
            Status das Tarefas
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico de Tarefas por Funcionário */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-medium">
            Tarefas por Funcionário
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={employeeTaskData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="tasks"
                  fill="#82ca9d"
                  name="Número de tarefas"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}; 