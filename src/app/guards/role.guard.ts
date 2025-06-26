import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles: UserRole[] = route.data['roles'];
    const user = this.auth.getCurrentUser();
    if (user && (!expectedRoles || expectedRoles.includes(user.role))) {
      return true;
    }
    this.router.navigate(['/dashboard']);
    return false;
  }
}