import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-invite-team',
  templateUrl: './invite-team.component.html',
  styleUrls: ['./invite-team.component.scss']
})
export class InviteTeamComponent {
  email = '';
  role: UserRole = UserRole.DEVELOPER;
  UserRole = UserRole;

  constructor(private projectService: ProjectService, private router: Router) {}

  sendInvite(): void {
    const current = this.projectService.getCurrentProject();
    if (!current) {
      alert('Önce bir proje seçin.');
      return;
    }
    if (!this.email.trim()) {
      alert('Email adresi gerekli.');
      return;
    }
    this.projectService.inviteUser(current.id, this.email, this.role).subscribe({
      next: () => {
        alert('Davet gönderildi!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        alert('Davet gönderilemedi.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}