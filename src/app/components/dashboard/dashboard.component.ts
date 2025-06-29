import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project } from '../../models/project.model';
import { NotificationService, Notification } from '../../services/notification.service';

interface StatsData {
  activeProjects: number;
  openTasks: number;
  completedTasks: number;
  teamMembers: number;
}

interface Activity {
  id: string;
  text: string;
  time: string;
  iconClass: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: Date;
  assignee: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  currentUser: User | null = null;
  UserRole = UserRole;
  
  statsData: StatsData = {
    activeProjects: 0,
    openTasks: 0,
    completedTasks: 0,
    teamMembers: 0
  };

  recentActivities: Activity[] = [];

  private accessibleProjectIds: string[] = [];

  upcomingTasks: UpcomingTask[] = [
    {
      id: '1',
      title: 'Frontend geliştirme',
      description: 'Kullanıcı arayüzü tasarımı',
      priority: 'HIGH',
      dueDate: new Date(),
      assignee: 'John Doe'
    },
    {
      id: '2',
      title: 'Test yazma',
      description: 'Unit testlerin yazılması',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      assignee: 'Jane Smith'
    },
    {
      id: '3',
      title: 'Dokümantasyon',
      description: 'API dokümantasyonu güncelleme',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      assignee: 'Admin'
    }
  ];

  upcomingProjects: Project[] = [];

  constructor(
    private router: Router,
    private auth: AuthService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.projectService.getProjects().subscribe(projects => {
      this.accessibleProjectIds = projects.map(p => p.id);
      this.loadDashboardData();
      this.loadUpcomingProjects();
      this.subscribeToActivities();
      if (this.currentUser?.role === UserRole.DEVELOPER) {
        this.upcomingTasks = this.upcomingTasks.filter(t => t.assignee === this.currentUser?.name);
      }
    });
  }

  private loadDashboardData(): void {
    this.projectService.getProjects().subscribe(projects => {
      const activeProjects = projects.filter(p => p.status === 'active').length;
      this.taskService.getTasks().subscribe(tasks => {
        const openTasks = tasks.filter(t => !t.completedAt && t.columnId !== 'done').length;
        const completedTasks = tasks.filter(t => t.completedAt || t.columnId === 'done').length;
        const teamMembers = this.auth.getAllUsers().length;

        this.statsData = {
          activeProjects,
          openTasks,
          completedTasks,
          teamMembers
        };
      });
    });
  }

  private subscribeToActivities(): void {
    this.notification.notifications$.subscribe((notes: Notification[]) => {
      const filtered = notes.filter(n => {
        if (this.currentUser?.role === UserRole.ADMIN) return true;
        if (!n.projectId) return true;
        return this.accessibleProjectIds.includes(n.projectId);
      });

      this.recentActivities = filtered
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(n => this.mapNotificationToActivity(n));
    });
  }

  private mapNotificationToActivity(n: Notification): Activity {
    return {
      id: n.id,
      text: n.message,
      time: this.getTimeAgo(new Date(n.timestamp)),
      iconClass: this.getIconForType(n.type)
    };
  }

  private getIconForType(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check text-success';
      case 'error':
        return 'fas fa-times text-danger';
      case 'warning':
        return 'fas fa-exclamation-triangle text-warning';
      default:
        return 'fas fa-info-circle text-info';
    }
  }

  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    for (const i in intervals) {
      const counter = Math.floor(seconds / intervals[i]);
      if (counter > 0) {
        return `${counter} ${i}${counter > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  }


  private refreshStats(): void {
    // Deprecated: stats are loaded dynamically in loadDashboardData
    console.log('Dashboard statistics refreshed');
  }

  // Quick Action Methods - Güvenli navigasyon ile
  createNewProject(): void {
    console.log('Creating new project...');
    try {
      // Eğer route tanımlı değilse alternatif action
      this.router.navigate(['/projects/new']).catch(error => {
        console.warn('Route not found, showing alert instead');
        alert('Yeni proje oluşturma sayfası henüz hazır değil. Geliştirme aşamasında...');
      });
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Yeni proje oluşturma sayfası henüz hazır değil. Geliştirme aşamasında...');
    }
  }

  private loadUpcomingProjects(): void {
    this.projectService.getProjects().subscribe(projects => {
      const now = new Date();
      this.upcomingProjects = projects
        .filter(p => {
          const end = this.getProjectEndDate(p);
          return end && end > now;
        })
        .sort((a, b) => {
          const aDate = this.getProjectEndDate(a) as Date;
          const bDate = this.getProjectEndDate(b) as Date;
          return aDate.getTime() - bDate.getTime();
        })
        .slice(0, 3);
    });
  }

  getProjectEndDate(project: Project): Date | null {
    const date = project.endDate || project.dueDate;
    return date ? new Date(date) : null;
  }

  viewInvites(): void {
    this.router.navigate(['/invites']).catch(error => {
      console.warn('Route not found:', error);
      alert('Davetler sayfası henüz hazır değil.');
    });
  }

  addNewTask(): void {
    console.log('Adding new task...');
    try {
      this.router.navigate(['/tasks/new']).catch(error => {
        console.warn('Route not found, showing alert instead');
        alert('Yeni görev ekleme sayfası henüz hazır değil. Geliştirme aşamasında...');
      });
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Yeni görev ekleme sayfası henüz hazır değil. Geliştirme aşamasında...');
    }
  }

  inviteTeamMember(): void {
    this.router.navigate(['/team/invite']).catch(error => {
      console.warn('Route not found:', error);
      alert('Takım davet etme sayfası henüz hazır değil.');
    });
  }

  viewReports(): void {
    console.log('Viewing reports...');
    try {
      this.router.navigate(['/reports']).catch(error => {
        console.warn('Route not found, showing reports modal instead');
        this.showReportsModal();
      });
    } catch (error) {
      console.error('Navigation error:', error);
      this.showReportsModal();
    }
  }

  // Yardımcı metodlar
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showReportsModal(): void {
    // Basit bir rapor özeti göster
    const reportSummary = `
📊 RAPOR ÖZETİ 📊

🎯 Aktif Projeler: ${this.statsData.activeProjects}
📋 Açık Görevler: ${this.statsData.openTasks}
✅ Tamamlanan Görevler: ${this.statsData.completedTasks}
👥 Takım Üyeleri: ${this.statsData.teamMembers}

📈 Verimlilik: %${Math.round((this.statsData.completedTasks / (this.statsData.completedTasks + this.statsData.openTasks)) * 100)}

Detaylı raporlar sayfası geliştirme aşamasında...
    `;
    alert(reportSummary);
  }

  // Diğer helper metodlar
  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  }

  formatDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Yarın';
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  }

  onStatCardClick(statType: string): void {
    console.log('Stat card clicked:', statType);
    try {
      switch (statType) {
        case 'projects':
          this.router.navigate(['/projects']).catch(() => {
            alert('Projeler sayfası henüz hazır değil.');
          });
          break;
        case 'tasks':
          this.router.navigate(['/tasks']).catch(() => {
            alert('Görevler sayfası henüz hazır değil.');
          });
          break;
        case 'completed':
          this.router.navigate(['/tasks'], { queryParams: { status: 'completed' } }).catch(() => {
            alert('Tamamlanan görevler sayfası henüz hazır değil.');
          });
          break;
        case 'team':
          this.router.navigate(['/team']).catch(() => {
            alert('Takım sayfası henüz hazır değil.');
          });
          break;
        default:
          console.log('Unknown stat type:', statType);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  onActivityClick(activity: Activity): void {
    console.log('Activity clicked:', activity);
    alert(`Aktivite: ${activity.text}\nZaman: ${activity.time}`);
  }

  onTaskClick(task: UpcomingTask): void {
    console.log('Task clicked:', task);
    const taskDetails = `
🎯 GÖREV DETAYI

📝 Başlık: ${task.title}
📄 Açıklama: ${task.description}
⚡ Öncelik: ${task.priority}
📅 Bitiş Tarihi: ${this.formatDate(task.dueDate)}
👤 Atanan: ${task.assignee}
    `;
    alert(taskDetails);
  }
}