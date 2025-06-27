import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project, ProjectInvite, InviteStatus } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
    selector: 'app-project-detail',
    templateUrl: './project-detail.component.html',
    styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
    project: Project | null = null;
    loading = false;
    currentUser: User | null = null;
    UserRole = UserRole;
    memberTasks: { [memberId: string]: Task[] } = {};
    pendingInvites: ProjectInvite[] = [];

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

    manageTeam(): void {
        if (!this.project) return;
        this.router.navigate(['/team/manage']);
    }

    editProject(): void {
        if (!this.project) return;
        this.router.navigate(['/projects/edit', this.project.id]);
    }

    assignTask(userId: string): void {
        this.router.navigate(['/tasks/new'], { queryParams: { assigneeId: userId } });
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
                    this.loadMemberTasks(project.id);
                    this.loadInvites(project.id);
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadMemberTasks(projectId: string): void {
        this.taskService.getTasks(projectId).subscribe(tasks => {
            const map: { [id: string]: Task[] } = {};
            tasks.forEach(t => {
                if (t.assigneeId) {
                    if (!map[t.assigneeId]) {
                        map[t.assigneeId] = [];
                    }
                    map[t.assigneeId].push(t);
                }
            });
            this.memberTasks = map;
        });
    }


    getMemberName(id: string): string {
        const user = this.auth.getUserById(id);
        return user ? user.name : id;
    }
    
    loadInvites(projectId: string): void {
        this.projectService.getInvitesForProject(projectId).subscribe(invites => {
            this.pendingInvites = invites.filter(i => i.status === InviteStatus.PENDING);
        });
    }

    goBack(): void {
        this.router.navigate(['/projects']);
    }
}