import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { StorageService } from '../../services/storage.service';
import { User } from '../../models/user.model';
import { Workspace } from '../../models/workspace.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user: User | null = null;
  workspace: Workspace | null = null;
  theme: 'light' | 'dark' = 'light';

  constructor(
    private auth: AuthService,
    private workspaceService: WorkspaceService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(u => (this.user = u));
    this.workspaceService.currentWorkspace$.subscribe(w => (this.workspace = w));
    const savedTheme = this.storage.get<string>('theme') || 'light';
    this.theme = savedTheme as 'light' | 'dark';
    this.applyTheme();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.storage.set('theme', this.theme);
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  logout(): void {
    this.auth.logout();
  }
}