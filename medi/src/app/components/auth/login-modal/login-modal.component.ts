import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
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
  private api = inject(ApiService);
  private router = inject(Router);

  @Output() closed = new EventEmitter<void>();

  currentUser = this.authService.currentUser;
  allUsers = this.authService.allUsers;
  storeOwners = this.authService.storeOwners;
  doctors = this.authService.doctors;
  customers = this.authService.customers;

  roleFilter: 'ALL' | UserRole = 'ALL';
  activeTab: UserRole = 'STORE_OWNER';
  email = '';
  password = '';
  loginError = '';

  selectUser(user: User): void {
    this.authService.switchUser(user);
    this.navigateForRole(user.role);
    this.closed.emit();
  }

  setRoleTab(role: UserRole): void {
    this.activeTab = role;
    const users = role === 'STORE_OWNER' ? this.storeOwners() : (role === 'DOCTOR' ? this.doctors() : this.customers());
    if (users.length > 0) {
      this.email = users[0].email;
    }
  }

  onManualLogin(): void {
    this.loginError = '';
    this.api.login({
      email: this.email,
      password: this.password,
      role: this.activeTab
    }).subscribe({
      next: (res) => {
        if (res?.user) {
          this.authService.switchUser({
            id: String(res.user.id),
            name: res.user.name,
            email: res.user.email,
            role: res.user.role,
            phone: res.user.phone || '',
            avatarIcon: res.user.avatarIcon || '👤',
            storeId: res.user.storeId ? String(res.user.storeId) : undefined,
            storeName: res.user.storeName,
            doctorRegNo: res.user.doctorRegNo,
            doctorSpecialty: res.user.doctorSpecialty,
            clinicAddress: res.user.clinicAddress,
            customerAddress: res.user.customerAddress
          });
        } else {
          this.authService.loginAs(this.activeTab);
        }
        this.navigateForRole(this.activeTab);
        this.closed.emit();
      },
      error: (err) => {
        console.warn('Backend login fallback to local session', err);
        this.authService.loginAs(this.activeTab);
        this.navigateForRole(this.activeTab);
        this.closed.emit();
      }
    });
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
