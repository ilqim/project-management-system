import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { ProjectInvite, InviteStatus, Project } from '../../models/project.model';
import { User } from '../../models/user.model';

interface InviteDetails extends ProjectInvite {
  project?: Project | null;
  invitedByUser?: User | null;
}

@Component({
  selector: 'app-accept-invite',
  templateUrl: './accept-invite.component.html',
  styleUrls: ['./accept-invite.component.scss']
})
export class AcceptInviteComponent implements OnInit {
  token = '';
  invites: InviteDetails[] = [];
  currentUser: User | null = null;

  constructor(
    private route: ActivatedRoute,
    private storage: StorageService,
    private router: Router,
    private projectService: ProjectService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (this.token) {
      this.storage.set('pendingInvite', this.token);
      } else {
      this.currentUser = this.auth.getCurrentUser();
      if (this.currentUser) {
        this.projectService
          .getInvitesForEmail(this.currentUser.email)
          .subscribe(invites => {
            const pending = invites.filter(i => i.status === InviteStatus.PENDING);
            this.invites = this.enrichInvites(pending);
          });
      }
    }
  }

  gotoLogin(): void {
    this.router.navigate(['/login']);
  }
  
  accept(invite: InviteDetails): void {
    if (!this.currentUser) return;
    this.projectService
      .acceptInvite(invite.token, this.currentUser.id)
      .subscribe(() => {
        this.invites = this.invites.filter(i => i.id !== invite.id);
      });
  }

  decline(invite: InviteDetails): void {
    this.projectService.declineInvite(invite.token).subscribe(() => {
      this.invites = this.invites.filter(i => i.id !== invite.id);
    });
  }
  
  private enrichInvites(invites: ProjectInvite[]): InviteDetails[] {
    return invites
      .map(invite => {
        const projects = this.storage.get<Project[]>('projects') || [];
        const project = projects.find(p => p.id === invite.projectId) || null;
        if (!project) {
          return null;
        }
        const invitedByUser = this.auth.getUserById(invite.invitedBy) || null;
        return { ...invite, project, invitedByUser } as InviteDetails;
      })
      .filter((i): i is InviteDetails => i !== null);
  }
}