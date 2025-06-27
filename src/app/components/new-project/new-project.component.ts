import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.scss']
})
export class NewProjectComponent implements OnInit {
  name = '';
  description = '';
  startDate = '';
  endDate = '';
  teamMembers: string[] = [];
  allUsers: User[] = [];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    // Start with all non-viewer users
    let users = this.authService
      .getAllUsers()
      .filter(u => u.role !== UserRole.VIEWER);

      if (currentUser) {
      if (currentUser.role === UserRole.PROJECT_LEAD) {
        // Project lead can only select developers
        users = users.filter(u => u.role === UserRole.DEVELOPER);
      } else if (currentUser.role === UserRole.ADMIN) {
        // Admin can select leads and developers
        users = users.filter(u => u.role !== UserRole.ADMIN);
      }

      // Remove current user from the list
      users = users.filter(u => u.id !== currentUser.id);
    }

    this.allUsers = users;
  }

  toggleMember(userId: string): void {
    const idx = this.teamMembers.indexOf(userId);
    if (idx >= 0) {
      this.teamMembers.splice(idx, 1);
    } else {
      this.teamMembers.push(userId);
    }
  }

  isSelected(userId: string): boolean {
    return this.teamMembers.includes(userId);
  }

  createProject(): void {
    if (!this.name.trim()) {
      return;
    }
    const selected = [...this.teamMembers];
    this.projectService
      .createProject(this.name, this.description, {
        name: this.name,
        description: this.description,
        startDate: this.startDate,
        endDate: this.endDate,
        teamMembers: []
      })
      .subscribe(project => {
        selected.forEach(id => {
          const user = this.authService.getUserById(id);
          if (project && user) {
            this.projectService
              .inviteUser(project.id, user.email, user.role)
              .subscribe();
          }
        });
        this.router.navigate(['/projects']);
      });
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}