import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project, ProjectStatus, KanbanColumn, ProjectInvite } from '../models/project.model';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { WorkspaceService } from './workspace.service';
import { UserRole } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private currentProjectSubject = new BehaviorSubject<Project | null>(null);
    public currentProject$ = this.currentProjectSubject.asObservable();

    constructor(
        private storage: StorageService,
        private auth: AuthService,
        private workspace: WorkspaceService
    ) { }

    getProjects(): Observable<Project[]> {
        return new Observable(observer => {
            const workspace = this.workspace.getCurrentWorkspace();
            if (!workspace) {
                observer.next([]);
                observer.complete();
                return;
            }

            const projects = this.storage.get<Project[]>('projects') || [];
            const workspaceProjects = projects.filter(p => p.workspaceId === workspace.id);
            observer.next(workspaceProjects);
            observer.complete();
        });
    }

    createProject(name: string, description: string, teamMembers: string[] = []): Observable<Project> {
        return new Observable(observer => {
            const user = this.auth.getCurrentUser();
            const workspace = this.workspace.getCurrentWorkspace();

            if (!user || !workspace) {
                observer.error('User or workspace not found');
                return;
            }

            const project: Project = {
                id: this.storage.generateId(),
                name,
                description,
                workspaceId: workspace.id,
                leadId: user.id,
                teamMembers: [user.id, ...teamMembers],
                startDate: new Date(),
                status: ProjectStatus.PLANNING,
                columns: this.getDefaultColumns(),
                createdAt: new Date(),
                updatedAt: new Date(),
                settings: {
                    allowComments: true,
                    trackTime: true,
                    enableNotifications: true,
                    wipLimits: false
                }
            };

            const projects = this.storage.get<Project[]>('projects') || [];
            projects.push(project);
            this.storage.set('projects', projects);

            observer.next(project);
            observer.complete();
        });
    }

    updateProject(projectId: string, updates: Partial<Project>): Observable<Project> {
        return new Observable(observer => {
            const projects = this.storage.get<Project[]>('projects') || [];
            const projectIndex = projects.findIndex(p => p.id === projectId);

            if (projectIndex === -1) {
                observer.error('Project not found');
                return;
            }

            projects[projectIndex] = {
                ...projects[projectIndex],
                ...updates,
                updatedAt: new Date()
            };

            this.storage.set('projects', projects);
            observer.next(projects[projectIndex]);
            observer.complete();
        });
    }

    deleteProject(projectId: string): Observable<boolean> {
        return new Observable(observer => {
            const projects = this.storage.get<Project[]>('projects') || [];
            const filteredProjects = projects.filter(p => p.id !== projectId);
            this.storage.set('projects', filteredProjects);

            // Also delete related tasks
            const tasks = this.storage.get<any[]>('tasks') || [];
            const filteredTasks = tasks.filter(t => t.projectId !== projectId);
            this.storage.set('tasks', filteredTasks);

            observer.next(true);
            observer.complete();
        });
    }

    setCurrentProject(projectId: string): void {
        this.getProjects().subscribe(projects => {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                this.storage.set('currentProjectId', projectId);
                this.currentProjectSubject.next(project);
            }
        });
    }

    getCurrentProject(): Project | null {
        return this.currentProjectSubject.value;
    }

    updateColumns(projectId: string, columns: KanbanColumn[]): Observable<boolean> {
        return this.updateProject(projectId, { columns }).pipe(
            map(() => true)
        );
    }

    inviteUser(projectId: string, email: string, role: UserRole): Observable<ProjectInvite> {
        return new Observable(observer => {
            const user = this.auth.getCurrentUser();
            if (!user) {
                observer.error('User not authenticated');
                return;
            }

            const invite: ProjectInvite = {
                id: this.storage.generateId(),
                projectId,
                email,
                role,
                invitedBy: user.id,
                invitedAt: new Date(),
                status: 'pending',
                token: this.storage.generateId()
            };

            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            invites.push(invite);
            this.storage.set('projectInvites', invites);

            observer.next(invite);
            observer.complete();
        });
    } getInvitesForEmail(email: string): Observable<ProjectInvite[]> {
        return new Observable(observer => {
            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            observer.next(invites.filter(i => i.email === email));
            observer.complete();
        });
    }

    acceptInvite(token: string, userId: string): Observable<boolean> {
        return new Observable(observer => {
            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            const invite = invites.find(i => i.token === token && i.status === 'pending');
            if (!invite) {
                observer.error('Invite not found');
                return;
            }
            invite.status = 'accepted';
            this.storage.set('projectInvites', invites);

            const projects = this.storage.get<Project[]>('projects') || [];
            const project = projects.find(p => p.id === invite.projectId);
            if (project && !project.teamMembers.includes(userId)) {
                project.teamMembers.push(userId);
                this.storage.set('projects', projects);
            }

            observer.next(true);
            observer.complete();
        });
    }

    declineInvite(token: string): Observable<boolean> {
        return new Observable(observer => {
            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            const invite = invites.find(i => i.token === token && i.status === 'pending');
            if (!invite) {
                observer.error('Invite not found');
                return;
            }
            invite.status = 'declined';
            this.storage.set('projectInvites', invites);
            observer.next(true);
            observer.complete();
        });
    }


    private getDefaultColumns(): KanbanColumn[] {
        return [
            { id: 'todo', name: 'To Do', order: 0, color: '#64748b' },
            { id: 'in-progress', name: 'In Progress', order: 1, color: '#3b82f6' },
            { id: 'review', name: 'Review', order: 2, color: '#f59e0b' },
            { id: 'done', name: 'Done', order: 3, color: '#10b981' }
        ];
    }
}