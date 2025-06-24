import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../services/workspace.service';
import { Workspace } from '../../models/workspace.model';

@Component({
  selector: 'app-workspace-selector',
  templateUrl: './workspace-selector.component.html',
  styleUrls: ['./workspace-selector.component.scss']
})
export class WorkspaceSelectorComponent implements OnInit {
  workspaces: Workspace[] = [];

  constructor(private workspaceService: WorkspaceService, private router: Router) {}

  ngOnInit(): void {
    this.workspaceService.getWorkspaces().subscribe(ws => (this.workspaces = ws));
  }

  selectWorkspace(id: string): void {
    this.workspaceService.setCurrentWorkspace(id);
    this.router.navigate(['/projects']);
  }
}