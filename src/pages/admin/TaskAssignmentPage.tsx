import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { TaskAssignmentForm } from '@/components/tasks/TaskAssignmentForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import type { ITask, ITaskAssignment, IEmployee } from '@/types';
import dayjs from '@/lib/dayjs';

export const TaskAssignmentPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<ITask | null>(null);
  const [assignments, setAssignments] = useState<Array<ITaskAssignment & { employee?: IEmployee }>>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignForm, setShowAssignForm] = useState(false);
  
  useEffect(() => {
    const fetchTaskAndAssignments = async () => {
      if (!taskId) return;
      
      try {
        setLoading(true);
        
        // Buscar dados da tarefa
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (!taskDoc.exists()) {
          throw new Error('Tarefa não encontrada');
        }
        
        setTask({
          id: taskDoc.id,
          ...taskDoc.data()
        } as ITask);
        
        // Buscar atribuições para esta tarefa
        const assignmentsQuery = query(
          collection(db, 'taskAssignments'),
          where('taskId', '==', taskId)
        );
        
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ITaskAssignment[];
        
        // Buscar dados dos funcionários
        const assignmentsWithEmployees = await Promise.all(
          assignmentsData.map(async (assignment) => {
            const employeeDoc = await getDoc(doc(db, 'users', assignment.employeeId));
            const employee = employeeDoc.exists() 
              ? { id: employeeDoc.id, ...employeeDoc.data() } as IEmployee 
              : undefined;
            
            return {
              ...assignment,
              employee,
              dueDate: assignment.dueDate instanceof Date 
                ? assignment.dueDate 
                : new Date(assignment.dueDate),
              assignedDate: assignment.assignedDate instanceof Date 
                ? assignment.assignedDate 
                : new Date(assignment.assignedDate),
            };
          })
        );
        
        // Ordenar por status e data
        assignmentsWithEmployees.sort((a, b) => {
          if (a.status !== b.status) {
            if (a.status === 'pending') return -1;
            if (a.status === 'in_progress' && b.status === 'completed') return -1;
            return 1;
          }
          
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
        
        setAssignments(assignmentsWithEmployees);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskAndAssignments();
  }, [taskId]);
  
  const handleAssignmentSuccess = () => {
    // Recarregar os dados
    setShowAssignForm(false);
    window.location.reload();
  };
  
  const getStatusBadgeClasses = (status: string) => {
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Tarefa não encontrada</p>
        <Button asChild className="mt-4">
          <Link to="/admin/tasks">Voltar para lista</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          className="mr-4 !text-amber-700"
          onClick={() => navigate('/admin/tasks')}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-xl md:text-2xl font-bold truncate">
          Atribuições: {task.title}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-2">Detalhes da Tarefa</h2>
        <p className="text-gray-700 mb-2">{task.description}</p>
        <div className="text-sm text-gray-500">
          Tempo estimado: {task.estimatedTime ? `${task.estimatedTime} minutos` : 'Não definido'}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">
          Atribuições ({assignments.length})
        </h2>
        <Button 
          className='!bg-amber-700 !text-white hover:!bg-amber-700/95'
          onClick={() => setShowAssignForm(!showAssignForm)}
        >
          {showAssignForm ? 'Cancelar' : 'Atribuir à Funcionários'}
        </Button>
      </div>
      
      {showAssignForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <TaskAssignmentForm 
            taskId={taskId} 
            onSuccess={handleAssignmentSuccess} 
          />
        </div>
      )}
      
      {assignments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">
            Nenhuma atribuição
          </h2>
          <p className="text-gray-500 mb-4">
            Esta tarefa ainda não foi atribuída a nenhum funcionário.
          </p>
          <Button onClick={() => setShowAssignForm(true)}>
            Atribuir agora
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <div 
              className="bg-white rounded-lg shadow overflow-hidden"
              key={assignment.id}
            >
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    {assignment.employee?.displayName || 'Funcionário não encontrado'}
                  </h3>
                  <span 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClasses(assignment.status)}`}
                  >
                    {getStatusText(assignment.status)}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-500">Data Atribuição:</div>
                  <div>{dayjs(assignment.assignedDate).format('DD/MM/YYYY')}</div>
                  
                  <div className="text-gray-500">Data Vencimento:</div>
                  <div className="font-medium">{dayjs(assignment.dueDate).format('DD/MM/YYYY')}</div>
                </div>
                
                <Button
                  asChild
                  className="w-full mt-4 !text-amber-700 hover:!text-amber-700/95"
                  size="sm"
                  variant="outline"
                >
                  <Link to={`/admin/employees/${assignment.employeeId}`}>
                    Ver Detalhes
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 