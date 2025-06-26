import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

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

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private projectService: ProjectService,
        private auth: AuthService
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
        // There is no dedicated edit page yet, navigate to new-project as a placeholder
        this.router.navigate(['/projects/new']);
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
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    getMemberName(id: string): string {
        const user = this.auth.getUserById(id);
        return user ? user.name : id;
    }

    goBack(): void {
        this.router.navigate(['/projects']);
    }
}