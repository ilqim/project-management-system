import { UserRole } from "./user.model";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  logo?: string;
  createdAt: Date;
  ownerId: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  allowInvites: boolean;
  defaultRole: UserRole;
  theme: 'light' | 'dark';
  timezone: string;
}