import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { Project } from '../../models/project.model';
import { User, UserRole } from '../../models/user.model';
import { TaskService } from '../../services/task.service';

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
  loading = false;
  
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
  taskCounts: { [projectId: string]: number } = {};
  confirmVisible = false;
  confirmMessage = '';
  action: 'cancel' | null = null; // Sadece cancel aksiyonu kalacak
  selectedProject: Project | null = null;
  UserRole = UserRole;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private authService: AuthService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.taskService.getTasks().subscribe(tasks => {
      const counts: { [pid: string]: number } = {};
      tasks.forEach(t => {
        if (!this.currentUser) return;
        if (
          this.currentUser.role === UserRole.ADMIN ||
          this.currentUser.role === UserRole.PROJECT_LEAD
        ) {
          counts[t.projectId] = (counts[t.projectId] || 0) + 1;
        } else if (
          this.currentUser.role === UserRole.DEVELOPER &&
          t.assigneeId === this.currentUser.id
        ) {
          counts[t.projectId] = (counts[t.projectId] || 0) + 1;
        }
      });
      this.projectService.getProjects().subscribe({
        next: projects => {
          this.projects = projects.map(p => ({ ...p, taskCount: counts[p.id] || 0 }));
          this.taskCounts = counts;
          this.applyFilters();
          this.loading = false;
        },
        error: error => {
          console.error('Projeler yüklenirken hata oluştu:', error);
          this.loading = false;
        }
      });
    });
  }

  cancelProject(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedProject = project;
    this.action = 'cancel';
    this.confirmMessage = `"${project.name}" projesini silmek istediğinizden emin misiniz?`;
    this.confirmVisible = true;
  }

  // İptal etme yetkisi kontrolü
  canCancelProject(project: Project): boolean {
    if (!this.currentUser) return false;
    
    // Admin tüm projeleri iptal edebilir
    if (this.currentUser.role === UserRole.ADMIN) {
      return project.status !== 'cancelled';
    }
    
    // Project Lead sadece kendi oluşturduğu projeleri iptal edebilir
    return (
      this.currentUser.role === UserRole.PROJECT_LEAD &&
      project.ownerId === this.currentUser.id &&
      (project.status === 'active' || project.status === 'planning')
    );
  }

  // Düzenleme yetkisi kontrolü
  canEditProject(project: Project): boolean {
    if (!this.currentUser) return false;
    
    // Admin tüm projeleri düzenleyebilir
    if (this.currentUser.role === UserRole.ADMIN) {
      return true;
    }
    
    // Project Lead sadece kendi oluşturduğu projeleri düzenleyebilir
    return (
      this.currentUser.role === UserRole.PROJECT_LEAD &&
      project.ownerId === this.currentUser.id
    );
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

  createProject(): void {
    this.createNewProject();
  }

  openProject(project: Project): void {
    this.projectService.setCurrentProject(project.id);
    this.router.navigate(['/projects', project.id]);
  }

  editProject(project: Project, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/projects/edit', project.id]);
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
      'planning': 'Planlama'
    };
    return statusMap[status] || status;
  }

  confirmAction(): void {
    if (!this.selectedProject || !this.action) {
      this.resetDialog();
      return;
    }
    
    if (this.action === 'cancel') {
      this.projectService.deleteProject(this.selectedProject.id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== this.selectedProject!.id);
          this.applyFilters();
          this.resetDialog();
        },
        error: (error) => {
          console.error('Proje silinirken hata oluştu:', error);
          alert('Proje silinirken bir hata oluştu.');
          this.resetDialog();
        }
      });
    }
  }

  cancelDialog(): void {
    this.resetDialog();
  }

  private resetDialog(): void {
    this.confirmVisible = false;
    this.selectedProject = null;
    this.action = null;
    this.confirmMessage = '';
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

  get paginatedProjects(): Project[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProjects.slice(startIndex, endIndex);
  }

  get isLoading(): boolean {
    return this.loading;
  }
}