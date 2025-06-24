import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.scss']
})
export class NewProjectComponent {
  name = '';
  description = '';

  constructor(private projectService: ProjectService, private router: Router) {}

  createProject(): void {
    if (!this.name.trim()) {
      return;
    }
    this.projectService.createProject(this.name, this.description).subscribe(() => {
      this.router.navigate(['/projects']);
    });
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }
}