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
  // Add missing properties
  startDate?: Date | string;
  endDate?: Date | string;
  ownerId?: string;
  kanbanColumns?: KanbanColumn[];
  // New properties for service compatibility
  workspaceId?: string;
  leadId?: string;
  teamMembers?: string[];
  columns?: KanbanColumn[];
  settings?: ProjectSettings;
}

export interface ProjectMember {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  color?: string;
  wipLimit?: number;
}

export interface ProjectSettings {
  allowComments: boolean;
  trackTime: boolean;
  enableNotifications: boolean;
  wipLimits: boolean;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
  token: string;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}