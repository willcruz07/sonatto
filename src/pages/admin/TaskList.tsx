import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  deleteDoc, 
  Timestamp, 
  getDoc 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Calendar, 
  User, 
  MoreVertical, 
  ListFilter,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import dayjs from '@/lib/dayjs';
import type { ITask, IEmployee, ITaskAssignment } from '@/types';
import { TaskStatus } from '@/types';

export const TaskList = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all'); // all, today, upcoming, completed
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        // Buscar todas as tarefas (templates)
        const tasksQuery = query(
          collection(db, 'tasks'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(tasksQuery);
        
        // Obter todas as tarefas
        const tasksData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          const createdAt = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt);
          
          return {
            ...data,
            id: doc.id,
            createdAt,
          } as ITask;
        });
        
        setTasks(tasksData);
        
        // Contar atribuições para cada tarefa
        const assignmentsQuery = query(collection(db, 'taskAssignments'));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        
        const assignmentCounts: Record<string, number> = {};
        
        assignmentsSnapshot.docs.forEach(doc => {
          const data = doc.data() as ITaskAssignment;
          const taskId = data.taskId;
          
          assignmentCounts[taskId] = (assignmentCounts[taskId] || 0) + 1;
        });
        
        setAssignments(assignmentCounts);
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, []);
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        setTasks(tasks.filter(task => task.id !== id));
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
      }
    }
  };
  
  const toggleExpandTask = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };
  
  const getStatusBadgeClasses = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'Pendente';
      case TaskStatus.IN_PROGRESS:
        return 'Em Progresso';
      case TaskStatus.COMPLETED:
        return 'Concluída';
      default:
        return 'Desconhecido';
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">
          Tarefas
        </h1>
        <Button
          asChild
          className="flex items-center bg-amber-700 !text-white hover:bg-amber-700/95"
        >
          <Link to="/admin/tasks/new">
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Link>
        </Button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          className={filter === 'all' ? 'bg-amber-800 hover:bg-amber-800/95' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
          onClick={() => setFilter('all')}
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
        >
          Todas
        </Button>
        <Button
          className={filter === 'today' ? 'bg-amber-800 hover:bg-amber-800/95' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
          onClick={() => setFilter('today')}
          size="sm"
          variant={filter === 'today' ? 'default' : 'outline'}
        >
          Hoje
        </Button>
        <Button
          className={filter === 'upcoming' ? 'bg-amber-800 hover:bg-amber-800/95' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
          onClick={() => setFilter('upcoming')}
          size="sm"
          variant={filter === 'upcoming' ? 'default' : 'outline'}
        >
          Próximas
        </Button>
        <Button
          className={filter === 'completed' ? 'bg-amber-800 !text-white hover:!bg-amber-800/95' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
          onClick={() => setFilter('completed')}
          size="sm"
          variant={filter === 'completed' ? 'default' : 'outline'}
        >
          Concluídas
        </Button>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left border-b">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarefa
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atribuições
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo Est.
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Criação
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td 
                    className="px-6 py-10 text-center text-sm text-gray-500"
                    colSpan={5}
                  >
                    Nenhuma tarefa encontrada
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr
                    className="hover:bg-gray-50"
                    key={task.id}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ListFilter className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {assignments[task.id] || 0} atribuições
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {task.estimatedTime 
                            ? `${task.estimatedTime} min` 
                            : 'Não definido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {dayjs(task.createdAt).format('DD/MM/YYYY')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className='!text-zinc-700 hover:!text-zinc-700/95'
                        >
                          <Link to={`/admin/tasks/${task.id}`}>
                            <Pencil className="w-4 h-4 mr-1" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          onClick={() => handleDelete(task.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                          <span className="text-red-500">
                            Excluir
                          </span>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className='!text-zinc-700 hover:!text-zinc-700/95'
                        >
                          <Link to={`/admin/task-assignments/${task.id}`}>
                            <ListFilter className="w-4 h-4 mr-1" />
                            Atribuir
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            Nenhuma tarefa encontrada
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                  <button 
                    onClick={() => toggleExpandTask(task.id)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Mais opções"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <ListFilter className="w-4 h-4 mr-1 text-gray-400" />
                    {assignments[task.id] || 0} atribuições
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    {task.estimatedTime 
                      ? `${task.estimatedTime} min` 
                      : 'Não definido'}
                  </div>
                </div>
              </div>
              
              {expandedTask === task.id && (
                <div className="bg-gray-50 p-3 flex justify-end gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                  >
                    <Link to={`/admin/tasks/${task.id}`}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                  >
                    <Link to={`/admin/task-assignments/${task.id}`}>
                      <ListFilter className="w-4 h-4 mr-1" />
                      Atribuir
                    </Link>
                  </Button>
                  <Button
                    onClick={() => handleDelete(task.id)}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 