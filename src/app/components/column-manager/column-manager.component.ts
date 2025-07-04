import { Component, Input, Output, EventEmitter } from '@angular/core';
import { KanbanColumn } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-column-manager',
  templateUrl: './column-manager.component.html',
  styleUrls: ['./column-manager.component.scss']
})
export class ColumnManagerComponent {
  @Input() projectId: string | null = null;
  @Input() columns: KanbanColumn[] = [];
  @Output() updated = new EventEmitter<KanbanColumn[]>();

  newColumnName = '';

  readonly defaultColumnIds = ['todo', 'in-progress', 'done'];

  constructor(private projectService: ProjectService) {}

  addColumn(): void {
    const name = this.newColumnName.trim();
    if (!name) { return; }
    const newColumn: KanbanColumn = {
      id: name.toLowerCase().replace(/\s+/g, '-') + Date.now().toString(36),
      name,
      order: this.columns.length
    };
    this.columns.push(newColumn);
    this.newColumnName = '';
    this.save();
  }

  isDefaultColumn(col: KanbanColumn): boolean {
    return this.defaultColumnIds.includes(col.id);
  }

  removeColumn(index: number): void {
    const col = this.columns[index];
    if (this.isDefaultColumn(col)) {
      return;
    }
    this.columns.splice(index, 1);
    this.reorder();
    this.save();
  }

  moveUp(index: number): void {
    if (index <= 0) { return; }
    [this.columns[index - 1], this.columns[index]] = [this.columns[index], this.columns[index - 1]];
    this.reorder();
    this.save();
  }

  moveDown(index: number): void {
    if (index >= this.columns.length - 1) { return; }
    [this.columns[index], this.columns[index + 1]] = [this.columns[index + 1], this.columns[index]];
    this.reorder();
    this.save();
  }

  private reorder(): void {
    this.columns.forEach((c, i) => c.order = i);
  }


  save(): void {
    if (!this.projectId) { return; }
    this.projectService.updateColumns(this.projectId, this.columns).subscribe(() => {
      this.updated.emit(this.columns);
    });
  }
}