import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { TaskStatus, type ITask, type ITaskAssignment } from '@/types';

// Funções para observar coleções com atualizações em tempo real

/**
 * Observa as tarefas com atualizações em tempo real para admins
 */
export const observeTasks = (
  callback: (tasks: ITask[]) => void,
  errorCallback: (error: Error) => void
) => {
  try {
    const tasksQuery = query(
      collection(db, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map(doc => {
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
      
      callback(tasks);
    }, errorCallback);
  } catch (error) {
    errorCallback(error as Error);
    return () => {}; // Retorna uma função vazia como unsubscribe em caso de erro
  }
};

/**
 * Observa as atribuições de tarefas com atualizações em tempo real
 */
export const observeTaskAssignments = (
  taskId: string,
  callback: (assignments: ITaskAssignment[]) => void,
  errorCallback: (error: Error) => void
) => {
  try {
    const assignmentsQuery = query(
      collection(db, 'taskAssignments'),
      where('taskId', '==', taskId)
    );
    
    return onSnapshot(assignmentsQuery, (snapshot) => {
      const assignments = snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: doc.id,
          dueDate: data.dueDate instanceof Timestamp 
            ? data.dueDate.toDate() 
            : new Date(data.dueDate),
          assignedDate: data.assignedDate instanceof Timestamp
            ? data.assignedDate.toDate()
            : new Date(data.assignedDate),
        } as ITaskAssignment;
      });
      
      callback(assignments);
    }, errorCallback);
  } catch (error) {
    errorCallback(error as Error);
    return () => {}; // Retorna uma função vazia como unsubscribe em caso de erro
  }
};

/**
 * Observa as atribuições de tarefas para um funcionário
 */
export const observeEmployeeAssignments = (
  employeeId: string,
  callback: (assignments: ITaskAssignment[]) => void,
  errorCallback: (error: Error) => void
) => {
  try {
    const assignmentsQuery = query(
      collection(db, 'taskAssignments'),
      where('employeeId', '==', employeeId)
    );
    
    return onSnapshot(assignmentsQuery, (snapshot) => {
      const assignments = snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: doc.id,
          dueDate: data.dueDate instanceof Timestamp 
            ? data.dueDate.toDate() 
            : new Date(data.dueDate),
          assignedDate: data.assignedDate instanceof Timestamp
            ? data.assignedDate.toDate()
            : new Date(data.assignedDate),
        } as ITaskAssignment;
      });
      
      callback(assignments);
    }, errorCallback);
  } catch (error) {
    errorCallback(error as Error);
    return () => {}; // Retorna uma função vazia como unsubscribe em caso de erro
  }
};

/**
 * Observa as atribuições de tarefas para um funcionário em uma data específica
 */
export const observeDailyEmployeeAssignments = (
  employeeId: string,
  date: Date,
  callback: (assignments: ITaskAssignment[]) => void,
  errorCallback: (error: Error) => void
) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const assignmentsQuery = query(
      collection(db, 'taskAssignments'),
      where('employeeId', '==', employeeId),
      where('dueDate', '>=', startOfDay),
      where('dueDate', '<=', endOfDay)
    );
    
    return onSnapshot(assignmentsQuery, (snapshot) => {
      const assignments = snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          ...data,
          id: doc.id,
          dueDate: data.dueDate instanceof Timestamp 
            ? data.dueDate.toDate() 
            : new Date(data.dueDate),
          assignedDate: data.assignedDate instanceof Timestamp
            ? data.assignedDate.toDate()
            : new Date(data.assignedDate),
        } as ITaskAssignment;
      });
      
      callback(assignments);
    }, errorCallback);
  } catch (error) {
    errorCallback(error as Error);
    return () => {}; // Retorna uma função vazia como unsubscribe em caso de erro
  }
};

// Funções para operações CRUD
export const createTask = async (taskData: Partial<ITask>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    throw error;
  }
};

export const updateTaskFields = async (taskId: string, taskData: Partial<ITask>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'tasks', taskId), taskData);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    throw error;
  }
};

export const deleteTaskById = async (taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    throw error;
  }
};

export const createTaskAssignment = async (assignmentData: Omit<ITaskAssignment, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'taskAssignments'), {
      ...assignmentData,
      assignedDate: Timestamp.fromDate(assignmentData.assignedDate),
      dueDate: Timestamp.fromDate(assignmentData.dueDate),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar atribuição de tarefa:', error);
    throw error;
  }
}; 