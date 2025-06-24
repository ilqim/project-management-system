import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent {
  title = '';
  description = '';

  constructor(private taskService: TaskService, private router: Router) {}

  createTask(): void {
    if (!this.title.trim()) {
      return;
    }
    this.taskService.createTask({ title: this.title, description: this.description })
      .subscribe(() => {
        this.router.navigate(['/dashboard']);
      });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}