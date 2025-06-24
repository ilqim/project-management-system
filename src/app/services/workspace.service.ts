import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Workspace, WorkspaceSettings } from '../models/workspace.model';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private currentWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);
  public currentWorkspace$ = this.currentWorkspaceSubject.asObservable();

  constructor(
    private storage: StorageService,
    private auth: AuthService
  ) {
    this.loadCurrentWorkspace();
  }

  getWorkspaces(): Observable<Workspace[]> {
    return new Observable(observer => {
      const workspaces = this.storage.get<Workspace[]>('workspaces') || this.createDefaultWorkspaces();
      observer.next(workspaces);
      observer.complete();
    });
  }

  createWorkspace(name: string, description: string): Observable<Workspace> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      if (!user) {
        observer.error('User not authenticated');
        return;
      }

      const workspace: Workspace = {
        id: this.storage.generateId(),
        name,
        description,
        createdAt: new Date(),
        ownerId: user.id,
        settings: {
          allowInvites: true,
          defaultRole: user.role,
          theme: 'light',
          timezone: 'UTC'
        }
      };

      const workspaces = this.storage.get<Workspace[]>('workspaces') || [];
      workspaces.push(workspace);
      this.storage.set('workspaces', workspaces);
      
      observer.next(workspace);
      observer.complete();
    });
  }

  setCurrentWorkspace(workspaceId: string): void {
    this.getWorkspaces().subscribe(workspaces => {
      const workspace = workspaces.find(w => w.id === workspaceId);
      if (workspace) {
        this.storage.set('currentWorkspaceId', workspaceId);
        this.currentWorkspaceSubject.next(workspace);
      }
    });
  }

  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspaceSubject.value;
  }

  private loadCurrentWorkspace(): void {
    const workspaceId = this.storage.get<string>('currentWorkspaceId');
    if (workspaceId) {
      this.setCurrentWorkspace(workspaceId);
    }
  }

  private createDefaultWorkspaces(): Workspace[] {
    const defaultWorkspaces: Workspace[] = [
      {
        id: 'default',
        name: 'My Workspace',
        description: 'Default workspace',
        createdAt: new Date(),
        ownerId: 'default-user',
        settings: {
          allowInvites: true,
          defaultRole: UserRole.DEVELOPER,
          theme: 'light',
          timezone: 'UTC'
        }
      }
    ];
    
    this.storage.set('workspaces', defaultWorkspaces);
    return defaultWorkspaces;
  }
}
