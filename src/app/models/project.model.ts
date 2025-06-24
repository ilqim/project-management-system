import { UserRole } from "./user.model";

export interface Project {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  leadId: string;
  teamMembers: string[]; // user IDs
  startDate: Date;
  endDate?: Date;
  status: ProjectStatus;
  columns: KanbanColumn[];
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface ProjectSettings {
  allowComments: boolean;
  trackTime: boolean;
  enableNotifications: boolean;
  wipLimits: boolean;
}

export interface KanbanColumn {
  id: string;
  name: string;
  order: number;
  wipLimit?: number;
  color?: string;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
  token: string;
}
