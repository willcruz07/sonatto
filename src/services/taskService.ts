import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ITask } from '@/types';
import { TaskStatus } from '@/types';

// Tipos para filtros e operações
export type TaskFilter = 'all' | 'today' | 'upcoming' | 'completed';

// Converter Firestore Timestamp para Date
const convertTimestamps = (data: any): any => {
  const result = { ...data };
  
  // Lista de campos que podem conter timestamps
  const timestampFields = ['dueDate', 'createdAt', 'startedAt', 'completedAt'];
  
  for (const field of timestampFields) {
    if (data[field] instanceof Timestamp) {
      result[field] = data[field].toDate();
    } else if (data[field]) {
      result[field] = new Date(data[field]);
    }
  }
  
  return result;
};

// Buscar todas as tarefas ou filtradas
export const fetchTasks = async (filter: TaskFilter = 'all'): Promise<ITask[]> => {
  const tasksCollection = collection(db, 'tasks');
  let tasksQuery;
  
  // Aplicar filtros
  if (filter === 'completed') {
    tasksQuery = query(tasksCollection, where('status', '==', TaskStatus.COMPLETED));
  } else if (filter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    tasksQuery = query(
      tasksCollection,
      where('dueDate', '>=', today),
      where('dueDate', '<', tomorrow)
    );
  } else if (filter === 'upcoming') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    tasksQuery = query(
      tasksCollection,
      where('dueDate', '>=', today),
      where('status', '!=', TaskStatus.COMPLETED)
    );
  } else {
    // Default: all tasks
    tasksQuery = query(tasksCollection, orderBy('dueDate'));
  }
  
  const querySnapshot = await getDocs(tasksQuery);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...convertTimestamps(data),
      id: doc.id,
    } as ITask;
  });
};

// Buscar tarefas do usuário atual
export const fetchUserTasks = async (userId: string): Promise<ITask[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const tasksQuery = query(
    collection(db, 'tasks'),
    where('assignedTo', '==', userId),
    where('dueDate', '>=', today),
    where('dueDate', '<', tomorrow)
  );
  
  const querySnapshot = await getDocs(tasksQuery);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...convertTimestamps(data),
      id: doc.id,
    } as ITask;
  });
};

// Buscar uma tarefa específica
export const fetchTaskById = async (taskId: string): Promise<ITask | null> => {
  const taskDoc = await getDoc(doc(db, 'tasks', taskId));
  
  if (!taskDoc.exists()) {
    return null;
  }
  
  const data = taskDoc.data();
  return {
    ...convertTimestamps(data),
    id: taskDoc.id,
  } as ITask;
};

// Criar uma nova tarefa
export const createTask = async (taskData: Omit<ITask, 'id' | 'createdAt'> & { dueDate: Date }): Promise<ITask> => {
  const taskRef = await addDoc(collection(db, 'tasks'), {
    ...taskData,
    createdAt: serverTimestamp(),
    dueDate: Timestamp.fromDate(taskData.dueDate),
  });
  
  const newTask = await getDoc(taskRef);
  const data = newTask.data();
  
  return {
    ...convertTimestamps(data),
    id: taskRef.id,
  } as ITask;
};

// Atualizar uma tarefa existente
export const updateTask = async (taskId: string, taskData: Partial<ITask> & { dueDate?: Date }): Promise<void> => {
  const updateData = { ...taskData };
  
  // Converter datas para Timestamp
  if (updateData.dueDate) {
    updateData.dueDate = Timestamp.fromDate(updateData.dueDate) as any;
  }
  
  await updateDoc(doc(db, 'tasks', taskId), updateData);
};

// Iniciar uma tarefa (mudar status para IN_PROGRESS)
export const startTask = async (taskId: string): Promise<void> => {
  await updateDoc(doc(db, 'tasks', taskId), {
    status: TaskStatus.IN_PROGRESS,
    startedAt: serverTimestamp(),
  });
};

// Concluir uma tarefa (mudar status para COMPLETED)
export const completeTask = async (taskId: string): Promise<void> => {
  await updateDoc(doc(db, 'tasks', taskId), {
    status: TaskStatus.COMPLETED,
    completedAt: serverTimestamp(),
  });
};

// Excluir uma tarefa
export const deleteTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, 'tasks', taskId));
}; 