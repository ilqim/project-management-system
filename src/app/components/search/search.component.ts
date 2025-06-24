import { Component } from '@angular/core';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {
  query = '';
  results: Task[] = [];
  isOpen = false;

  constructor(private taskService: TaskService) {}

  search(): void {
    if (!this.query.trim()) {
      this.results = [];
      return;
    }
    this.taskService.searchTasks(this.query).subscribe(tasks => {
      this.results = tasks.slice(0, 10);
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.results = [];
      this.query = '';
    }
  }
}