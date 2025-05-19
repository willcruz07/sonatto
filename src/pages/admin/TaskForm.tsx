import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  addDoc, 
  collection, 
  doc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft } from 'lucide-react';
import type { ITask } from '@/types';

export const TaskForm = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Se taskId estiver presente, buscar dados da tarefa para edição
  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) return;
      
      try {
        setLoading(true);
        
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        if (!taskDoc.exists()) {
          setError('Tarefa não encontrada');
          return;
        }
        
        const taskData = taskDoc.data() as ITask;
        setTitle(taskData.title);
        setDescription(taskData.description);
        setEstimatedTime(taskData.estimatedTime?.toString() || '');
        setIsEditMode(true);
      } catch (error) {
        console.error('Erro ao buscar tarefa:', error);
        setError('Erro ao carregar dados da tarefa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTask();
  }, [taskId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      setError('O título é obrigatório');
      return;
    }
    
    if (!description) {
      setError('A descrição é obrigatória');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const taskData: Partial<ITask> = {
        title,
        description,
        assignedBy: currentUser?.id || '',
        createdAt: new Date(),
      };
      
      if (estimatedTime) {
        taskData.estimatedTime = parseInt(estimatedTime, 10);
      }
      
      if (isEditMode && taskId) {
        // Atualizar tarefa existente
        await updateDoc(doc(db, 'tasks', taskId), taskData);
      } else {
        // Criar nova tarefa
        await addDoc(collection(db, 'tasks'), {
          ...taskData,
          createdAt: serverTimestamp(),
        });
      }
      
      navigate('/admin/tasks');
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      setError('Erro ao salvar tarefa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          className="mr-4  !text-amber-700"
          onClick={() => navigate('/admin/tasks')}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">
          {isEditMode ? 'Editar Tarefa' : 'Nova Tarefa'}
        </h1>
      </div>
      
      {error && (
        <div className="p-3 text-sm text-white bg-red-500 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label 
              className="block mb-1 text-sm font-medium"
              htmlFor="title"
            >
              Título
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              disabled={loading}
              id="title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa"
              required
              type="text"
              value={title}
            />
          </div>
          
          {/* Descrição */}
          <div>
            <label 
              className="block mb-1 text-sm font-medium"
              htmlFor="description"
            >
              Descrição
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              disabled={loading}
              id="description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a tarefa em detalhes"
              required
              rows={5}
              value={description}
            />
          </div>
          
          {/* Tempo Estimado */}
          <div>
            <label 
              className="block mb-1 text-sm font-medium"
              htmlFor="estimatedTime"
            >
              Tempo Estimado (minutos)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              disabled={loading}
              id="estimatedTime"
              min="1"
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="Tempo estimado em minutos"
              type="number"
              value={estimatedTime}
            />
          </div>
          
          <div className="pt-4">
            <Button
              className="w-full md:w-auto !bg-amber-700 !text-white hover:!bg-amber-700/95"
              disabled={loading}
              type="submit"
            >
              {loading 
                ? 'Salvando...' 
                : isEditMode 
                  ? 'Atualizar Tarefa' 
                  : 'Criar Tarefa'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 