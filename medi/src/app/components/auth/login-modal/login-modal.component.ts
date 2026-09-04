import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, DEMO_USERS } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  @Output() closed = new EventEmitter<void>();

  currentUser = this.authService.currentUser;
  demoUsers = DEMO_USERS;

  activeTab: UserRole = 'STORE_OWNER';
  email = 'owner@medicare.com';
  password = 'password123';

  selectDemoUser(user: User): void {
    this.authService.switchUser(user);
    this.navigateForRole(user.role);
    this.closed.emit();
  }

  setRoleTab(role: UserRole): void {
    this.activeTab = role;
    const user = DEMO_USERS.find(u => u.role === role);
    if (user) {
      this.email = user.email;
    }
  }

  onManualLogin(): void {
    this.authService.loginAs(this.activeTab);
    this.navigateForRole(this.activeTab);
    this.closed.emit();
  }

  private navigateForRole(role: UserRole): void {
    if (role === 'DOCTOR') {
      this.router.navigate(['/doctor']);
    } else if (role === 'CUSTOMER') {
      this.router.navigate(['/customer']);
    } else {
      this.router.navigate(['/billing']);
    }
  }
}
