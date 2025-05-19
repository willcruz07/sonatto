import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { TaskExecutionForm } from '@/components/tasks/TaskExecutionForm';
import dayjs from '@/lib/dayjs';
import { FileSpreadsheet } from 'lucide-react';
import type { ITask, ITaskAssignment } from '@/types';
import { 
  observeEmployeeAssignments, 
  observeDailyEmployeeAssignments 
} from '@/services/realtimeService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const UserDashboard = () => {
  const { currentUser } = useAuthStore();
  const [assignments, setAssignments] = useState<Array<ITaskAssignment & { task?: ITask }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayMode, setDisplayMode] = useState<'day' | 'all'>('day');
  
  useEffect(() => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    
    // Função para buscar detalhes das tarefas
    const fetchTaskDetails = async (assignments: ITaskAssignment[]): Promise<Array<ITaskAssignment & { task?: ITask }>> => {
      const assignmentsWithTasks = await Promise.all(
        assignments.map(async (assignment) => {
          try {
            const taskDoc = await getDoc(doc(db, 'tasks', assignment.taskId));
            const task = taskDoc.exists() 
              ? { id: taskDoc.id, ...taskDoc.data() } as ITask 
              : undefined;
              
            return {
              ...assignment,
              task,
            };
          } catch (error) {
            console.error(`Erro ao buscar detalhes da tarefa ${assignment.taskId}:`, error);
            return {
              ...assignment,
              task: undefined
            };
          }
        })
      );
      
      return assignmentsWithTasks;
    };
    
    // Função para ordenar as atribuições
    const sortAssignments = (assignmentsToSort: Array<ITaskAssignment & { task?: ITask }>) => {
      return [...assignmentsToSort].sort((a, b) => {
        // Primeiro por status
        if (a.status !== b.status) {
          if (a.status === 'pending') return -1;
          if (a.status === 'in_progress' && b.status === 'completed') return -1;
          return 1;
        }
        
        // Depois por data de vencimento
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    };
    
    // Função de callback para processar as atribuições
    const processAssignments = async (fetchedAssignments: ITaskAssignment[]) => {
      try {
        const assignmentsWithDetails = await fetchTaskDetails(fetchedAssignments);
        const sortedAssignments = sortAssignments(assignmentsWithDetails);
        setAssignments(sortedAssignments);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao processar atribuições:', error);
        setError('Erro ao carregar tarefas. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    // Função de callback para erro
    const handleError = (error: Error) => {
      console.error('Erro ao buscar atribuições:', error);
      setError('Erro ao carregar tarefas. Por favor, tente novamente.');
      setLoading(false);
    };
    
    // Usar o serviço de tempo real apropriado com base no modo de exibição
    let unsubscribe: () => void;
    
    if (displayMode === 'day') {
      unsubscribe = observeDailyEmployeeAssignments(
        currentUser.id,
        selectedDate,
        processAssignments,
        handleError
      );
    } else {
      unsubscribe = observeEmployeeAssignments(
        currentUser.id,
        processAssignments,
        handleError
      );
    }
    
    // Limpar listener ao desmontar
    return () => {
      unsubscribe();
    };
  }, [currentUser, selectedDate, displayMode]);
  
  const handleDateChange = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <p>{error}</p>
        <button 
          className="mt-2 text-red-600 underline"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Gerencie suas tarefas atribuídas
        </p>
      </div>
      
      {/* Opções de Visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-lg shadow">
        <div className="flex items-center mb-3 sm:mb-0">
          <button
            className={`px-4 py-2 rounded-md mr-2 ${displayMode === 'day' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => setDisplayMode('day')}
          >
            Ver por Dia
          </button>
          <button
            className={`px-4 py-2 rounded-md ${displayMode === 'all' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => setDisplayMode('all')}
          >
            Ver Todas
          </button>
        </div>
        
        {displayMode === 'day' && (
          <div className="flex items-center">
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => handleDateChange(-1)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div className="text-center mx-4">
              <div className="text-md font-medium">
                {dayjs(selectedDate).format('DD [de] MMMM [de] YYYY')}
              </div>
              <div className="text-xs text-gray-500">
                {dayjs(selectedDate).format('dddd')}
              </div>
            </div>
            
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => handleDateChange(1)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Lista de Tarefas */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">
            {displayMode === 'day' 
              ? 'Nenhuma tarefa para hoje' 
              : 'Nenhuma tarefa atribuída'}
          </h2>
          <p className="text-gray-500">
            {displayMode === 'day' 
              ? `Você não possui tarefas atribuídas para ${dayjs(selectedDate).format('DD/MM/YYYY')}.`
              : 'Você não possui nenhuma tarefa atribuída no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <div key={assignment.id}>
              {assignment.task ? (
                <TaskExecutionForm 
                  assignment={assignment} 
                  taskTitle={assignment.task.title}
                  onSuccess={() => {
                    // A atualização será tratada pelo listener em tempo real
                  }}
                />
              ) : (
                <div className="p-4 border rounded-md bg-white shadow-sm">
                  <p className="text-red-500">Tarefa não encontrada</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 