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

  constructor(
    private storage: StorageService,
    private router: Router
  ) {
    this.loadCurrentUser();
  }

  login(email: string, password: string): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        // Simulate API call
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