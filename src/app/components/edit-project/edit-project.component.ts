import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

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
    this.allUsers = this.auth.getAllUsers();
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
        }
        this.loaded = true;
      });
    }
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

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}