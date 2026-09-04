import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole, PartnerStore } from '../models/auth.model';
import { ApiService } from './api.service';

const DEFAULT_SKELETON_USER: User = {
  id: '1',
  name: 'Rajesh Patel',
  email: 'owner@medicare.com',
  role: 'STORE_OWNER',
  phone: '+91 98765 43210',
  avatarIcon: '🏪',
  storeId: '1',
  storeName: 'MediCare Pharmacy & SuperStore (Main Branch)'
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_STORAGE_KEY = 'medi_auth_user_v1';
  private api = inject(ApiService);
  private router = inject(Router);

  readonly allUsers = signal<User[]>([]);
  readonly currentUser = signal<User>(this.loadInitialUser());
  readonly partnerStores = signal<PartnerStore[]>([]);
  readonly selectedStore = signal<PartnerStore | null>(null);
  readonly isLoggedIn = signal<boolean>(!!localStorage.getItem('medi_auth_user_v1'));

  // Computed user categories fetched from DB
  readonly storeOwners = computed(() => this.allUsers().filter(u => u.role === 'STORE_OWNER'));
  readonly doctors = computed(() => this.allUsers().filter(u => u.role === 'DOCTOR'));
  readonly customers = computed(() => this.allUsers().filter(u => u.role === 'CUSTOMER'));

  // Computed role checks
  readonly isOwner = computed(() => this.currentUser().role === 'STORE_OWNER');
  readonly isDoctor = computed(() => this.currentUser().role === 'DOCTOR');
  readonly isCustomer = computed(() => this.currentUser().role === 'CUSTOMER');

  constructor() {
    this.syncWithBackend();
  }

  syncWithBackend(): void {
    // 1. Fetch all user profiles (Owners, Doctors, Customers) from Spring Boot MySQL backend
    this.api.getUsers().subscribe({
      next: (users) => {
        if (users && users.length > 0) {
          const mappedUsers: User[] = users.map((u: any) => ({
            id: String(u.id),
            name: u.name,
            email: u.email,
            role: u.role as UserRole,
            phone: u.phone || '',
            avatarIcon: u.avatarIcon || (u.role === 'STORE_OWNER' ? '🏪' : u.role === 'DOCTOR' ? '🩺' : '👤'),
            storeId: u.storeId ? String(u.storeId) : undefined,
            storeName: u.storeName,
            doctorRegNo: u.doctorRegNo,
            doctorSpecialty: u.doctorSpecialty,
            clinicAddress: u.clinicAddress,
            customerAddress: u.customerAddress
          }));

          this.allUsers.set(mappedUsers);

          // If current user is not in the newly loaded list, match by email or fallback to first owner
          const currentEmail = this.currentUser().email;
          const matching = mappedUsers.find(u => u.email === currentEmail);
          const activeUser = matching || (mappedUsers.find(u => u.role === 'STORE_OWNER') || mappedUsers[0]);
          this.currentUser.set(activeUser);

          // Load scoped stores for the active user
          this.loadStoresForUser(activeUser);
        } else {
          this.loadStoresForUser(this.currentUser());
        }
      },
      error: () => {
        this.loadStoresForUser(this.currentUser());
      }
    });
  }

  loadStoresForUser(user: User): void {
    if (user.role === 'DOCTOR' || user.role === 'CUSTOMER') {
      // Scoped store visibility: only stores that have affiliated/registered this doctor or customer
      this.api.getAffiliatedStores(user.id).subscribe({
        next: (stores) => {
          const mapped: PartnerStore[] = (stores || []).map((s: any) => ({
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
          this.selectedStore.set(mapped.length > 0 ? mapped[0] : null);
        },
        error: (err) => {
          console.error('Failed to load affiliated stores', err);
          this.partnerStores.set([]);
          this.selectedStore.set(null);
        }
      });
    } else {
      // Store Owner: Sees all partner stores or their specific owned store
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
            const userStore = user.storeId ? mapped.find(st => st.id === user.storeId) : null;
            this.selectedStore.set(userStore || mapped[0]);
          }
        },
        error: () => {}
      });
    }
  }

  private loadInitialUser(): User {
    try {
      const saved = localStorage.getItem(this.USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read user from storage', e);
    }
    return DEFAULT_SKELETON_USER;
  }

  switchUser(user: User): void {
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user', e);
    }
    this.loadStoresForUser(user);
  }

  login(user: User, token?: string): void {
    this.currentUser.set(user);
    this.isLoggedIn.set(true);
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem('medi_jwt_token', token);
      }
    } catch (e) {
      console.error('Failed to save user', e);
    }
    this.loadStoresForUser(user);
  }

  logout(): void {
    try {
      localStorage.removeItem(this.USER_STORAGE_KEY);
      localStorage.removeItem('medi_jwt_token');
      localStorage.removeItem('medi_refresh_token');
    } catch (e) {}
    this.isLoggedIn.set(false);
    this.currentUser.set(DEFAULT_SKELETON_USER);
    this.partnerStores.set([]);
    this.selectedStore.set(null);
    this.router.navigate(['/login']);
  }

  loginAs(role: UserRole): void {
    const list = role === 'STORE_OWNER' ? this.storeOwners() : (role === 'DOCTOR' ? this.doctors() : this.customers());
    const found = list[0] || this.allUsers().find(u => u.role === role) || this.currentUser();
    this.switchUser(found);
  }

  selectStore(storeId: string): void {
    const store = this.partnerStores().find(s => s.id === storeId);
    if (store) {
      this.selectedStore.set(store);
    }
  }
}

