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
    // Demo workspace'leri oluştur
    const workspaces = [
      {
        id: 'workspace-1',
        name: 'Tech Company A',
        description: 'Main development workspace',
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'workspace-2',
        name: 'Startup B',
        description: 'Innovative solutions workspace',
        createdAt: new Date('2024-01-15')
      }
    ];

    // Demo projeleri oluştur
    const projects = [
      {
        id: 'project-1',
        name: 'E-Commerce Platform',
        description: 'Modern online shopping platform',
        workspaceId: 'workspace-1',
        status: 'active',
        createdAt: new Date('2024-02-01')
      },
      {
        id: 'project-2',
        name: 'Mobile App',
        description: 'Cross-platform mobile application',
        workspaceId: 'workspace-1',
        status: 'active',
        createdAt: new Date('2024-02-15')
      },
      {
        id: 'project-3',
        name: 'Data Analytics Tool',
        description: 'Business intelligence dashboard',
        workspaceId: 'workspace-2',
        status: 'planning',
        createdAt: new Date('2024-03-01')
      }
    ];

    // İlk kez çalıştırıldığında demo verileri kaydet
    if (!this.storage.get('workspaces')) {
      this.storage.set('workspaces', workspaces);
    }
    if (!this.storage.get('projects')) {
      this.storage.set('projects', projects);
    }
    if (!this.storage.get('demoUsers')) {
      this.storage.set('demoUsers', this.demoUsers);
    }
  }

  private loadCurrentUser(): void {
    const user = this.storage.get<User>('currentUser');
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  private createDefaultUser(email: string): User {
    return {
      id: this.storage.generateId(),
      email,
      name: email.split('@')[0],
      role: email === 'admin@test.com' ? UserRole.ADMIN : UserRole.DEVELOPER,
      workspaceId: 'default',
      createdAt: new Date(),
      lastActive: new Date()
    };
  }
}