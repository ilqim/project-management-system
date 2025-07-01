import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { User, UserRole } from '../../models/user.model';
import { Project } from '../../models/project.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  currentUser: User | null = null;
  statusOptions: string[] = [];
  selectedStatus = '';
  projects: Project[] = [];
  tagOptions = ['Bug', 'Feature', 'High Priority', 'Improvement', 'Documentation', 'Testing'];
  availableTags: string[] = [];
  selectedTag = '';
  selectedProject = '';
  UserRole = UserRole;

  private tasksSub?: Subscription;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProjectsAndTasks();
  }

  ngOnDestroy(): void {
    this.tasksSub?.unsubscribe();
  }


  private loadProjectsAndTasks(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      const projectIds = this.projects.map(p => p.id);
      this.tasksSub = this.taskService.tasks$.subscribe(tasks => {
        this.tasks = tasks.filter(t => projectIds.includes(t.projectId));
        this.updateAvailableTags();
        this.updateStatusOptions();
        this.applyRoleFilter();
      });
    });
  }

  private applyRoleFilter(): void {
    if (!this.currentUser) {
      this.filteredTasks = [];
      return;
    }

    let base = this.tasks;
    if (this.currentUser.role === UserRole.DEVELOPER) {
      base = base.filter(t => t.assigneeId === this.currentUser!.id);
    }
    this.filteredTasks = this.applyFilters(base);
  }

  onTagChange(): void {
    this.applyRoleFilter();
  }

  onProjectChange(): void {
    this.applyRoleFilter();
  }

  onStatusChange(): void {
    this.applyRoleFilter();
  }

  private applyFilters(tasks: Task[]): Task[] {
    return tasks.filter(t =>
      (!this.selectedProject || t.projectId === this.selectedProject) &&
      (!this.selectedTag || t.tags.includes(this.selectedTag)) &&
      (!this.selectedStatus || this.getColumnName(t.projectId, t.columnId) === this.selectedStatus)
    );
  }

  private updateStatusOptions(): void {
    const set = new Set<string>();
    for (const t of this.tasks) {
      set.add(this.getColumnName(t.projectId, t.columnId));
    }
    this.statusOptions = Array.from(set);
  }

  editTask(task: Task): void {
    this.router.navigate(['/tasks/edit', task.id], {
      queryParams: { returnUrl: '/tasks' }
    });
  }

  getColumnName(projectId: string, columnId: string): string {
    const proj = this.projects.find(p => p.id === projectId);
    const columns = proj?.kanbanColumns || proj?.columns || [];
    const column = columns.find(c => c.id === columnId);
    return column ? column.name : columnId;
  }

  private updateAvailableTags(): void {
    this.availableTags = [...this.tagOptions];
  }
  getUserName(userId: string): string {
    const user = this.authService.getUserById(userId);
    return user ? user.name : userId;
  }

  canToggleComplete(task: Task): boolean {
    if (!this.currentUser || task.completedAt || task.columnId === 'done') {
      return false;
    }

    if (this.currentUser.role === UserRole.ADMIN) {
      return true;
    }

    if (this.currentUser.role === UserRole.VIEWER) {
      return false;
    }

    return task.assigneeId === this.currentUser.id;
  }

  toggleComplete(task: Task): void {
    if (!this.canToggleComplete(task)) {
      return;
    }
    this.taskService.completeTask(task.id).subscribe(updated => {
      task.progress = updated.progress;
      task.completedAt = updated.completedAt;
      task.columnId = updated.columnId;
    });
  }

  getProjectName(projectId: string): string {
    const proj = this.projects.find(p => p.id === projectId);
    return proj ? proj.name : projectId;
  }
}