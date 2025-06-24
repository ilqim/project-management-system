import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadDashboardData();
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

  // Quick Action Methods
  createNewProject(): void {
    console.log('Creating new project...');
    // Yeni proje oluşturma modalını aç veya sayfaya yönlendir
    this.router.navigate(['/projects/new']);
  }

  addNewTask(): void {
    console.log('Adding new task...');
    // Yeni görev ekleme modalını aç veya sayfaya yönlendir
    this.router.navigate(['/tasks/new']);
  }

  inviteTeamMember(): void {
    console.log('Inviting team member...');
    // Takım üyesi davet etme modalını aç
    // Modal service kullanılabilir
  }

  viewReports(): void {
    console.log('Viewing reports...');
    // Raporlar sayfasına yönlendir
    this.router.navigate(['/reports']);
  }

  // Helper Methods
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
    switch (statType) {
      case 'projects':
        this.router.navigate(['/projects']);
        break;
      case 'tasks':
        this.router.navigate(['/tasks']);
        break;
      case 'completed':
        this.router.navigate(['/tasks'], { queryParams: { status: 'completed' } });
        break;
      case 'team':
        this.router.navigate(['/team']);
        break;
      default:
        console.log('Unknown stat type:', statType);
    }
  }

  onActivityClick(activity: Activity): void {
    console.log('Activity clicked:', activity);
    // Aktivite detayına git veya ilgili sayfaya yönlendir
  }

  onTaskClick(task: UpcomingTask): void {
    console.log('Task clicked:', task);
    this.router.navigate(['/tasks', task.id]);
  }
}