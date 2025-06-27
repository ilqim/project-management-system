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
    this.allUsers = this.authService
      .getAllUsers()
      .filter(u => u.role !== UserRole.VIEWER);
  }

  createProject(): void {
    if (!this.name.trim()) {
      return;
    }
    this.projectService
      .createProject(this.name, this.description, {
        name: this.name,
        description: this.description,
        startDate: this.startDate,
        endDate: this.endDate,
        teamMembers: this.teamMembers
      })
      .subscribe(() => {
        this.router.navigate(['/projects']);
      });
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}