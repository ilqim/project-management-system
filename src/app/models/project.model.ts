export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'paused';
  progress?: number;
  taskCount?: number;
  memberCount?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  dueDate?: Date | string;
  members?: ProjectMember[];
  color?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface ProjectMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}