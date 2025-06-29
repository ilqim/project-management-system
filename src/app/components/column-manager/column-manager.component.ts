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

  save(): void {
    if (!this.projectId) { return; }
    this.projectService.updateColumns(this.projectId, this.columns).subscribe(() => {
      this.updated.emit(this.columns);
    });
  }
}