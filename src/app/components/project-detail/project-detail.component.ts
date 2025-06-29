import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project, ProjectInvite, InviteStatus } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';
import { Task, TaskPriority } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
    selector: 'app-project-detail',
    templateUrl: './project-detail.component.html',
    styleUrls: ['./project-detail.component.scss'],
    animations: [
        trigger('slideDown', [
            state('void', style({ height: '0', opacity: 0 })),
            state('*', style({ height: '*', opacity: 1 })),
            transition('void <=> *', animate('200ms ease'))
        ])
    ]
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
    project: Project | null = null;
    loading = false;
    currentUser: User | null = null;
    UserRole = UserRole;
    memberTasks: { [memberId: string]: Task[] } = {};
    pendingInvites: ProjectInvite[] = [];
    expandedMembers: { [memberId: string]: boolean } = {};
    tasksLoaded = false; // Görevlerin yüklenip yüklenmediğini takip et
    private tasksSub?: Subscription;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private projectService: ProjectService,
        private auth: AuthService,
        private taskService: TaskService
    ) { }

    ngOnInit(): void {
        this.currentUser = this.auth.getCurrentUser();
        this.loadProject();
        this.tasksSub = this.taskService.tasks$.subscribe(tasks => {
            if (this.project) {
                const projectTasks = tasks.filter(t => t.projectId === this.project!.id);
                this.mapMemberTasks(projectTasks);
            }
        });
    }

    ngOnDestroy(): void {
        this.tasksSub?.unsubscribe();
    }

    // Düzeltilmiş toggleMemberTasks - API çağrısı kaldırıldı
    toggleMemberTasks(memberId: string): void {
        this.expandedMembers[memberId] = !this.expandedMembers[memberId];
        // API çağrısı kaldırıldı - görevler zaten başlangıçta yüklendi
    }

    canManage(): boolean {
        if (!this.currentUser || !this.project) {
            return false;
        }
        return (
            this.currentUser.role === UserRole.ADMIN ||
            (this.currentUser.role === UserRole.PROJECT_LEAD &&
                this.project.leadId === this.currentUser.id)
        );
    }

    getPriorityText(priority: TaskPriority): string {
        switch (priority) {
            case TaskPriority.LOW:
                return 'Düşük';
            case TaskPriority.MEDIUM:
                return 'Orta';
            case TaskPriority.HIGH:
                return 'Yüksek';
            case TaskPriority.URGENT:
                return 'Acil';
            default:
                return priority;
        }
    }

    manageTeam(): void {
        if (!this.project) return;
        this.router.navigate(['/team/manage']);
    }

    editProject(): void {
        if (!this.project) return;
        this.router.navigate(['/projects/edit', this.project.id]);
    }

    assignTask(userId: string): void {
        if (!this.project) return;
        this.router.navigate(['/tasks/new'], {
            queryParams: { assigneeId: userId, projectId: this.project.id }
        });
    }

    editTask(task: Task): void {
        const returnUrl = this.project ? `/projects/${this.project.id}` : '/projects';
        this.router.navigate(['/tasks/edit', task.id], {
            queryParams: { returnUrl }
        });
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
                    this.loadMemberTasks(project.id); // Sadece bir kez yükle
                    this.loadInvites(project.id);
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    // Optimize edilmiş loadMemberTasks metodu
    loadMemberTasks(projectId: string): void {
        if (this.tasksLoaded) {
            return; // Zaten yüklenmişse tekrar yükleme
        }

        console.log('Loading member tasks for project:', projectId);
        
        this.taskService.getTasks(projectId).subscribe({
            next: (tasks) => {
                console.log('Tasks received:', tasks);
                
                this.mapMemberTasks(tasks);
                this.tasksLoaded = true; // Görevler yüklendi işareti
            },
            error: (error) => {
                console.error('Error loading member tasks:', error);
            }
        });
    }

    getMemberName(id: string): string {
        const user = this.auth.getUserById(id);
        return user ? user.name : `Kullanıcı ${id}`;
    }

    private mapMemberTasks(tasks: Task[]): void {
        const map: { [id: string]: Task[] } = {};

        if (this.project?.teamMembers) {
            this.project.teamMembers.forEach(memberId => {
                map[memberId] = [];
            });
        }

        tasks.forEach(task => {
            if (task.assigneeId && this.project?.teamMembers?.includes(task.assigneeId)) {
                map[task.assigneeId].push(task);
            }
        });

        this.memberTasks = map;
    }

    loadInvites(projectId: string): void {
        this.projectService.getInvitesForProject(projectId).subscribe(invites => {
            this.pendingInvites = invites.filter(i => i.status === InviteStatus.PENDING);
        });
    }

    goBack(): void {
        this.router.navigate(['/projects']);
    }

    isOverdue(dueDate: Date): boolean {
        return new Date(dueDate) < new Date();
    }

    // Manuel yenileme metodu - sadece buton tıklandığında çalışır
    refreshMemberTasks(): void {
        if (this.project) {
            this.tasksLoaded = false; // Reset flag
            this.loadMemberTasks(this.project.id);
        }
    }
    
    getColumnName(columnId: string): string {
        const columns = this.project?.kanbanColumns || this.project?.columns || [];
        const col = columns.find(c => c.id === columnId);
        return col ? col.name : columnId;
    }

    // Yeni görev ekledikten sonra çağrılacak metod
    onTaskAssigned(): void {
        this.refreshMemberTasks();
    }
}