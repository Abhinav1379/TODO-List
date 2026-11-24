export type Priority = 'low' | 'medium' | 'high';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type FilterStatus = 'all' | 'active' | 'today' | 'overdue' | 'completed' | 'archive';

export type SortOption = 'createdAt' | 'dueDate' | 'priority' | 'custom';

export type ThemeMode = 'light' | 'dark';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  completed: boolean;
  createdAt: number;
  tags: string[];
  subtasks: Subtask[];
  recurrence: Recurrence;
  order: number;
}

export interface TaskDraft {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  tags?: string[];
  subtasks?: Subtask[];
  recurrence?: Recurrence;
}

export interface UndoSnapshot {
  id: string;
  message: string;
  tasks: Task[];
  archivedTasks: Task[];
}
