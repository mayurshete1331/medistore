import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-add-client-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-client-modal.component.html',
  styleUrls: ['./add-client-modal.component.scss']
})
export class AddClientModalComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);

  @Output() closed = new EventEmitter<void>();
  @Output() clientAdded = new EventEmitter<{ type: 'CUSTOMER' | 'DOCTOR'; user: any }>();

  activeTab = signal<'CUSTOMER' | 'DOCTOR'>('CUSTOMER');
  isSubmitting = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  get currentStore() {
    return this.authService.selectedStore();
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  customerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+ -]{10,15}$/)]],
    email: ['', [Validators.email]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    notes: ['']
  });

  doctorForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+ -]{10,15}$/)]],
    email: ['', [Validators.email]],
    doctorRegNo: ['', [Validators.required, Validators.minLength(3)]],
    doctorSpecialty: ['General Physician', [Validators.required]],
    clinicAddress: ['', [Validators.required, Validators.minLength(5)]],
    notes: ['']
  });

  specialties = [
    'General Physician',
    'Cardiologist',
    'Pediatrician',
    'Dermatologist',
    'Orthopedic Surgeon',
    'Gynecologist',
    'ENT Specialist',
    'Diabetologist / Endocrinologist',
    'Neurologist',
    'Dentist'
  ];

  setTab(tab: 'CUSTOMER' | 'DOCTOR'): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  submitCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const storeId = this.currentStore?.id || '1';
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      ...this.customerForm.value,
      addedBy: this.currentUser?.name || 'Store Owner'
    };

    this.api.addStoreCustomer(storeId, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Customer "${res.name}" registered successfully! Store history updated.`);
        this.clientAdded.emit({ type: 'CUSTOMER', user: res });
        setTimeout(() => this.closed.emit(), 1400);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to register customer. Please try again.');
      }
    });
  }

  submitDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    const storeId = this.currentStore?.id || '1';
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      ...this.doctorForm.value,
      addedBy: this.currentUser?.name || 'Store Owner'
    };

    this.api.addStoreDoctor(storeId, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Dr. "${res.name}" affiliated successfully! Store history updated.`);
        this.clientAdded.emit({ type: 'DOCTOR', user: res });
        setTimeout(() => this.closed.emit(), 1400);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to affiliate doctor. Please try again.');
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
