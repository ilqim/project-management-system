import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

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
  users: User[] = [];
  filteredUsers: User[] = [];

  constructor(
    private taskService: TaskService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.users = this.authService.getAllUsers();
    this.filteredUsers = this.users.slice();
  }

  filterUsers(): void {
    const query = this.assigneeSearch.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }

  createTask(): void {
    if (!this.title.trim()) {
      return;
    }
    const taskData: any = { title: this.title, description: this.description };
    if (this.assigneeId) {
      taskData.assigneeId = this.assigneeId;
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