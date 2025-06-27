import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Project, ProjectInvite, InviteStatus } from '../../models/project.model';
import { User, UserRole } from '../../models/user.model';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-team-management',
  templateUrl: './team-management.component.html',
  styleUrls: ['./team-management.component.scss']
})
export class TeamManagementComponent implements OnInit {
  project: Project | null = null;
  allUsers: User[] = [];
  availableUsers: User[] = [];
  selectedUserId: string | null = null;
  currentUser: User | null = null;
  pendingInvites: ProjectInvite[] = [];
  private roleHierarchy = [
    UserRole.VIEWER,
    UserRole.DEVELOPER,
    UserRole.PROJECT_LEAD,
    UserRole.ADMIN
  ];

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.project = this.projectService.getCurrentProject();
    this.allUsers = this.authService.getAllUsers();
    if (this.project) {
      this.projectService
        .getInvitesForProject(this.project.id)
        .subscribe(invites => {
          this.pendingInvites = invites.filter(i => i.status === InviteStatus.PENDING);
          this.refreshAvailable();
        });
    } else {
      this.refreshAvailable();
    }
  }

  refreshAvailable(): void {
    if (!this.project) return;
    const current = this.project.teamMembers || [];
    const invitedEmails = this.pendingInvites.map(i => i.email);
    this.availableUsers = this.allUsers.filter(
      u => !current.includes(u.id) && !invitedEmails.includes(u.email) && this.canAddToTeam(u) && u.role !== UserRole.VIEWER
    );
  }

  addMember(): void {
    if (!this.project || !this.selectedUserId) return;
    const user = this.authService.getUserById(this.selectedUserId);
    if (!user) return;
    this.projectService
      .inviteUser(this.project.id, user.email, user.role)
      .subscribe({
        next: () => {
          alert('Davet gönderildi');
          this.selectedUserId = null;
          this.projectService
            .getInvitesForProject(this.project!.id)
            .subscribe(invites => {
              this.pendingInvites = invites.filter(i => i.status === InviteStatus.PENDING);
              this.refreshAvailable();
            });
        },
        error: () => alert('Bu kullanıcı zaten davet edilmiş')
      });
  }

  private roleRank(role: UserRole): number {
    return this.roleHierarchy.indexOf(role);
  }

  private canAddToTeam(user: User): boolean {
    if (!this.currentUser) return false;
    if (user.role === UserRole.VIEWER) return false;
    return this.roleRank(user.role) <= this.roleRank(this.currentUser.role);
  }


  getUserName(id: string): string {
    const user = this.authService.getUserById(id);
    return user ? user.name : id;
  }

  close(): void {
    this.router.navigate(['/projects', this.project?.id]);
  }
}