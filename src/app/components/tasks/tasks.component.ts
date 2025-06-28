import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { User, UserRole } from '../../models/user.model';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  currentUser: User | null = null;
  myTasks: Task[] = [];
  assignedTasks: Task[] = [];
  projects: Project[] = [];
  tagOptions = ['Bug', 'Feature', 'High Priority', 'Improvement', 'Documentation', 'Testing'];
  availableTags: string[] = [];
  selectedTag = '';
  selectedProject = '';
  UserRole = UserRole;

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

  private loadProjectsAndTasks(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      const projectIds = this.projects.map(p => p.id);
      this.taskService.getTasks().subscribe(tasks => {
        this.tasks = tasks.filter(t => projectIds.includes(t.projectId));
        this.updateAvailableTags();
        this.applyRoleFilter();
      });
    });
  }

  private applyRoleFilter(): void {
    if (!this.currentUser) {
      this.filteredTasks = [];
      this.myTasks = [];
      this.assignedTasks = [];
      return;
    }

    switch (this.currentUser.role) {
      case UserRole.ADMIN:
        this.myTasks = this.tasks;
        this.assignedTasks = this.tasks;
        break;
      case UserRole.PROJECT_LEAD:
        this.assignedTasks = this.tasks.filter(t => t.reporterId === this.currentUser!.id);
        this.myTasks = this.tasks.filter(t => t.assigneeId === this.currentUser!.id);
        break;
      case UserRole.DEVELOPER:
        this.myTasks = this.tasks.filter(t => t.assigneeId === this.currentUser!.id);
        this.assignedTasks = [];
        break;
      default:
        this.myTasks = [];
        this.assignedTasks = [];
    }
    
    const baseAssigned = this.applyTagProjectFilter(this.assignedTasks);
    const baseMy = this.applyTagProjectFilter(this.myTasks);

    if (this.currentUser.role === UserRole.PROJECT_LEAD) {
      this.assignedTasks = baseAssigned;
      this.myTasks = baseMy;
      this.filteredTasks = this.assignedTasks;
    } else if (this.currentUser.role === UserRole.DEVELOPER) {
      this.myTasks = baseMy;
      this.filteredTasks = this.myTasks;
    } else {
      this.myTasks = baseMy;
      this.assignedTasks = baseAssigned;
      this.filteredTasks = this.applyTagProjectFilter(this.tasks);
    }
  }

  onTagChange(): void {
    this.applyRoleFilter();
  }

  onProjectChange(): void {
    this.applyRoleFilter();
  }

  private applyTagProjectFilter(tasks: Task[]): Task[] {
    return tasks.filter(t =>
      (!this.selectedProject || t.projectId === this.selectedProject) &&
      (!this.selectedTag || t.tags.includes(this.selectedTag))
    );
  }

  editTask(task: Task): void {
    this.router.navigate(['/tasks/edit', task.id]);
  }

  private updateAvailableTags(): void {
    this.availableTags = [...this.tagOptions];
  }
  getUserName(userId: string): string {
    const user = this.authService.getUserById(userId);
    return user ? user.name : userId;
  }

  canToggleComplete(task: Task): boolean {
    return !!this.currentUser && task.assigneeId === this.currentUser.id && !task.completedAt;
  }

  toggleComplete(task: Task): void {
    if (!this.canToggleComplete(task)) {
      return;
    }
    this.taskService.completeTask(task.id).subscribe(updated => {
      task.progress = updated.progress;
      task.completedAt = updated.completedAt;
    });
  }

  getProjectName(projectId: string): string {
    const proj = this.projects.find(p => p.id === projectId);
    return proj ? proj.name : projectId;
  }
}