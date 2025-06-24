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
  filteredProjects: Project[] = [];
  searchTerm = '';
  selectedStatus = '';
  viewMode: 'grid' | 'list' = 'grid';
  isLoading = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Projeler yüklenirken hata oluştu:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = this.projects;

    // Arama filtresi
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Durum filtresi
    if (this.selectedStatus) {
      filtered = filtered.filter(project => project.status === this.selectedStatus);
    }

    this.filteredProjects = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  createNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  openProject(project: Project): void {
    this.projectService.setCurrentProject(project.id);
    this.router.navigate(['/dashboard']);
  }

  editProject(project: Project, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/projects/edit', project.id]);
  }

  deleteProject(project: Project, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`"${project.name}" projesini silmek istediğinizden emin misiniz?`)) {
      this.projectService.deleteProject(project.id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== project.id);
          this.applyFilters();
        },
        error: (error) => {
          console.error('Proje silinirken hata oluştu:', error);
          alert('Proje silinirken bir hata oluştu.');
        }
      });
    }
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Aktif',
      'completed': 'Tamamlandı',
      'paused': 'Durdurulmuş'
    };
    return statusMap[status] || status;
  }

  getProgressClass(progress: number): string {
    if (progress < 30) return 'low';
    if (progress < 70) return 'medium';
    return 'high';
  }

  isOverdue(dueDate: string | Date): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  trackByProjectId(index: number, project: Project): any {
    return project.id;
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Pagination için filtered projects'i slice etmek için getter
  get paginatedProjects(): Project[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProjects.slice(startIndex, endIndex);
  }
}