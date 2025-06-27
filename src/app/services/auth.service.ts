import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Demo hesaplar
  private demoUsers: User[] = [
    {
      id: 'admin-1',
      email: 'admin@demo.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      workspaceId: 'workspace-1',
      createdAt: new Date('2024-01-01'),
      lastActive: new Date()
    },
    {
      id: 'lead-1',
      email: 'lead@demo.com',
      name: 'Project Lead',
      role: UserRole.PROJECT_LEAD,
      workspaceId: 'workspace-1',
      createdAt: new Date('2024-01-15'),
      lastActive: new Date()
    },
    {
      id: 'dev-1',
      email: 'developer@demo.com',
      name: 'John Developer',
      role: UserRole.DEVELOPER,
      workspaceId: 'workspace-1',
      createdAt: new Date('2024-02-01'),
      lastActive: new Date()
    },
    {
      id: 'dev-2',
      email: 'jane@demo.com',
      name: 'Jane Smith',
      role: UserRole.DEVELOPER,
      workspaceId: 'workspace-2',
      createdAt: new Date('2024-02-10'),
      lastActive: new Date()
    },
    {
      id: 'viewer-1',
      email: 'viewer@demo.com',
      name: 'Viewer User',
      role: UserRole.VIEWER,
      workspaceId: 'workspace-1',
      createdAt: new Date('2024-03-01'),
      lastActive: new Date()
    }
  ];

  constructor(
    private storage: StorageService,
    private router: Router
  ) {
    this.initializeDemoData();
    this.loadCurrentUser();
  }

  login(email: string, password: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        // Demo hesapları kontrol et (şifre: demo123)
        const demoUser = this.demoUsers.find(u => u.email === email);
        if (demoUser && password === 'demo123') {
          this.storage.set('currentUser', demoUser);
          this.currentUserSubject.next(demoUser);
          observer.next(true);
          observer.complete();
          return;
        }

        // Kayıtlı kullanıcıları kontrol et
        const users = this.storage.get<User[]>('users') || [];
        const user = users.find(u => u.email === email);
        
        if (user || email === 'admin@test.com') {
          const currentUser = user || this.createDefaultUser(email);
          this.storage.set('currentUser', currentUser);
          this.currentUserSubject.next(currentUser);
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 1000);
    });
  }

  register(email: string, name: string, workspaceId: string, role: UserRole = UserRole.DEVELOPER): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const users = this.storage.get<User[]>('users') || [];
        const newUser: User = {
          id: this.storage.generateId(),
          email,
          name,
          role,
          workspaceId,
          createdAt: new Date(),
          lastActive: new Date()
        };
        
        users.push(newUser);
        this.storage.set('users', users);
        observer.next(newUser);
        observer.complete();
      }, 500);
    });
  }

  logout(): void {
    this.storage.remove('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserById(id: string): User | undefined {
    const demo = this.demoUsers.find(u => u.id === id);
    if (demo) {
      return demo;
    }
    const users = this.storage.get<User[]>('users') || [];
    return users.find(u => u.id === id);
  }


  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const permissions = {
      [UserRole.ADMIN]: ['all'],
      [UserRole.PROJECT_LEAD]: ['create_project', 'manage_team', 'edit_tasks'],
      [UserRole.DEVELOPER]: ['edit_tasks', 'add_comments'],
      [UserRole.VIEWER]: ['view_only']
    };

    return permissions[user.role].includes(permission) || permissions[user.role].includes('all');
  }

  // Demo hesap listesini al
  getDemoAccounts(): {email: string, password: string, role: string}[] {
    return [
      { email: 'admin@demo.com', password: 'demo123', role: 'Admin' },
      { email: 'lead@demo.com', password: 'demo123', role: 'Project Lead' },
      { email: 'developer@demo.com', password: 'demo123', role: 'Developer' },
      { email: 'jane@demo.com', password: 'demo123', role: 'Developer' },
      { email: 'viewer@demo.com', password: 'demo123', role: 'Viewer' }
    ];
  }

  private initializeDemoData(): void {
    // Demo kullanıcılarını sakla
    if (!this.storage.get('demoUsers')) {
      this.storage.set('demoUsers', this.demoUsers);
    }

    // Varsayılan çalışma alanı oluşturulmadıysa ekle
    if (!this.storage.get('workspaces')) {
      const defaultWorkspaces = [
        {
          id: 'workspace-1',
          name: 'Default Workspace',
          description: 'Initial workspace',
          createdAt: new Date()
        }
      ];
      this.storage.set('workspaces', defaultWorkspaces);
    }
    if (!this.storage.get('projects')) {
      this.storage.set('projects', []);
    }
    if (!this.storage.get('demoUsers')) {
      this.storage.set('demoUsers', this.demoUsers);
    }
    if (!this.storage.get('tasks')) {
      this.storage.set('tasks', []);
    }
  }

  private loadCurrentUser(): void {
    const user = this.storage.get<User>('currentUser');
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  getAllUsers(): User[] {
    const users = this.storage.get<User[]>('users') || [];
    return [...this.demoUsers, ...users];
  }


  private createDefaultUser(email: string): User {
    const newUser: User = {
      id: this.storage.generateId(),
      email,
      name: email.split('@')[0],
      role: email === 'admin@test.com' ? UserRole.ADMIN : UserRole.DEVELOPER,
      workspaceId: 'default',
      createdAt: new Date(),
      lastActive: new Date()
    };
    const users = this.storage.get<User[]>('users') || [];
    users.push(newUser);
    this.storage.set('users', users);

    return newUser;
  }
}