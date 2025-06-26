// src/app/services/task.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Task, TaskPriority, Subtask, TaskComment, TimeEntry, TaskFile, TaskFilter, SavedView } from '../models/task.model';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { ProjectService } from './project.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();
  
  private activeTimeEntrySubject = new BehaviorSubject<TimeEntry | null>(null);
  public activeTimeEntry$ = this.activeTimeEntrySubject.asObservable();

  constructor(
    private storage: StorageService,
    private auth: AuthService,
    private project: ProjectService,
    private notification: NotificationService
  ) {
    this.loadTasks();
    this.setupRealtimeUpdates();
  }

  getTasks(projectId?: string): Observable<Task[]> {
    return new Observable(observer => {
      const allTasks = this.storage.get<Task[]>('tasks') || [];
      const filteredTasks = projectId 
        ? allTasks.filter(t => t.projectId === projectId)
        : allTasks;
      observer.next(filteredTasks);
      observer.complete();
    });
  }

  createTask(taskData: Partial<Task>): Observable<Task> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      const currentProject = this.project.getCurrentProject();
      
      if (!user || !currentProject) {
        observer.error('User or project not found');
        return;
      }

      const task: Task = {
        id: this.storage.generateId(),
        title: taskData.title || '',
        description: taskData.description || '',
        projectId: currentProject.id,
        columnId: taskData.columnId || 'todo',
        reporterId: user.id,
        assigneeId: taskData.assigneeId,
        priority: taskData.priority || TaskPriority.MEDIUM,
        tags: taskData.tags || [],
        dueDate: taskData.dueDate,
        estimatedHours: taskData.estimatedHours,
        actualHours: 0,
        progress: 0,
        subtasks: [],
        dependencies: taskData.dependencies || [],
        attachments: [],
        comments: [],
        timeEntries: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tasks = this.storage.get<Task[]>('tasks') || [];
      tasks.push(task);
      this.storage.set('tasks', tasks);
      this.tasksSubject.next(tasks);
      
      this.notification.addNotification(`New task "${task.title}" created`, 'success');
      observer.next(task);
      observer.complete();
    });
  }

  updateTask(taskId: string, updates: Partial<Task>): Observable<Task> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        observer.error('Task not found');
        return;
      }

      const oldTask = tasks[taskIndex];
      tasks[taskIndex] = { 
        ...oldTask, 
        ...updates, 
        updatedAt: new Date() 
      };
      
      // Check if task moved between columns
      if (updates.columnId && updates.columnId !== oldTask.columnId) {
        this.notification.addNotification(
          `Task "${oldTask.title}" moved to ${updates.columnId}`, 
          'info'
        );
      }
      
      this.storage.set('tasks', tasks);
      this.tasksSubject.next(tasks);
      observer.next(tasks[taskIndex]);
      observer.complete();
    });
  }

  completeTask(taskId: string): Observable<Task> {
    return this.updateTask(taskId, {
      progress: 100,
      completedAt: new Date()
    });
  }

  deleteTask(taskId: string): Observable<boolean> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const task = tasks.find(t => t.id === taskId);
      const filteredTasks = tasks.filter(t => t.id !== taskId);
      
      this.storage.set('tasks', filteredTasks);
      this.tasksSubject.next(filteredTasks);
      
      if (task) {
        this.notification.addNotification(`Task "${task.title}" deleted`, 'warning');
      }
      
      observer.next(true);
      observer.complete();
    });
  }

  // Subtask operations
  addSubtask(taskId: string, title: string): Observable<Subtask> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      if (!user) {
        observer.error('User not authenticated');
        return;
      }

      const subtask: Subtask = {
        id: this.storage.generateId(),
        title,
        completed: false,
        assigneeId: user.id,
        createdAt: new Date()
      };

      this.updateTask(taskId, {}).subscribe(task => {
        task.subtasks.push(subtask);
        this.updateTask(taskId, { 
          subtasks: task.subtasks,
          progress: this.calculateProgress(task.subtasks)
        }).subscribe(() => {
          observer.next(subtask);
          observer.complete();
        });
      });
    });
  }

  toggleSubtask(taskId: string, subtaskId: string): Observable<boolean> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        observer.error('Task not found');
        return;
      }

      const subtask = task.subtasks.find(s => s.id === subtaskId);
      if (!subtask) {
        observer.error('Subtask not found');
        return;
      }

      subtask.completed = !subtask.completed;
      subtask.completedAt = subtask.completed ? new Date() : undefined;

      this.updateTask(taskId, { 
        subtasks: task.subtasks,
        progress: this.calculateProgress(task.subtasks)
      }).subscribe(() => {
        observer.next(subtask.completed);
        observer.complete();
      });
    });
  }

  // Comment operations
  addComment(taskId: string, content: string, parentId?: string): Observable<TaskComment> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      if (!user) {
        observer.error('User not authenticated');
        return;
      }

      const comment: TaskComment = {
        id: this.storage.generateId(),
        content,
        authorId: user.id,
        createdAt: new Date(),
        parentId
      };

      const tasks = this.storage.get<Task[]>('tasks') || [];
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        observer.error('Task not found');
        return;
      }

      task.comments.push(comment);
      this.updateTask(taskId, { comments: task.comments }).subscribe(() => {
        this.notification.addNotification(`New comment added to "${task.title}"`, 'info');
        observer.next(comment);
        observer.complete();
      });
    });
  }

  // Time tracking
  startTimeTracking(taskId: string, description?: string): Observable<TimeEntry> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      if (!user) {
        observer.error('User not authenticated');
        return;
      }

      // Stop any active time entry first
      this.stopActiveTimeTracking().subscribe(() => {
        const timeEntry: TimeEntry = {
          id: this.storage.generateId(),
          userId: user.id,
          startTime: new Date(),
          duration: 0,
          description,
          isActive: true
        };

        const tasks = this.storage.get<Task[]>('tasks') || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
          observer.error('Task not found');
          return;
        }

        task.timeEntries.push(timeEntry);
        this.updateTask(taskId, { timeEntries: task.timeEntries }).subscribe(() => {
          this.activeTimeEntrySubject.next(timeEntry);
          observer.next(timeEntry);
          observer.complete();
        });
      });
    });
  }

  stopTimeTracking(taskId: string, timeEntryId: string): Observable<TimeEntry> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        observer.error('Task not found');
        return;
      }

      const timeEntry = task.timeEntries.find(te => te.id === timeEntryId);
      if (!timeEntry) {
        observer.error('Time entry not found');
        return;
      }

      timeEntry.endTime = new Date();
      timeEntry.duration = Math.floor((timeEntry.endTime.getTime() - timeEntry.startTime.getTime()) / 1000 / 60);
      timeEntry.isActive = false;

      const totalTime = task.timeEntries.reduce((sum, te) => sum + te.duration, 0);
      
      this.updateTask(taskId, { 
        timeEntries: task.timeEntries,
        actualHours: Math.floor(totalTime / 60)
      }).subscribe(() => {
        this.activeTimeEntrySubject.next(null);
        observer.next(timeEntry);
        observer.complete();
      });
    });
  }

  stopActiveTimeTracking(): Observable<boolean> {
    return new Observable(observer => {
      const activeEntry = this.activeTimeEntrySubject.value;
      if (!activeEntry) {
        observer.next(false);
        observer.complete();
        return;
      }

      // Find the task containing this time entry
      const tasks = this.storage.get<Task[]>('tasks') || [];
      const task = tasks.find(t => t.timeEntries.some(te => te.id === activeEntry.id));
      
      if (task) {
        this.stopTimeTracking(task.id, activeEntry.id).subscribe(() => {
          observer.next(true);
          observer.complete();
        });
      } else {
        observer.next(false);
        observer.complete();
      }
    });
  }

  // File operations
  addAttachment(taskId: string, file: File): Observable<TaskFile> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      if (!user) {
        observer.error('User not authenticated');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const attachment: TaskFile = {
          id: this.storage.generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string,
          uploadedBy: user.id,
          uploadedAt: new Date()
        };

        const tasks = this.storage.get<Task[]>('tasks') || [];
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
          observer.error('Task not found');
          return;
        }

        task.attachments.push(attachment);
        this.updateTask(taskId, { attachments: task.attachments }).subscribe(() => {
          observer.next(attachment);
          observer.complete();
        });
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Search and filter
  searchTasks(query: string, projectId?: string): Observable<Task[]> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      let filteredTasks = projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
      
      if (query.trim()) {
        const searchQuery = query.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(searchQuery) ||
          task.description.toLowerCase().includes(searchQuery) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
      }
      
      observer.next(filteredTasks);
      observer.complete();
    });
  }

  filterTasks(filter: TaskFilter, projectId?: string): Observable<Task[]> {
    return new Observable(observer => {
      const tasks = this.storage.get<Task[]>('tasks') || [];
      let filteredTasks = projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
      
      if (filter.assignee) {
        filteredTasks = filteredTasks.filter(t => t.assigneeId === filter.assignee);
      }
      
      if (filter.priority) {
        filteredTasks = filteredTasks.filter(t => t.priority === filter.priority);
      }
      
      if (filter.tags && filter.tags.length > 0) {
        filteredTasks = filteredTasks.filter(t => 
          filter.tags!.some(tag => t.tags.includes(tag))
        );
      }
      
      if (filter.dateRange) {
        filteredTasks = filteredTasks.filter(t => {
          if (!t.dueDate) return false;
          return t.dueDate >= filter.dateRange!.start && t.dueDate <= filter.dateRange!.end;
        });
      }
      
      if (filter.search) {
        const searchQuery = filter.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(searchQuery) ||
          task.description.toLowerCase().includes(searchQuery)
        );
      }
      
      observer.next(filteredTasks);
      observer.complete();
    });
  }

  // Saved views
  saveView(name: string, filter: TaskFilter, sortBy: string, sortOrder: 'asc' | 'desc'): Observable<SavedView> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      if (!user) {
        observer.error('User not authenticated');
        return;
      }

      const savedView: SavedView = {
        id: this.storage.generateId(),
        name,
        userId: user.id,
        filter,
        sortBy,
        sortOrder,
        createdAt: new Date()
      };

      const views = this.storage.get<SavedView[]>('savedViews') || [];
      views.push(savedView);
      this.storage.set('savedViews', views);
      
      observer.next(savedView);
      observer.complete();
    });
  }

  getSavedViews(): Observable<SavedView[]> {
    return new Observable(observer => {
      const user = this.auth.getCurrentUser();
      if (!user) {
        observer.next([]);
        observer.complete();
        return;
      }

      const views = this.storage.get<SavedView[]>('savedViews') || [];
      const userViews = views.filter(v => v.userId === user.id);
      observer.next(userViews);
      observer.complete();
    });
  }

  private calculateProgress(subtasks: Subtask[]): number {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  }

  private loadTasks(): void {
    const tasks = this.storage.get<Task[]>('tasks') || [];
    this.tasksSubject.next(tasks);
    
    // Load active time entry
    const activeEntry = tasks
      .flatMap(t => t.timeEntries)
      .find(te => te.isActive);
    
    if (activeEntry) {
      this.activeTimeEntrySubject.next(activeEntry);
    }
  }

  private setupRealtimeUpdates(): void {
    this.storage.storageChange$.subscribe(key => {
      if (key === 'tasks') {
        this.loadTasks();
      }
    });
  }
}