export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  columnId: string;
  assigneeId?: string;
  reporterId: string;
  priority: TaskPriority;
  tags: string[];
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress: number; // 0-100
  subtasks: Subtask[];
  dependencies: string[]; // task IDs
  attachments: TaskFile[];
  comments: TaskComment[];
  timeEntries: TimeEntry[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TaskFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // for replies
}

export interface TimeEntry {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  description?: string;
  isActive: boolean;
}

export interface TaskFilter {
  assignee?: string;
  priority?: TaskPriority;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface SavedView {
  id: string;
  name: string;
  userId: string;
  filter: TaskFilter;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  createdAt: Date;
}