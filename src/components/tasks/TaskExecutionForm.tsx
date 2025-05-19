import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { TaskStatus, type ITaskExecution, type ITaskAssignment, type ITask } from '@/types';
import dayjs from '@/lib/dayjs';
import { Clock, Calendar, ClipboardCheck, InfoIcon, Play, Pause, Timer } from 'lucide-react';

interface ITaskExecutionFormProps {
  assignment: ITaskAssignment;
  taskTitle: string;
  onSuccess?: () => void;
}

export const TaskExecutionForm = ({ assignment, taskTitle, onSuccess }: ITaskExecutionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [taskDetails, setTaskDetails] = useState<ITask | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  
  // Inicializar timer
  const startTimer = (initialStart: Date) => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
    }
    
    const now = new Date();
    const initialElapsed = Math.floor((now.getTime() - initialStart.getTime()) / 1000);
    setElapsedTime(initialElapsed);
    
    const intervalId = window.setInterval(() => {
      setElapsedTime(prevTime => prevTime + 1);
    }, 1000);
    
    timerIntervalRef.current = intervalId;
  };
  
  // Parar timer
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
  
  // Formatar tempo para exibição (formato HH:MM:SS)
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
  
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const taskDocRef = doc(db, 'tasks', assignment.taskId);
        
        // Usar onSnapshot para ouvir atualizações em tempo real
        const unsubscribe = onSnapshot(taskDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            setTaskDetails({
              ...docSnapshot.data(),
              id: docSnapshot.id
            } as ITask);
          }
        }, (error) => {
          console.error('Erro ao observar detalhes da tarefa:', error);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Erro ao configurar observador de tarefas:', error);
        return () => {};
      }
    };
    
    // Verificar execuções em andamento
    const checkActiveExecution = async () => {
      // Primeiro verificar localStorage
      const cachedExecutionId = localStorage.getItem(`task_execution_${assignment.id}`);
      
      if (cachedExecutionId) {
        setExecutionId(cachedExecutionId);
        setIsExecuting(true);
        
        // Buscar dados da execução
        const executionDocRef = doc(db, 'taskExecutions', cachedExecutionId);
        
        // Observar em tempo real
        return onSnapshot(executionDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const executionData = docSnapshot.data();
            const startTimeData = executionData.startTime instanceof Timestamp
              ? executionData.startTime.toDate()
              : new Date(executionData.startTime);
            
            setStartTime(startTimeData);
            startTimer(startTimeData);
          }
        }, (error) => {
          console.error('Erro ao observar execução:', error);
        });
      }
      
      // Se status da atribuição for "in_progress" mas não temos ID no localStorage,
      // vamos buscar a execução mais recente
      if (assignment.status === 'in_progress' && !cachedExecutionId) {
        try {
          const executionsQuery = query(
            collection(db, 'taskExecutions'),
            where('assignmentId', '==', assignment.id),
            where('status', '==', 'in_progress'),
            orderBy('startTime', 'desc'),
            limit(1)
          );
          
          const querySnapshot = await getDocs(executionsQuery);
          
          if (!querySnapshot.empty) {
            const executionDoc = querySnapshot.docs[0];
            const executionData = executionDoc.data();
            const startTimeData = executionData.startTime instanceof Timestamp
              ? executionData.startTime.toDate()
              : new Date(executionData.startTime);
            
            setExecutionId(executionDoc.id);
            setIsExecuting(true);
            setStartTime(startTimeData);
            startTimer(startTimeData);
            
            // Salvar no localStorage para futuras referências
            localStorage.setItem(`task_execution_${assignment.id}`, executionDoc.id);
            
            // Configurar listener
            return onSnapshot(doc(db, 'taskExecutions', executionDoc.id), (docSnapshot) => {
              if (!docSnapshot.exists()) return;
              
              const data = docSnapshot.data();
              if (data.status === 'completed') {
                setIsExecuting(false);
                stopTimer();
                localStorage.removeItem(`task_execution_${assignment.id}`);
              }
            });
          }
        } catch (error) {
          console.error('Erro ao verificar execuções ativas:', error);
        }
      }
      
      return () => {};
    };
    
    // Inicializar os observadores
    let taskUnsubscribe: (() => void) | undefined;
    let executionUnsubscribe: (() => void) | undefined;
    
    // Usar Promise.all para lidar com as promessas assíncronas
    Promise.all([
      fetchTaskDetails(),
      checkActiveExecution()
    ]).then(([taskUnsub, execUnsub]) => {
      taskUnsubscribe = taskUnsub;
      executionUnsubscribe = execUnsub;
    });
    
    // Limpeza ao desmontar
    return () => {
      if (taskUnsubscribe) taskUnsubscribe();
      if (executionUnsubscribe) executionUnsubscribe();
      stopTimer();
    };
  }, [assignment.id, assignment.taskId, assignment.status]);
  
  const startExecution = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      setStartTime(now);
      setIsExecuting(true);
      
      // Criar registro de execução
      const executionData: Omit<ITaskExecution, 'id'> = {
        assignmentId: assignment.id,
        executionDate: now,
        startTime: now,
        status: TaskStatus.IN_PROGRESS,
      };
      
      const docRef = await addDoc(collection(db, 'taskExecutions'), {
        ...executionData,
        executionDate: Timestamp.fromDate(now),
        startTime: Timestamp.fromDate(now),
      });
      
      setExecutionId(docRef.id);
      
      // Atualizar status da atribuição
      await updateDoc(doc(db, 'taskAssignments', assignment.id), {
        status: TaskStatus.IN_PROGRESS,
      });
      
      localStorage.setItem(`task_execution_${assignment.id}`, docRef.id);
      
      // Iniciar timer
      startTimer(now);
      
    } catch (error) {
      console.error('Erro ao iniciar execução:', error);
      setError('Erro ao iniciar execução. Tente novamente.');
      setIsExecuting(false);
      stopTimer();
    } finally {
      setLoading(false);
    }
  };
  
  const completeExecution = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      setEndTime(now);
      
      // Verificar se temos um executionId
      if (!executionId) {
        const localStorageId = localStorage.getItem(`task_execution_${assignment.id}`);
        if (!localStorageId) {
          throw new Error('Execução não encontrada');
        }
        setExecutionId(localStorageId);
      }
      
      // Calcular duração em minutos
      if (!startTime) {
        throw new Error('Hora de início não registrada');
      }
      
      const durationInMs = now.getTime() - startTime.getTime();
      const durationInMinutes = Math.round(durationInMs / (1000 * 60));
      
      // Atualizar execução
      await updateDoc(doc(db, 'taskExecutions', executionId!), {
        endTime: Timestamp.fromDate(now),
        duration: durationInMinutes,
        notes,
        status: TaskStatus.COMPLETED,
      });
      
      // Atualizar atribuição
      await updateDoc(doc(db, 'taskAssignments', assignment.id), {
        status: TaskStatus.COMPLETED,
      });
      
      localStorage.removeItem(`task_execution_${assignment.id}`);
      setIsExecuting(false);
      stopTimer();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erro ao concluir execução:', error);
      setError('Erro ao concluir execução. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadgeClass = () => {
    switch (assignment.status) {
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
  
  const getStatusText = () => {
    switch (assignment.status) {
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
  
  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium">
          {taskTitle}
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="mb-3">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 text-sm flex items-center hover:underline"
        >
          <InfoIcon className="w-4 h-4 mr-1" />
          {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      </div>
      
      {showDetails && taskDetails && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm space-y-2">
          <p className="text-gray-700">{taskDetails.description}</p>
          
          {taskDetails.estimatedTime && (
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-1" />
              Tempo estimado: {taskDetails.estimatedTime} minutos
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            Atribuída em: {dayjs(assignment.assignedDate).format('DD/MM/YYYY')}
          </div>
          
          <div className="flex items-center text-gray-600">
            <ClipboardCheck className="w-4 h-4 mr-1" />
            Vencimento: {dayjs(assignment.dueDate).format('DD/MM/YYYY')}
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-3 mb-3 text-sm text-white bg-red-500 rounded">
          {error}
        </div>
      )}
      
      {isExecuting ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">
                Iniciado às {startTime ? dayjs(startTime).format('HH:mm') : '--:--'}
              </div>
              <div className="text-sm font-semibold flex items-center">
                <Timer className="w-4 h-4 mr-1 text-blue-500" />
                Tempo decorrido: <span className="font-mono ml-1">{formatElapsedTime(elapsedTime)}</span>
              </div>
            </div>
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              Em Progresso
            </div>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium">
              Anotações
            </label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione anotações sobre esta execução"
              rows={3}
              value={notes}
            />
          </div>
          
          <Button
            className="w-full"
            disabled={loading}
            onClick={completeExecution}
          >
            {loading ? 'Concluindo...' : 'Concluir Execução'}
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 text-gray-500 mb-3 text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Vence em: {dayjs(assignment.dueDate).format('DD/MM/YYYY')}
            </div>
          </div>
          <Button
            className="w-full flex items-center justify-center"
            disabled={loading || assignment.status === 'completed'}
            onClick={startExecution}
          >
            {loading ? (
              'Iniciando...'
            ) : assignment.status === 'completed' ? (
              'Concluída'
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Execução
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}; 