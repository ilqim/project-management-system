import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { ProjectInvite, InviteStatus } from '../../models/project.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-accept-invite',
  templateUrl: './accept-invite.component.html',
  styleUrls: ['./accept-invite.component.scss']
})
export class AcceptInviteComponent implements OnInit {
  token = '';
  invites: ProjectInvite[] = [];
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
            this.invites = invites.filter(i => i.status === InviteStatus.PENDING);
          });
      }
    }
  }

  gotoLogin(): void {
    this.router.navigate(['/login']);
  }
  
  accept(invite: ProjectInvite): void {
    if (!this.currentUser) return;
    this.projectService
      .acceptInvite(invite.token, this.currentUser.id)
      .subscribe(() => {
        this.invites = this.invites.filter(i => i.id !== invite.id);
      });
  }

  decline(invite: ProjectInvite): void {
    this.projectService.declineInvite(invite.token).subscribe(() => {
      this.invites = this.invites.filter(i => i.id !== invite.id);
    });
  }
}