import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Users } from 'lucide-react';
import type { ITask, IEmployee, ITaskAssignment, TaskStatus } from '@/types';
import dayjs from '@/lib/dayjs';
import { useAuthStore } from '@/store/authStore';

interface ITaskAssignmentFormProps {
  taskId?: string; // Se fornecido, usado para atribuir uma tarefa específica
  employeeId?: string; // Se fornecido, usado para atribuir ao funcionário específico
  onSuccess?: () => void;
}

export const TaskAssignmentForm = ({ taskId, employeeId, onSuccess }: ITaskAssignmentFormProps) => {
  const { currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(taskId || null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(
    employeeId ? [employeeId] : []
  );
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [assignedDate, setAssignedDate] = useState<Date>(new Date());
  
  // Buscar funcionários e tarefas disponíveis
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar funcionários (não-admin)
        if (!employeeId) {
          const employeesQuery = query(collection(db, 'users'), where('isAdmin', '==', false));
          const employeesSnapshot = await getDocs(employeesQuery);
          const employeesData = employeesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as IEmployee[];
          setEmployees(employeesData);
        }
        
        // Buscar tarefas disponíveis
        if (!taskId) {
          const tasksQuery = query(collection(db, 'tasks'));
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasksData = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as ITask[];
          setTasks(tasksData);
        }
        
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [taskId, employeeId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTaskId) {
      setError('Selecione uma tarefa para atribuir');
      return;
    }
    
    if (selectedEmployeeIds.length === 0) {
      setError('Selecione pelo menos um funcionário');
      return;
    }
    
    if (!dueDate) {
      setError('Selecione uma data de vencimento');
      return;
    }
    
    if (!assignedDate) {
      setError('Selecione uma data de atribuição');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Para cada funcionário selecionado, criar uma atribuição
      for (const employeeId of selectedEmployeeIds) {
        const assignmentData: Omit<ITaskAssignment, 'id'> = {
          taskId: selectedTaskId,
          employeeId,
          assignedDate,
          dueDate,
          status: 'pending' as TaskStatus,
          assignedBy: currentUser?.id || '',
        };
        
        await addDoc(collection(db, 'taskAssignments'), {
          ...assignmentData,
          assignedDate: Timestamp.fromDate(assignedDate),
          dueDate: Timestamp.fromDate(dueDate),
        });
      }
      
      setSuccess(true);
      setSelectedTaskId(taskId || null);
      setSelectedEmployeeIds(employeeId ? [employeeId] : []);
      setDueDate(new Date());
      setAssignedDate(new Date());
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Erro ao atribuir tarefa:', error);
      setError('Erro ao atribuir tarefa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-white bg-red-500 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 text-sm text-white bg-green-500 rounded">
          Tarefa(s) atribuída(s) com sucesso!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seleção de Tarefa */}
        {!taskId && (
          <div>
            <label className="block mb-1 text-sm font-medium">
              Selecionar Tarefa
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              value={selectedTaskId || ''}
            >
              <option value="">-- Selecione uma tarefa --</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Seleção de Funcionários */}
        {!employeeId && (
          <div>
            <label className="block mb-1 text-sm font-medium">
              Selecionar Funcionários
            </label>
            <div className="space-y-2">
              {employees.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum funcionário disponível
                </p>
              ) : (
                employees.map((employee) => (
                  <div key={employee.id} className="flex items-center">
                    <input
                      checked={selectedEmployeeIds.includes(employee.id)}
                      className="w-4 h-4 mr-2"
                      disabled={loading}
                      id={`employee-${employee.id}`}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployeeIds([...selectedEmployeeIds, employee.id]);
                        } else {
                          setSelectedEmployeeIds(
                            selectedEmployeeIds.filter((id) => id !== employee.id)
                          );
                        }
                      }}
                      type="checkbox"
                    />
                    <label htmlFor={`employee-${employee.id}`} className="text-sm">
                      {employee.displayName}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Seleção de Data de Atribuição */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Data de Atribuição
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !assignedDate && "text-muted-foreground"
                )}
                disabled={loading}
                variant="outline"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {assignedDate ? dayjs(assignedDate).format('DD/MM/YYYY') : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={assignedDate}
                onSelect={(date) => date && setAssignedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Seleção de Data de Vencimento */}
        <div>
          <label className="block mb-1 text-sm font-medium">
            Data de Vencimento
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
                disabled={loading}
                variant="outline"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? dayjs(dueDate).format('DD/MM/YYYY') : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(date) => date && setDueDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Button
          className="w-full"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Atribuindo...' : 'Atribuir Tarefa(s)'}
        </Button>
      </form>
    </div>
  );
}; 