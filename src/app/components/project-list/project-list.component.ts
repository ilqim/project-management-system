import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Project } from '../../models/project.model';
import { User, UserRole } from '../../models/user.model';

interface ProjectForm {
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
}

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
  loading = false; // Changed from isLoading
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  // Add missing properties
  projectForm: ProjectForm = {
    name: '',
    description: '',
    startDate: new Date()
  };

  currentUser: User | null = null;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private authService: AuthService // Add AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true; // Use loading instead of isLoading
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Projeler yüklenirken hata oluştu:', error);
        this.loading = false;
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

  // Fixed method name
  createNewProject(): void {
    this.router.navigate(['/projects/new']);
  }

  // Alternative method for compatibility
  createProject(): void {
    this.createNewProject();
  }

  openProject(project: Project): void {
    this.projectService.setCurrentProject(project.id);
    this.router.navigate(['/projects', project.id]);
  }

  // Fix method signature to match template
  editProject(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/projects/edit', project.id]);
  }

  // Fix method signature to match template
  deleteProject(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
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

  canCreateProject(): boolean {
    if (!this.currentUser) return false;
    return [UserRole.ADMIN, UserRole.PROJECT_LEAD].includes(this.currentUser.role);
  }


  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Aktif',
      'completed': 'Tamamlandı',
      'paused': 'Durdurulmuş',
      'planning': 'Planlama',
      'cancelled': 'İptal Edilmiş'
    };
    return statusMap[status] || status;
  }

  getProgressClass(progress: number): string {
    if (progress < 30) return 'low';
    if (progress < 70) return 'medium';
    return 'high';
  }

  isOverdue(dueDate: string | Date | undefined): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  getOwnerName(id?: string): string {
    if (!id) return 'Bilinmiyor';
    const user = this.authService.getUserById(id);
    return user ? user.name : id;
  }

  trackByProjectId(index: number, project: Project): any {
    return project.id;
  }

  // Check if user can edit project
  canEditProject(project: Project): boolean {
    if (!this.currentUser) return false;
    return (
      this.currentUser.id === project.ownerId ||
      this.currentUser.id === project.leadId ||
      (project.teamMembers ? project.teamMembers.includes(this.currentUser.id) : false)
    );
  }

  // Check if project is overdue
  isProjectOverdue(project: Project): boolean {
    const now = new Date();
    if (project.endDate && new Date(project.endDate) < now && project.status !== 'completed') {
      return true;
    }
    if (project.startDate && new Date(project.startDate) <= now && project.status === 'planning') {
      return true;
    }
    return false;
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

  // Property alias for template compatibility
  get isLoading(): boolean {
    return this.loading;
  }
}