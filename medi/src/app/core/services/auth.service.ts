import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole, PartnerStore } from '../models/auth.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_STORAGE_KEY = 'medi_auth_user_v1';
  private api = inject(ApiService);
  private router = inject(Router);

  readonly allUsers = signal<User[]>([]);
  readonly currentUser = signal<User | null>(this.loadInitialUser());
  readonly partnerStores = signal<PartnerStore[]>([]);
  readonly selectedStore = signal<PartnerStore | null>(null);

  readonly isLoggedIn = computed(() => !!this.currentUser() && !!localStorage.getItem('medi_jwt_token'));

  // Computed role checks
  readonly isOwner = computed(() => this.currentUser()?.role === 'STORE_OWNER');
  readonly isDoctor = computed(() => this.currentUser()?.role === 'DOCTOR');
  readonly isCustomer = computed(() => this.currentUser()?.role === 'CUSTOMER');

  constructor() {
    const user = this.currentUser();
    if (user && this.isLoggedIn()) {
      this.loadStoresForUser(user);
    }
  }

  loadStoresForUser(user: User): void {
    if (user.role === 'DOCTOR' || user.role === 'CUSTOMER') {
      // Scoped store visibility: only stores that have affiliated this doctor or customer
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
      // Store Owner: Sees all partner stores or their specific store
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

  private loadInitialUser(): User | null {
    try {
      const saved = localStorage.getItem(this.USER_STORAGE_KEY);
      const token = localStorage.getItem('medi_jwt_token');
      if (saved && token) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to read user from storage', e);
    }
    return null;
  }

  login(user: User, token?: string): void {
    this.currentUser.set(user);
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      if (token) {
        localStorage.setItem('medi_jwt_token', token);
      }
    } catch (e) {
      console.error('Failed to save user session', e);
    }
    this.loadStoresForUser(user);
  }

  logout(): void {
    try {
      localStorage.removeItem(this.USER_STORAGE_KEY);
      localStorage.removeItem('medi_jwt_token');
      localStorage.removeItem('medi_refresh_token');
    } catch (e) {}
    this.currentUser.set(null);
    this.partnerStores.set([]);
    this.selectedStore.set(null);
    this.router.navigate(['/login']);
  }

  selectStore(storeId: string): void {
    const store = this.partnerStores().find(s => s.id === storeId);
    if (store) {
      this.selectedStore.set(store);
    }
  }

  updateUserProfile(updatedData: Partial<User>): void {
    const user = this.currentUser();
    if (!user) return;
    const updated: User = { ...user, ...updatedData };
    this.currentUser.set(updated);
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update user in localStorage', e);
    }

    this.api.updateProfile(updatedData).subscribe({
      error: () => {}
    });
  }
}
