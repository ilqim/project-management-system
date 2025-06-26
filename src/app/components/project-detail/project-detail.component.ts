import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProject();
  }

  loadProject(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.loading = true;
    this.projectService.getProject(id).subscribe({
      next: project => {
        this.project = project;
        if (project) {
          this.projectService.setCurrentProject(project.id);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getMemberName(id: string): string {
    const user = this.auth.getUserById(id);
    return user ? user.name : id;
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}