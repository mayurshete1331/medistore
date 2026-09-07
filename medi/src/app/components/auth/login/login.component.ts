import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal<boolean>(false);
  returnUrl = '/billing';

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    rememberMe: [true]
  });

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
    // If user is already logged in, redirect them to their portal
    if (this.authService.isLoggedIn()) {
      this.redirectToRolePortal(this.authService.currentUser()?.role || 'STORE_OWNER');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api.login({ email, password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.user) {
          const user = {
            id: String(res.user.id),
            name: res.user.name,
            email: res.user.email,
            role: res.user.role as UserRole,
            phone: res.user.phone || '',
            avatarIcon: res.user.avatarIcon || (res.user.role === 'STORE_OWNER' ? '🏪' : res.user.role === 'DOCTOR' ? '🩺' : '👤'),
            storeId: res.user.storeId ? String(res.user.storeId) : undefined,
            storeName: res.user.storeName,
            doctorRegNo: res.user.doctorRegNo,
            doctorSpecialty: res.user.doctorSpecialty,
            clinicAddress: res.user.clinicAddress,
            customerAddress: res.user.customerAddress
          };
          this.authService.login(user, res.token);
          this.redirectToRolePortal(user.role);
        } else {
          this.errorMessage.set('Invalid login response from server.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Invalid email address or password. Please verify your credentials.');
        } else if (err.status === 0 || err.name === 'TimeoutError') {
          this.errorMessage.set('Unable to connect to server. Please verify your connection or try again.');
        } else {
          this.errorMessage.set(err.error?.message || 'Authentication failed. Please try again.');
        }
      }
    });
  }

  private redirectToRolePortal(role: UserRole): void {
    if (this.returnUrl && this.returnUrl !== '/login') {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    if (role === 'DOCTOR') {
      this.router.navigate(['/doctor']);
    } else if (role === 'CUSTOMER') {
      this.router.navigate(['/customer']);
    } else {
      this.router.navigate(['/billing']);
    }
  }
}
