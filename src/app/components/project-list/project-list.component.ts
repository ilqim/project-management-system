import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  newName = '';
  newDescription = '';

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.projectService.getProjects().subscribe(ps => (this.projects = ps));
  }

  open(project: Project): void {
    this.projectService.setCurrentProject(project.id);
    this.router.navigate(['/dashboard']);
  }
  
  createProject(): void {
    if (!this.newName.trim()) {
      return;
    }
    this.projectService
      .createProject(this.newName, this.newDescription)
      .subscribe(p => {
        this.projects.push(p);
        this.newName = '';
        this.newDescription = '';
      });
  }
}