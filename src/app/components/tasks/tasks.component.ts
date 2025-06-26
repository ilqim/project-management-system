import { Component, OnInit } from '@angular/core';
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
  projects: Project[] = [];
  UserRole = UserRole;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProjectsAndTasks();
  }

  private loadProjectsAndTasks(): void {
    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      this.taskService.getTasks().subscribe(tasks => {
        this.tasks = tasks;
        this.applyRoleFilter();
      });
    });
  }

  private applyRoleFilter(): void {
    if (!this.currentUser) {
      this.filteredTasks = [];
      return;
    }

    switch (this.currentUser.role) {
      case UserRole.ADMIN:
        this.filteredTasks = this.tasks;
        break;
      case UserRole.PROJECT_LEAD:
        const leadProjects = this.projects
          .filter(p => p.leadId === this.currentUser!.id)
          .map(p => p.id);
        this.filteredTasks = this.tasks.filter(t => leadProjects.includes(t.projectId));
        break;
      case UserRole.DEVELOPER:
        this.filteredTasks = this.tasks.filter(t => t.assigneeId === this.currentUser!.id);
        break;
      default:
        this.filteredTasks = [];
    }
  }

  getProjectName(projectId: string): string {
    const proj = this.projects.find(p => p.id === projectId);
    return proj ? proj.name : projectId;
  }
}