export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  workspaceId: string;
  createdAt: Date;
  lastActive: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  PROJECT_LEAD = 'project_lead',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

export interface UserActivity {
  userId: string;
  action: string;
  target: string;
  timestamp: Date;
  details?: any;
}