import { Injectable, signal, computed, inject } from '@angular/core';
import { User, UserRole, PartnerStore } from '../models/auth.model';
import { ApiService } from './api.service';

export const DEMO_USERS: User[] = [
  {
    id: 'user-owner',
    name: 'Rajesh Patel',
    email: 'owner@medicare.com',
    role: 'STORE_OWNER',
    phone: '+91 98765 43210',
    avatarIcon: '🏪',
    storeId: 'store-1',
    storeName: 'MediCare Pharmacy & SuperStore (Main Branch)'
  },
  {
    id: 'user-doctor',
    name: 'Dr. Sneha Roy, MBBS, MD',
    email: 'dr.sneha@clinic.org',
    role: 'DOCTOR',
    phone: '+91 98201 88990',
    avatarIcon: '🩺',
    doctorRegNo: 'MMC-2016-89421',
    doctorSpecialty: 'Internal Medicine & Chronic Care',
    clinicAddress: 'Roy Medical Chambers, Suite 204, Mumbai'
  },
  {
    id: 'user-customer',
    name: 'Vikram Malhotra',
    email: 'vikram.m@gmail.com',
    role: 'CUSTOMER',
    phone: '+91 98199 44332',
    avatarIcon: '👤',
    customerAddress: 'Flat 402, Green Meadows Tower, Link Road, Andheri West, Mumbai 400053'
  }
];

export const PARTNER_STORES: PartnerStore[] = [
  {
    id: 'store-1',
    name: 'MediCare Pharmacy & SuperStore (Main Branch)',
    address: 'Shop 4 & 5, Health Square, Medical Zone, Mumbai 400012',
    phone: '+91 98765 43210',
    email: 'orders@medicare.com',
    dlNumber: '20B/MH-MZ4-10928, 21B/MH-MZ4-10929',
    gstin: '27AABCM1122D1Z9',
    distance: '0.4 km',
    rating: 4.9,
    isOpen: true,
    deliveryAvailable: true,
    codAvailable: true
  },
  {
    id: 'store-2',
    name: 'HealthFirst 24x7 Chemist & Druggists',
    address: 'Near Ruby Hall Clinic, Shivaji Nagar, Pune 411005',
    phone: '+91 91234 56789',
    email: 'pune@healthfirst.in',
    dlNumber: '20B/MH-PUN-34190, 21B/MH-PUN-34191',
    gstin: '27AABCH9988C1Z4',
    distance: '1.8 km',
    rating: 4.7,
    isOpen: true,
    deliveryAvailable: true,
    codAvailable: true
  },
  {
    id: 'store-3',
    name: 'Apex LifeLine Pharmacy & Surgical Store',
    address: 'G-12, Highland Complex, Majiwada, Thane West 400601',
    phone: '+91 99887 76655',
    email: 'care@apexlifeline.com',
    dlNumber: '20B/MH-THN-88120, 21B/MH-THN-88121',
    gstin: '27AABCA7766K1Z1',
    distance: '3.2 km',
    rating: 4.8,
    isOpen: true,
    deliveryAvailable: true,
    codAvailable: true
  }
];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_STORAGE_KEY = 'medi_auth_user_v1';
  private api = inject(ApiService);

  readonly currentUser = signal<User>(this.loadInitialUser());
  readonly partnerStores = signal<PartnerStore[]>(PARTNER_STORES);
  readonly selectedStore = signal<PartnerStore>(PARTNER_STORES[0]);

  // Computed role checks
  readonly isOwner = computed(() => this.currentUser().role === 'STORE_OWNER');
  readonly isDoctor = computed(() => this.currentUser().role === 'DOCTOR');
  readonly isCustomer = computed(() => this.currentUser().role === 'CUSTOMER');

  constructor() {
    this.syncWithBackend();
  }

  syncWithBackend(): void {
    // Fetch partner stores from Spring Boot backend
    this.api.getPartnerStores().subscribe({
      next: (stores) => {
        if (stores && stores.length > 0) {
          const mapped: PartnerStore[] = stores.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            address: s.address,
            phone: s.phone,
            email: s.email,
            dlNumber: s.dlNumber,
            gstin: s.gstin,
            distance: s.distance || '0.5 km',
            rating: Number(s.rating) || 4.8,
            isOpen: s.isOpen ?? true,
            deliveryAvailable: s.deliveryAvailable ?? true,
            codAvailable: s.codAvailable ?? true
          }));
          this.partnerStores.set(mapped);
          if (!this.selectedStore() || !mapped.some(st => st.id === this.selectedStore().id)) {
            this.selectedStore.set(mapped[0]);
          }
        }
      },
      error: () => {}
    });

    // Fetch user profiles from Spring Boot backend
    this.api.getUsers().subscribe({
      next: (users) => {
        if (users && users.length > 0) {
          const activeRole = this.currentUser().role;
          const matching = users.find((u: any) => u.role === activeRole);
          if (matching) {
            this.currentUser.set({
              id: String(matching.id),
              name: matching.name,
              email: matching.email,
              role: matching.role,
              phone: matching.phone,
              avatarIcon: matching.avatarIcon || (matching.role === 'STORE_OWNER' ? '🏪' : matching.role === 'DOCTOR' ? '🩺' : '👤'),
              storeId: matching.storeId ? String(matching.storeId) : undefined,
              storeName: matching.storeName,
              doctorRegNo: matching.doctorRegNo,
              doctorSpecialty: matching.doctorSpecialty,
              clinicAddress: matching.clinicAddress,
              customerAddress: matching.customerAddress
            });
          }
        }
      },
      error: () => {}
    });
  }

  private loadInitialUser(): User {
    try {
      const saved = localStorage.getItem(this.USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read user from storage', e);
    }
    return DEMO_USERS[0]; // defaults to Store Owner
  }

  switchUser(user: User): void {
    this.currentUser.set(user);
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }

  loginAs(role: UserRole): void {
    const found = DEMO_USERS.find(u => u.role === role) || DEMO_USERS[0];
    this.switchUser(found);
  }

  selectStore(storeId: string): void {
    const store = this.partnerStores().find(s => s.id === storeId);
    if (store) {
      this.selectedStore.set(store);
    }
  }
}
