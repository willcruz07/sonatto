import { useState, useEffect, useRef } from 'react';
import { 
  doc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { 
  Clock, 
  CalendarClock, 
  CheckCircle2, 
  PlayCircle, 
  Hourglass,
  Filter,
  ListFilter,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import dayjs from '@/lib/dayjs';
import { TaskStatus, type ITask, type ITaskAssignment, type ITaskExecution } from '@/types';
import { observeEmployeeAssignments } from '@/services/realtimeService';

export const UserTaskList = () => {
  const { currentUser } = useAuthStore();
  const [assignments, setAssignments] = useState<Array<ITaskAssignment & { task?: ITask }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [activeTimers, setActiveTimers] = useState<Record<string, { startTime: Date, elapsed: number }>>({});
  const timerRefs = useRef<Record<string, number>>({});

  // Função para formatar o tempo decorrido
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  // Função para iniciar o timer
  const startTimer = (assignmentId: string, startTime: Date) => {
    if (timerRefs.current[assignmentId]) {
      window.clearInterval(timerRefs.current[assignmentId]);
    }

    const now = new Date();
    const initialElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    setActiveTimers(prev => ({
      ...prev,
      [assignmentId]: { startTime, elapsed: initialElapsed }
    }));

    const intervalId = window.setInterval(() => {
      setActiveTimers(prev => ({
        ...prev,
        [assignmentId]: {
          ...prev[assignmentId],
          elapsed: prev[assignmentId].elapsed + 1
        }
      }));
    }, 1000);

    timerRefs.current[assignmentId] = intervalId;
  };

  // Função para parar o timer
  const stopTimer = (assignmentId: string) => {
    if (timerRefs.current[assignmentId]) {
      window.clearInterval(timerRefs.current[assignmentId]);
      delete timerRefs.current[assignmentId];
    }
    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[assignmentId];
      return newTimers;
    });
  };

  // Função para buscar detalhes da tarefa
  const fetchTaskDetails = async (taskId: string): Promise<ITask | undefined> => {
    try {
      const taskDocRef = doc(db, 'tasks', taskId);
      const taskSnapshot = await getDoc(taskDocRef);
      
      if (taskSnapshot.exists()) {
        const taskData = taskSnapshot.data();
        // Garantir que todos os campos necessários existam
        const task: ITask = {
          id: taskSnapshot.id,
          title: taskData.title || 'Tarefa sem título',
          description: taskData.description || 'Sem descrição',
          estimatedTime: taskData.estimatedTime || 0,
          createdAt: taskData.createdAt || Timestamp.now(),
          assignedBy: taskData.assignedBy || currentUser?.id || '',
          ...taskData
        };
        console.log('Tarefa encontrada:', task);
        return task;
      }
      console.warn(`Tarefa ${taskId} não encontrada`);
      return undefined;
    } catch (err) {
      console.error(`Erro ao buscar tarefa ${taskId}:`, err);
      return undefined;
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    // Função para processar as atribuições e buscar as tarefas
    const processAssignments = async (fetchedAssignments: ITaskAssignment[]) => {
      try {
        console.log('Processando atribuições:', fetchedAssignments);
        
        // Buscar detalhes das tarefas para cada atribuição
        const assignmentsWithTasks = await Promise.all(
          fetchedAssignments.map(async assignment => {
            try {
              console.log(`Buscando detalhes da tarefa ${assignment.taskId}`);
              const taskDetails = await fetchTaskDetails(assignment.taskId);
              
              if (!taskDetails) {
                console.warn(`Detalhes da tarefa ${assignment.taskId} não encontrados`);
                return {
                  ...assignment,
                  task: undefined
                };
              }

              // Se a tarefa estiver em progresso, buscar a execução ativa
              if (assignment.status === 'in_progress') {
                console.log(`Buscando execução ativa para tarefa ${assignment.id}`);
                
                try {
                  // Simplificando a consulta para usar apenas os campos essenciais
                  const executionsQuery = query(
                    collection(db, 'taskExecutions'),
                    where('assignmentId', '==', assignment.id),
                    where('status', '==', 'in_progress')
                  );
                  
                  const executionsSnapshot = await getDocs(executionsQuery);
                  
                  if (!executionsSnapshot.empty) {
                    // Ordenar os resultados em memória
                    const executions = executionsSnapshot.docs
                      .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                      } as ITaskExecution))
                      .sort((a, b) => {
                        const timeA = a.startTime instanceof Timestamp ? a.startTime.toDate() : new Date(a.startTime);
                        const timeB = b.startTime instanceof Timestamp ? b.startTime.toDate() : new Date(b.startTime);
                        return timeB.getTime() - timeA.getTime();
                      });

                    const executionData = executions[0];
                    const startTime = executionData.startTime instanceof Timestamp
                      ? executionData.startTime.toDate()
                      : new Date(executionData.startTime);
                    
                    console.log(`Iniciando timer para tarefa ${assignment.id} a partir de ${startTime}`);
                    startTimer(assignment.id, startTime);
                  } else {
                    console.warn(`Nenhuma execução ativa encontrada para tarefa ${assignment.id}`);
                    // Se não encontrar execução ativa, criar uma nova
                    const now = new Date();
                    const executionData = {
                      assignmentId: assignment.id,
                      executionDate: Timestamp.fromDate(now),
                      startTime: Timestamp.fromDate(now),
                      status: TaskStatus.IN_PROGRESS,
                    };
                    
                    await addDoc(collection(db, 'taskExecutions'), executionData);
                    startTimer(assignment.id, now);
                  }
                } catch (error) {
                  console.error('Erro ao buscar execução ativa:', error);
                  // Em caso de erro, criar uma nova execução
                  const now = new Date();
                  const executionData = {
                    assignmentId: assignment.id,
                    executionDate: Timestamp.fromDate(now),
                    startTime: Timestamp.fromDate(now),
                    status: TaskStatus.IN_PROGRESS,
                  };
                  
                  await addDoc(collection(db, 'taskExecutions'), executionData);
                  startTimer(assignment.id, now);
                }
              }
              
              return {
                ...assignment,
                task: taskDetails
              };
            } catch (err) {
              console.error(`Erro ao processar atribuição ${assignment.id}:`, err);
              return {
                ...assignment,
                task: undefined
              };
            }
          })
        );
        
        console.log('Atribuições processadas:', assignmentsWithTasks);
        
        // Ordenar atribuições
        const sortedAssignments = [...assignmentsWithTasks].sort((a, b) => {
          if (a.status !== b.status) {
            if (a.status === 'pending') return -1;
            if (a.status === 'in_progress' && b.status === 'completed') return -1;
            return 1;
          }
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
        
        setAssignments(sortedAssignments);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao processar atribuições:', error);
        setError('Erro ao carregar tarefas. Tente novamente.');
        setLoading(false);
      }
    };
    
    // Função para tratar erros
    const handleError = (error: Error) => {
      console.error('Erro ao observar atribuições:', error);
      setError('Não foi possível carregar suas tarefas. Tente novamente mais tarde.');
      setLoading(false);
    };
    
    // Iniciar observador em tempo real
    const unsubscribe = observeEmployeeAssignments(
      currentUser.id,
      processAssignments,
      handleError
    );
    
    // Limpeza dos timers ao desmontar
    return () => {
      Object.keys(timerRefs.current).forEach(assignmentId => {
        window.clearInterval(timerRefs.current[assignmentId]);
      });
      unsubscribe();
    };
  }, [currentUser]);
  
  const updateAssignmentStatus = async (assignmentId: string, status: TaskStatus) => {
    if (!currentUser) return;
    
    try {
      setActionLoading(assignmentId);
      
      // Primeiro, buscar a atribuição atual para garantir que temos os dados corretos
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        throw new Error('Atribuição não encontrada');
      }

      if (status === 'in_progress') {
        // Criar registro de execução
        const now = new Date();
        const executionData = {
          assignmentId,
          executionDate: Timestamp.fromDate(now),
          startTime: Timestamp.fromDate(now),
          status: TaskStatus.IN_PROGRESS,
        };
        
        await addDoc(collection(db, 'taskExecutions'), executionData);
        startTimer(assignmentId, now);
      } else if (status === 'completed') {
        stopTimer(assignmentId);
      }
      
      // Atualizar status da atribuição
      await updateDoc(doc(db, 'taskAssignments', assignmentId), {
        status,
      });

      // Atualizar o estado local para refletir a mudança imediatamente
      setAssignments(prev => 
        prev.map(a => 
          a.id === assignmentId 
            ? { ...a, status } 
            : a
        )
      );
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao atualizar o status da tarefa. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Progresso';
      case 'completed':
        return 'Concluída';
      default:
        return 'Desconhecido';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Hourglass className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };
  
  const filteredAssignments = filterStatus 
    ? assignments.filter(a => a.status === filterStatus)
    : assignments;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-800">
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
  
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <CalendarClock className="w-16 h-16 mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">
          Nenhuma tarefa encontrada
        </h2>
        <p className="text-gray-500 max-w-md">
          Você não tem tarefas atribuídas no momento.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">
          Suas Tarefas
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Gerencie todas suas tarefas atribuídas
        </p>
      </div>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-3 flex flex-wrap gap-2">
        <span className="text-sm font-medium flex items-center mr-2">
          <ListFilter className="w-4 h-4 mr-1" />
          Filtrar:
        </span>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterStatus === null 
              ? 'bg-amber-700 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setFilterStatus(null)}
        >
          Todas
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterStatus === 'pending' 
              ? 'bg-amber-700 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setFilterStatus('pending')}
        >
          Pendentes
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterStatus === 'in_progress' 
              ? 'bg-amber-700 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setFilterStatus('in_progress')}
        >
          Em Andamento
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filterStatus === 'completed' 
              ? 'bg-amber-700 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setFilterStatus('completed')}
        >
          Concluídas
        </button>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAssignments.map(assignment => (
          assignment.task ? (
            <div
              className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full"
              key={assignment.id}
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getStatusIcon(assignment.status)}
                    <span 
                      className={`ml-2 text-sm font-medium px-2 py-1 rounded-full ${getStatusBadgeClass(assignment.status)}`}
                    >
                      {getStatusText(assignment.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <CalendarClock className="inline-block w-4 h-4 mr-1" />
                    {dayjs(assignment.dueDate).format('DD/MM/YYYY')}
                  </div>
                </div>
                <h3 className="font-medium text-lg line-clamp-1">
                  {assignment.task.title}
                </h3>
              </div>
              
              <div className="p-4 flex-1">
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {assignment.task.description}
                </p>
                

                {assignment.status === 'in_progress' && activeTimers[assignment.id] && (
                  <div className="text-sm text-blue-600 flex items-center mb-4">
                    <Timer className="w-4 h-4 mr-1" />
                    Tempo decorrido: {formatElapsedTime(activeTimers[assignment.id].elapsed)}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 border-t">
                {assignment.status === 'pending' && (
                  <Button
                    className="w-full bg-[#DC6943] hover:bg-[#DC6943]/90 text-white"
                    disabled={!!actionLoading}
                    onClick={() => updateAssignmentStatus(assignment.id, TaskStatus.IN_PROGRESS)}
                    size="sm"
                    variant="default"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    {actionLoading === assignment.id ? 'Iniciando...' : 'Iniciar'}
                  </Button>
                )}
                
                {assignment.status === 'in_progress' && (
                  <Button
                    className="w-full bg-[#DC6943] hover:bg-[#DC6943]/90 text-white"
                    disabled={!!actionLoading}
                    onClick={() => updateAssignmentStatus(assignment.id, TaskStatus.COMPLETED)}
                    size="sm"
                    variant="default"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {actionLoading === assignment.id ? 'Concluindo...' : 'Concluir'}
                  </Button>
                )}
                
                {assignment.status === 'completed' && (
                  <div className="text-center text-sm text-green-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Tarefa concluída
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4" key={assignment.id}>
              <p className="text-red-500">Tarefa não encontrada</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
};