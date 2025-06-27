import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

interface ProjectForm {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  teamMembers: string[];
}

@Component({
  selector: 'app-edit-project',
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.scss']
})
export class EditProjectComponent implements OnInit {
  projectId = '';
  projectForm: ProjectForm = { name: '', description: '', startDate: '', teamMembers: [] };
  original = { name: '', description: '' };
  allUsers: User[] = [];
  loaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId = id;
      this.projectService.getProject(id).subscribe(project => {
        if (project) {
          this.projectForm.name = project.name;
          this.projectForm.description = project.description || '';
          this.projectForm.startDate = this.toDateInput(project.startDate);
          this.projectForm.endDate = this.toDateInput(project.endDate);
          this.projectForm.teamMembers = project.teamMembers ? [...project.teamMembers] : [];
          this.original.name = project.name;
          this.original.description = project.description || '';
          const owner = project.ownerId ? this.auth.getUserById(project.ownerId) : null;
          if (owner) {
            this.filterUsers(owner);
          } else {
            this.allUsers = [];
          }
        }
        this.loaded = true;
      });
    }
  }

  private filterUsers(owner: User): void {
    let users = this.auth.getAllUsers().filter(u => u.role !== UserRole.VIEWER);

    if (owner.role === UserRole.PROJECT_LEAD) {
      users = users.filter(u => u.role === UserRole.DEVELOPER);
    } else if (owner.role === UserRole.ADMIN) {
      users = users.filter(u => u.role !== UserRole.ADMIN);
    }

    users = users.filter(u => u.id !== owner.id);

    this.allUsers = users;
  }

  private toDateInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().substring(0, 10);
  }

  updateProject(): void {
    if (!this.projectId) return;
    this.projectService
      .updateProject(this.projectId, {
        name: this.projectForm.name,
        description: this.projectForm.description,
        startDate: this.projectForm.startDate,
        endDate: this.projectForm.endDate,
        teamMembers: this.projectForm.teamMembers
      })
      .subscribe(() => {
        this.router.navigate(['/projects']);
      });
  }
  toggleMember(userId: string): void {
    const idx = this.projectForm.teamMembers.indexOf(userId);
    if (idx >= 0) {
      this.projectForm.teamMembers.splice(idx, 1);
    } else {
      this.projectForm.teamMembers.push(userId);
    }
  }

  isSelected(userId: string): boolean {
    return this.projectForm.teamMembers.includes(userId);
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}