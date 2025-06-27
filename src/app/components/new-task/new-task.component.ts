import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent implements OnInit {
  title = '';
  description = '';
  assigneeSearch = '';
  assigneeId: string | null = null;
  dueDate: string | null = null;
  users: User[] = [];
  filteredUsers: User[] = [];
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
    const project = this.projectService.getCurrentProject();
    const memberIds = project?.teamMembers || [];
    this.users = memberIds
      .map(id => this.authService.getUserById(id))
      .filter((u): u is User => !!u)
      .filter(u => this.canAssignTo(u));
    this.filteredUsers = this.users.slice();
    const preselect = this.route.snapshot.queryParamMap.get('assigneeId');
    if (preselect && memberIds.includes(preselect)) {
      this.assigneeId = preselect;
    }
  }

  filterUsers(): void {
    const query = this.assigneeSearch.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }
  private roleRank(role: UserRole): number {
    return this.roleHierarchy.indexOf(role);
  }

  private canAssignTo(user: User): boolean {
    if (!this.currentUser) return false;
    if (user.role === UserRole.VIEWER) {
      return false;
    }
    return this.roleRank(user.role) <= this.roleRank(this.currentUser.role);
  }


  createTask(): void {
    if (!this.title.trim()) {
      return;
    }
    const taskData: any = { title: this.title, description: this.description };
    if (this.assigneeId) {
      taskData.assigneeId = this.assigneeId;
    }
    if (this.dueDate) {
      taskData.dueDate = new Date(this.dueDate);
    }
    this.taskService.createTask(taskData)
      .subscribe(() => {
        this.router.navigate(['/dashboard']);
      });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}