import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { Task } from '../../models/task.model';
import { KanbanColumn } from '../../models/project.model';

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent implements OnInit {
  columns: KanbanColumn[] = [];
  tasks: Task[] = [];

  constructor(private projectService: ProjectService, private taskService: TaskService) {}

  ngOnInit(): void {
    const project = this.projectService.getCurrentProject();
    if (project) {
      this.columns = project.columns;
    }
    this.taskService.tasks$.subscribe(ts => {
      if (project) {
        this.tasks = ts.filter(t => t.projectId === project.id);
      } else {
        this.tasks = ts;
      }
    });
  }

  tasksInColumn(columnId: string): Task[] {
    return this.tasks.filter(t => t.columnId === columnId);
  }
}