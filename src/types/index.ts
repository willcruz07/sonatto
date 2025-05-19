// Tipos de usuário
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  photoURL?: string;
  createdAt: Date;
}

// Tipo para funcionário (usuário comum)
export interface IEmployee extends IUser {
  position?: string;
  department?: string;
  phone?: string;
}

// Status de uma tarefa
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// Tipo base para tarefa (template)
export interface ITask {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  assignedBy: string; // ID do admin que criou a tarefa
  estimatedTime?: number; // Tempo estimado em minutos
}

// Tipo para atribuição de tarefa a um funcionário
export interface ITaskAssignment {
  id: string;
  taskId: string; // Referência à tarefa
  employeeId: string; // ID do funcionário
  assignedDate: Date; // Data em que foi atribuída
  dueDate: Date; // Data prevista para conclusão
  status: TaskStatus;
  assignedBy: string; // ID do admin que atribuiu
}

// Tipo para execução diária de uma tarefa
export interface ITaskExecution {
  id: string;
  assignmentId: string; // Referência à atribuição
  executionDate: Date; // Data de execução
  startTime: Date; // Hora de início
  endTime?: Date; // Hora de término (se concluída)
  duration?: number; // Duração em minutos
  notes?: string; // Anotações sobre a execução
  status: TaskStatus;
} 