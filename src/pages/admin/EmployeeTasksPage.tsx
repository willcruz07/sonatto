import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { TaskAssignmentForm } from '@/components/tasks/TaskAssignmentForm';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  Clock, 
  Plus, 
  User, 
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import dayjs from '@/lib/dayjs';
import type { IEmployee, ITask, ITaskAssignment, ITaskExecution } from '@/types';

export const EmployeeTasksPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [assignments, setAssignments] = useState<Array<ITaskAssignment & { task?: ITask, executions?: ITaskExecution[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  
  useEffect(() => {
    const fetchEmployeeAndTasks = async () => {
      if (!employeeId) return;
      
      try {
        setLoading(true);
        
        // Buscar dados do funcionário
        const employeeDoc = await getDoc(doc(db, 'users', employeeId));
        if (!employeeDoc.exists()) {
          throw new Error('Funcionário não encontrado');
        }
        
        setEmployee({
          id: employeeDoc.id,
          ...employeeDoc.data()
        } as IEmployee);
        
        // Buscar atribuições de tarefas
        const assignmentsQuery = query(
          collection(db, 'taskAssignments'),
          where('employeeId', '==', employeeId)
        );
        
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          assignedDate: doc.data().assignedDate instanceof Timestamp
            ? doc.data().assignedDate.toDate()
            : new Date(doc.data().assignedDate),
          dueDate: doc.data().dueDate instanceof Timestamp
            ? doc.data().dueDate.toDate()
            : new Date(doc.data().dueDate),
        })) as ITaskAssignment[];
        
        // Buscar detalhes das tarefas
        const assignmentsWithTasks = await Promise.all(
          assignmentsData.map(async (assignment) => {
            // Buscar tarefa
            const taskDoc = await getDoc(doc(db, 'tasks', assignment.taskId));
            const task = taskDoc.exists() 
              ? { id: taskDoc.id, ...taskDoc.data() } as ITask 
              : undefined;
            
            // Buscar execuções
            const executionsQuery = query(
              collection(db, 'taskExecutions'),
              where('assignmentId', '==', assignment.id)
            );
            const executionsSnapshot = await getDocs(executionsQuery);
            const executions = executionsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              executionDate: doc.data().executionDate instanceof Timestamp
                ? doc.data().executionDate.toDate()
                : new Date(doc.data().executionDate),
              startTime: doc.data().startTime instanceof Timestamp
                ? doc.data().startTime.toDate()
                : new Date(doc.data().startTime),
              endTime: doc.data().endTime instanceof Timestamp
                ? doc.data().endTime.toDate()
                : doc.data().endTime ? new Date(doc.data().endTime) : undefined,
            })) as ITaskExecution[];
            
            return {
              ...assignment,
              task,
              executions,
            };
          })
        );
        
        // Ordenar por data de vencimento (mais próxima primeiro)
        assignmentsWithTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
        
        setAssignments(assignmentsWithTasks);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeAndTasks();
  }, [employeeId]);
  
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta atribuição?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'taskAssignments', assignmentId));
      
      // Atualizar lista local
      setAssignments(prevAssignments => 
        prevAssignments.filter(a => a.id !== assignmentId)
      );
    } catch (error) {
      console.error('Erro ao remover atribuição:', error);
      alert('Erro ao remover atribuição');
    }
  };
  
  const handleAssignmentSuccess = () => {
    // Recarregar os dados
    setShowAssignForm(false);
    window.location.reload();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!employee) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Funcionário não encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/admin/employees">Voltar para lista</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            Tarefas de {employee.displayName}
          </h1>
          <p className="text-gray-500">
            Gerencie as tarefas atribuídas a este funcionário
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
          >
            <Link to="/admin/employees">
              <User className="w-4 h-4 mr-2" />
              Voltar para Lista
            </Link>
          </Button>
          
          <Button onClick={() => setShowAssignForm(!showAssignForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Atribuir Nova Tarefa
          </Button>
        </div>
      </div>
      
      {showAssignForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h2 className="text-lg font-medium mb-4">
            Atribuir Tarefa a {employee.displayName}
          </h2>
          <TaskAssignmentForm 
            employeeId={employeeId} 
            onSuccess={handleAssignmentSuccess} 
          />
        </div>
      )}
      
      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">
            Nenhuma tarefa atribuída
          </h2>
          <p className="text-gray-500 mb-4">
            Este funcionário ainda não possui tarefas atribuídas.
          </p>
          <Button onClick={() => setShowAssignForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Atribuir Primeira Tarefa
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <div 
                className="bg-white rounded-lg shadow overflow-hidden"
                key={assignment.id}
              >
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">
                      {assignment.task?.title || 'Tarefa não encontrada'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {assignment.task?.description || 'Sem descrição'}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="w-4 h-4 mr-1 text-gray-400" />
                      Data Prevista: {dayjs(assignment.dueDate).format('DD/MM/YYYY')}
                    </div>
                    
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assignment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : assignment.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {assignment.status === 'pending'
                        ? 'Pendente'
                        : assignment.status === 'in_progress'
                        ? 'Em Progresso'
                        : 'Concluída'}
                    </div>
                  </div>
                  
                  {assignment.executions && assignment.executions.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-1">
                        Execuções:
                      </div>
                      <div className="space-y-2">
                        {assignment.executions.map(execution => (
                          <div 
                            key={execution.id}
                            className="text-xs bg-white p-2 rounded border"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                {dayjs(execution.executionDate).format('DD/MM/YYYY')}
                              </div>
                              <div>
                                Status: {
                                  execution.status === 'pending'
                                    ? 'Pendente'
                                    : execution.status === 'in_progress'
                                    ? 'Em Progresso'
                                    : 'Concluída'
                                }
                              </div>
                            </div>
                            
                            <div className="flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1 text-gray-400" />
                              {dayjs(execution.startTime).format('HH:mm')}
                              {execution.endTime && (
                                <> 
                                  {' → '} 
                                  {dayjs(execution.endTime).format('HH:mm')}
                                  {execution.duration && (
                                    <span className="ml-1 text-gray-500">
                                      ({execution.duration} min)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {execution.notes && (
                              <div className="mt-1 text-gray-600">
                                Obs: {execution.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 