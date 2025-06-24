import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project, ProjectStatus, KanbanColumn, ProjectInvite, ProjectMember, InviteStatus } from '../models/project.model';
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
    ) {
        this.loadCurrentProject();
    }

    private loadCurrentProject(): void {
        const currentProjectId = this.storage.get<string>('currentProjectId');
        if (currentProjectId) {
            this.getProjects().subscribe(projects => {
                const project = projects.find(p => p.id === currentProjectId);
                if (project) {
                    this.currentProjectSubject.next(project);
                }
            });
        }
    }

    getProjects(): Observable<Project[]> {
        return new Observable(observer => {
            const user = this.auth.getCurrentUser();
            if (!user) {
                observer.next([]);
                observer.complete();
                return;
            }

            const projects = this.storage.get<Project[]>('projects') || [];

            // Filter projects based on user access
            const userProjects = projects.filter(p =>
                p.ownerId === user.id ||
                p.leadId === user.id ||
                (p.members && p.members.some(m => typeof m === 'string' ? m === user.id : m.id === user.id)) ||
                (p.teamMembers && p.teamMembers.includes(user.id))
            );

            observer.next(userProjects);
            observer.complete();
        });
    }

    getProject(id: string): Observable<Project | null> {
        return new Observable(observer => {
            const projects = this.storage.get<Project[]>('projects') || [];
            const project = projects.find(p => p.id === id);
            observer.next(project || null);
            observer.complete();
        });
    }

    createProject(projectData: Partial<Project>): Observable<Project> {
        return new Observable(observer => {
            const user = this.auth.getCurrentUser();
            if (!user) {
                observer.error('User not authenticated');
                return;
            }

            const project: Project = {
                id: this.storage.generateId(),
                name: projectData.name || 'New Project',
                description: projectData.description || '',
                status: projectData.status || 'active',
                ownerId: user.id,
                leadId: projectData.leadId || user.id,
                members: [{ id: user.id, name: user.name, role: 'owner' }],
                teamMembers: [user.id],
                createdAt: new Date(),
                updatedAt: new Date(),
                startDate: projectData.startDate || new Date(),
                endDate: projectData.endDate,
                columns: projectData.columns || this.getDefaultColumns(),
                kanbanColumns: projectData.kanbanColumns || this.getDefaultColumns(),
                progress: 0,
                taskCount: 0,
                memberCount: 1,
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

            // Update current project if it's the one being updated
            if (this.currentProjectSubject.value?.id === projectId) {
                this.currentProjectSubject.next(projects[projectIndex]);
            }

            observer.next(projects[projectIndex]);
            observer.complete();
        });
    }

    deleteProject(projectId: string): Observable<boolean> {
        return new Observable(observer => {
            const projects = this.storage.get<Project[]>('projects') || [];
            const filteredProjects = projects.filter(p => p.id !== projectId);
            this.storage.set('projects', filteredProjects);

            // Clear current project if it's the one being deleted
            if (this.currentProjectSubject.value?.id === projectId) {
                this.currentProjectSubject.next(null);
                this.storage.remove('currentProjectId');
            }

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
        return this.updateProject(projectId, {
            columns: columns,
            kanbanColumns: columns
        }).pipe(
            map(() => true)
        );
    }

    // Member management
    addMember(projectId: string, userId: string): Observable<boolean> {
        return new Observable(observer => {
            const projects = this.storage.get<Project[]>('projects') || [];
            const project = projects.find(p => p.id === projectId);

            if (!project) {
                observer.error('Project not found');
                return;
            }

            // Add to members array
            if (!project.members) {
                project.members = [];
            }

            const existingMember = project.members.find(m =>
                typeof m === 'string' ? m === userId : m.id === userId
            );

            if (!existingMember) {
                const user = this.auth.getUserById(userId);
                if (user) {
                    project.members.push({
                        id: userId,
                        name: user.name,
                        email: user.email,
                        role: 'member'
                    });
                }
            }

            // Add to teamMembers array
            if (!project.teamMembers) {
                project.teamMembers = [];
            }

            if (!project.teamMembers.includes(userId)) {
                project.teamMembers.push(userId);
            }

            this.storage.set('projects', projects);
            observer.next(true);
            observer.complete();
        });
    }

    removeMember(projectId: string, userId: string): Observable<boolean> {
        return new Observable(observer => {
            const projects = this.storage.get<Project[]>('projects') || [];
            const project = projects.find(p => p.id === projectId);

            if (!project) {
                observer.error('Project not found');
                return;
            }

            // Remove from members array
            if (project.members) {
                project.members = project.members.filter(m =>
                    typeof m === 'string' ? m !== userId : m.id !== userId
                );
            }

            // Remove from teamMembers array
            if (project.teamMembers) {
                project.teamMembers = project.teamMembers.filter(id => id !== userId);
            }

            this.storage.set('projects', projects);
            observer.next(true);
            observer.complete();
        });
    }

    // Invite system
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
                status: InviteStatus.PENDING,
                token: this.storage.generateId()
            };

            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            invites.push(invite);
            this.storage.set('projectInvites', invites);

            observer.next(invite);
            observer.complete();
        });
    }


    getInvitesForEmail(email: string): Observable<ProjectInvite[]> {
        return new Observable(observer => {
            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            observer.next(invites.filter(i => i.email === email));
            observer.complete();
        });
    }


    acceptInvite(token: string, userId: string): Observable<boolean> {
        return new Observable(observer => {
            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            const invite = invites.find(i => i.token === token && i.status === InviteStatus.PENDING);

            if (!invite) {
                observer.error('Invite not found or already handled');
                return;
            }

            invite.status = InviteStatus.ACCEPTED;
            this.storage.set('projectInvites', invites);

            this.addMember(invite.projectId, userId).subscribe({
                next: () => {
                    observer.next(true);
                    observer.complete();
                },
                error: (error) => observer.error(error)
            });
        });
    }


    declineInvite(token: string): Observable<boolean> {
        return new Observable(observer => {
            const invites = this.storage.get<ProjectInvite[]>('projectInvites') || [];
            const invite = invites.find(i => i.token === token && i.status === InviteStatus.PENDING);

            if (!invite) {
                observer.error('Invite not found or already handled');
                return;
            }

            invite.status = InviteStatus.DECLINED;
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