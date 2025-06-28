// src/app/components/kanban-board/kanban-board.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { Project, KanbanColumn } from '../../models/project.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

const BOARD_COLUMNS: KanbanColumn[] = [
  { id: 'todo', name: 'Todo', order: 0 },
  { id: 'in-progress', name: 'In Progress', order: 1 },
  { id: 'done', name: 'Done', order: 2 }
];

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  project: Project | null = null;
  tasks: Task[] = [];
  columns: KanbanColumn[] = [];
  currentUser: User | null = null;
  loading = false;
  error: string | null = null;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private projectService: ProjectService, 
    private taskService: TaskService,
    private route: ActivatedRoute,
    private auth: AuthService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.loadProject();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProject(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      this.error = 'Project ID not found';
      return;
    }

    this.loading = true;
    
    // Get current project from service
    const currentProject = this.projectService.getCurrentProject();
    if (currentProject && currentProject.id === projectId) {
      this.project = currentProject;
      this.columns = BOARD_COLUMNS;
      this.loadTasks(projectId);
    } else {
      // If not current project, load it
      this.projectService.getProjects().subscribe({
        next: (projects: Project[]) => {
          const project = projects.find(p => p.id === projectId);
          if (project) {
            this.project = project;
            this.columns = BOARD_COLUMNS;
            this.projectService.setCurrentProject(project.id);
            this.loadTasks(projectId);
          } else {
            this.error = 'Project not found';
            this.loading = false;
          }
        },
        error: (error: any) => {
          console.error('Error loading project:', error);
          this.error = 'Failed to load project';
          this.loading = false;
        }
      });
    }
  }

  loadTasks(projectId: string): void {
    const tasksSub = this.taskService.getTasks(projectId).subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
        this.error = 'Failed to load tasks';
        this.loading = false;
      }
    });
    
    this.subscriptions.push(tasksSub);
  }

  getTasksForColumn(columnId: string): Task[] {
    return this.tasks.filter(task => task.columnId === columnId);
  }

  onTaskDrop(event: any, columnId: string): void {
    const taskId = event.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = this.tasks.find(t => t.id === taskId);
    if (!task || task.columnId === columnId) return;

    if (task.assigneeId !== this.currentUser?.id) {
      this.notification.addNotification('Only the assignee can move this task', 'warning');
      return;
    }

    // Check WIP limit
    const column = this.columns.find(c => c.id === columnId);
    if (column?.wipLimit) {
      const currentCount = this.getTasksForColumn(columnId).length;
      if (currentCount >= column.wipLimit) {
        this.notification.addNotification(
          `Cannot move task: ${column.name} is at WIP limit (${column.wipLimit})`,
          'warning'
        );
        return;
      }
    }

    // Update task column
    this.taskService.updateTask(taskId, { columnId }).subscribe({
      next: (updatedTask: Task) => {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          this.tasks[taskIndex] = updatedTask;
        }
        this.notification.addNotification(
          `Task moved to ${column?.name || columnId}`,
          'success'
        );
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
        this.notification.addNotification('Failed to move task', 'error');
      }
    });
  }

  onDragOver(event: Event): void {
    event.preventDefault();
  }

  onTaskDragStart(event: DragEvent, task: Task): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.id);
    }
  }

  createTask(columnId: string): void {
    const title = prompt('Enter task title:');
    if (!title?.trim()) return;

    this.taskService.createTask({
      title: title.trim(),
      columnId
    }).subscribe({
      next: (newTask: Task) => {
        this.tasks.push(newTask);
        this.notification.addNotification('Task created successfully', 'success');
      },
      error: (error: any) => {
        console.error('Error creating task:', error);
        this.notification.addNotification('Failed to create task', 'error');
      }
    });
  }

  editTask(task: Task): void {
    // Implement task editing
    console.log('Edit task:', task);
  }

  deleteTask(task: Task): void {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.notification.addNotification('Task deleted successfully', 'success');
      },
      error: (error: any) => {
        console.error('Error deleting task:', error);
        this.notification.addNotification('Failed to delete task', 'error');
      }
    });
  }

  getColumnProgress(columnId: string): number {
    const tasks = this.getTasksForColumn(columnId);
    if (tasks.length === 0) return 0;
    
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  }

  isColumnAtWipLimit(columnId: string): boolean {
    const column = this.columns.find(c => c.id === columnId);
    if (!column?.wipLimit) return false;
    
    return this.getTasksForColumn(columnId).length >= column.wipLimit;
  }

  getWipLimitText(columnId: string): string {
    const column = this.columns.find(c => c.id === columnId);
    if (!column?.wipLimit) return '';
    
    const current = this.getTasksForColumn(columnId).length;
    return `${current}/${column.wipLimit}`;
  }
}