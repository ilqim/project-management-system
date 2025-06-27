import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  error: string = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private projectService: ProjectService,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.auth.getCurrentUser()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          const token = this.storage.get<string>('pendingInvite');
          const current = this.auth.getCurrentUser();
          if (token && current) {
            this.projectService.acceptInvite(token, current.id).subscribe({
              next: () => this.storage.remove('pendingInvite'),
              error: err => console.error(err)
            });
          }
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Invalid credentials';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Login failed. Please try again.';
      }
    });
  }

  loginAsDemo(): void {
    this.email = 'admin@test.com';
    this.password = 'demo123';
    this.onSubmit();
  }
}