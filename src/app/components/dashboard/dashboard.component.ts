import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

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
    activeProjects: 12,
    openTasks: 48,
    completedTasks: 156,
    teamMembers: 8
  };

  recentActivities: Activity[] = [
    {
      id: '1',
      text: 'Yeni görev eklendi: "API entegrasyonu"',
      time: '2 saat önce',
      iconClass: 'fas fa-plus text-success'
    },
    {
      id: '2',
      text: 'Görev tamamlandı: "Veritabanı tasarımı"',
      time: '4 saat önce',
      iconClass: 'fas fa-check text-success'
    },
    {
      id: '3',
      text: 'Yeni takım üyesi eklendi: Jane Smith',
      time: '1 gün önce',
      iconClass: 'fas fa-user-plus text-info'
    },
    {
      id: '4',
      text: 'Yeni proje oluşturuldu: "Mobile App"',
      time: '2 gün önce',
      iconClass: 'fas fa-folder text-primary'
    }
  ];

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

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.loadDashboardData();
    if (this.currentUser?.role === UserRole.DEVELOPER) {
      this.upcomingTasks = this.upcomingTasks.filter(t => t.assignee === this.currentUser?.name);
    }
  }

  private loadDashboardData(): void {
    // Bu metod gerçek uygulamada API'den veri çekecek
    // Şimdilik mock data kullanıyoruz
    this.refreshStats();
  }

  private refreshStats(): void {
    // Gerçek uygulamada bu metod API'den güncel istatistikleri çekecek
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