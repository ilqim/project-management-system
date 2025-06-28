import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { User, UserRole } from '../../models/user.model';
import { Project } from '../../models/project.model'; // varsa project tipi için

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent implements OnInit {
  title = '';
  description = '';
  tagOptions = ['Bug', 'Feature', 'High Priority', 'Improvement', 'Documentation', 'Testing'];
  selectedTags: string[] = [];
  assigneeId: string | null = null;
  dueDate: string | null = null;
  isEditMode = false;
  taskId: string | null = null;

  users: User[] = [];
  currentUser: User | null = null;

  private roleHierarchy = [
    UserRole.VIEWER,
    UserRole.DEVELOPER,
    UserRole.PROJECT_LEAD,
    UserRole.ADMIN
  ];

  constructor(
    private taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.taskId = this.route.snapshot.paramMap.get('id');
    if (this.taskId) {
      this.isEditMode = true;
      this.taskService.getTask(this.taskId).subscribe(task => {
        if (!task) {
          alert('Görev bulunamadı');
          this.router.navigate(['/tasks']);
          return;
        }
        this.title = task.title;
        this.description = task.description;
        this.selectedTags = [...task.tags];
        this.assigneeId = task.assigneeId || null;
        this.dueDate = task.dueDate ? new Date(task.dueDate).toISOString().substring(0,10) : null;

        this.projectService.getProject(task.projectId).subscribe(p => {
          if (p) {
            this.projectService.setCurrentProject(p.id);
            this.initializeUsers(p);
          }
        });
      });
    
    } else {
      const routeProjectId = this.route.snapshot.queryParamMap.get('projectId');
      const currentProject = this.projectService.getCurrentProject();

      if (!currentProject && routeProjectId) {
        this.projectService.getProject(routeProjectId).subscribe(p => {
          if (p) {
            this.projectService.setCurrentProject(p.id);
            this.initializeUsers(p);
          } else {
            alert('Proje bulunamadı');
            this.router.navigate(['/projects']);
          }
        });
      } else if (currentProject) {
        this.initializeUsers(currentProject);
      } else {
        alert('Önce bir proje seçmelisiniz');
        this.router.navigate(['/projects']);
      }
    }
  }

  private initializeUsers(project: Project): void {
    const memberIds = project.teamMembers || [];
    this.users = memberIds
      .map((id: string) => this.authService.getUserById(id))
      .filter((u: User | undefined): u is User => !!u)
      .filter(user => this.canAssignTo(user));

    const preselectedAssignee = this.route.snapshot.queryParamMap.get('assigneeId');
    if (preselectedAssignee && memberIds.includes(preselectedAssignee)) {
      this.assigneeId = preselectedAssignee;
    }
  }

  private roleRank(role: UserRole): number {
    return this.roleHierarchy.indexOf(role);
  }

  private canAssignTo(user: User): boolean {
    if (!this.currentUser) return false;
    if (user.role === UserRole.VIEWER) return false;
    return this.roleRank(user.role) <= this.roleRank(this.currentUser.role);
  }

  saveTask(): void {
    if (!this.title.trim()) return;

    const taskData: any = {
      title: this.title,
      description: this.description,
      tags: this.selectedTags
    };

    if (this.assigneeId) {
      taskData.assigneeId = this.assigneeId;
    }

    if (this.dueDate) {
      taskData.dueDate = new Date(this.dueDate);
    }
    const currentProject = this.projectService.getCurrentProject();

    const request$ = this.isEditMode && this.taskId
      ? this.taskService.updateTask(this.taskId, taskData)
      : this.taskService.createTask(taskData);

    request$.subscribe({
      next: () => {
        if (currentProject) {
          this.router.navigate(['/projects', currentProject.id]);
        } else {
          this.router.navigate(['/projects']);
        }
      },
      error: (err) => alert('Görev kaydedilemedi: ' + err)
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
