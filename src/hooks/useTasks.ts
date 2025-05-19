import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import {
  fetchTasks,
  fetchUserTasks,
  fetchTaskById,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  completeTask,
  type TaskFilter
} from '@/services/taskService';
import type { ITask } from '@/types';
import { useAuthStore } from '@/store/authStore';

// Hook para buscar tarefas (para admin)
export const useTasksQuery = (filter: TaskFilter = 'all') => {
  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => fetchTasks(filter),
  });
};

// Hook para buscar tarefas do usuário atual
export const useUserTasksQuery = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: ['userTasks', currentUser?.id],
    queryFn: () => currentUser ? fetchUserTasks(currentUser.id) : Promise.resolve([]),
    enabled: !!currentUser,
  });
};

// Hook para buscar uma tarefa específica
export const useTaskQuery = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskId ? fetchTaskById(taskId) : Promise.resolve(null),
    enabled: !!taskId,
  });
};

// Hook para criar uma tarefa
export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newTask: Omit<ITask, 'id' | 'createdAt'>) => createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Hook para atualizar uma tarefa
export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, taskData }: { taskId: string, taskData: Partial<ITask> }) => 
      updateTask(taskId, taskData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['userTasks'] });
    },
  });
};

// Hook para excluir uma tarefa
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['userTasks'] });
    },
  });
};

// Hook para iniciar uma tarefa
export const useStartTaskMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => startTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['userTasks'] });
    },
  });
};

// Hook para concluir uma tarefa
export const useCompleteTaskMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['userTasks'] });
    },
  });
}; 