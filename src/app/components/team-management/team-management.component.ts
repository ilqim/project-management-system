import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-team-management',
  templateUrl: './team-management.component.html',
  styleUrls: ['./team-management.component.scss']
})
export class TeamManagementComponent implements OnInit {
  project: Project | null = null;
  allUsers: User[] = [];
  availableUsers: User[] = [];
  selectedUserId: string | null = null;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.project = this.projectService.getCurrentProject();
    this.allUsers = this.authService.getAllUsers();
    this.refreshAvailable();
  }

  refreshAvailable(): void {
    if (!this.project) return;
    const current = this.project.teamMembers || [];
    this.availableUsers = this.allUsers.filter(u => !current.includes(u.id));
  }

  addMember(): void {
    if (!this.project || !this.selectedUserId) return;
    this.projectService.addMember(this.project.id, this.selectedUserId).subscribe(() => {
      // update local project reference
      if (this.project) {
        if (!this.project.teamMembers) {
          this.project.teamMembers = [];
        }
        this.project.teamMembers.push(this.selectedUserId!);
      }
      this.selectedUserId = null;
      this.refreshAvailable();
    });
  }

  getUserName(id: string): string {
    const user = this.authService.getUserById(id);
    return user ? user.name : id;
  }

  close(): void {
    this.router.navigate(['/projects', this.project?.id]);
  }
}