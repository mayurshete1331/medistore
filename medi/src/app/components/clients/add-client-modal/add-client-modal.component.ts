import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
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
export class AddClientModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);

  @Output() closed = new EventEmitter<void>();
  @Output() clientAdded = new EventEmitter<{ type: 'CUSTOMER' | 'DOCTOR'; user: any }>();

  activeTab = signal<'CUSTOMER' | 'DOCTOR'>('CUSTOMER');
  isSubmitting = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  existingClients = signal<any[]>([]);
  duplicateCustomerName = signal<string | null>(null);
  duplicateDoctorName = signal<string | null>(null);

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

  ngOnInit(): void {
    this.loadStoreClients();

    this.customerForm.get('phone')?.valueChanges.subscribe(val => {
      const match = this.findDuplicateClient(val);
      this.duplicateCustomerName.set(match ? match.name : null);
    });

    this.doctorForm.get('phone')?.valueChanges.subscribe(val => {
      const match = this.findDuplicateClient(val);
      this.duplicateDoctorName.set(match ? match.name : null);
    });
  }

  loadStoreClients(): void {
    const storeId = this.currentStore?.id || '1';
    this.api.getStoreClients(storeId).subscribe({
      next: (res) => {
        const combined = [...(res?.customers || []), ...(res?.doctors || [])];
        this.existingClients.set(combined);
      },
      error: () => {}
    });
  }

  findDuplicateClient(phone: string): any | null {
    if (!phone) return null;
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) return null;
    const last10 = cleanDigits.slice(-10);

    for (const c of this.existingClients()) {
      const cPhone = (c.phone || '').replace(/\D/g, '');
      if (cPhone.slice(-10) === last10) {
        return c;
      }
    }
    return null;
  }

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

    const phone = this.customerForm.value.phone;
    const dup = this.findDuplicateClient(phone);
    if (dup) {
      this.errorMessage.set(`⚠️ Mobile "${phone}" is already registered to "${dup.name}". Duplicate phone numbers are not permitted.`);
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
        if (err.status === 409 || err.headers?.get('X-Conflict-Reason') === 'DUPLICATE_PHONE') {
          const existing = err.error;
          const existingName = existing?.name || 'an existing customer';
          this.errorMessage.set(`⚠️ Mobile "${phone}" is already registered to "${existingName}". Duplicate phone numbers are not permitted.`);
          return;
        }
        this.errorMessage.set(err.error?.message || 'Failed to register customer. Please try again.');
      }
    });
  }

  submitDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    const phone = this.doctorForm.value.phone;
    const dup = this.findDuplicateClient(phone);
    if (dup) {
      this.errorMessage.set(`⚠️ Mobile "${phone}" is already registered to "${dup.name}". Duplicate phone numbers are not permitted.`);
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
        if (err.status === 409 || err.headers?.get('X-Conflict-Reason') === 'DUPLICATE_PHONE') {
          const existing = err.error;
          const existingName = existing?.name || 'an existing person';
          this.errorMessage.set(`⚠️ Mobile "${phone}" is already registered to "${existingName}". Duplicate phone numbers are not permitted.`);
          return;
        }
        this.errorMessage.set(err.error?.message || 'Failed to affiliate doctor. Please try again.');
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
