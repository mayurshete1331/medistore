import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { BillingService } from '../../../core/services/billing.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { ReorderService } from '../../../core/services/reorder.service';
import { ApiService } from '../../../core/services/api.service';
import { FormsModule } from '@angular/forms';
import { AddClientModalComponent } from '../../clients/add-client-modal/add-client-modal.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, AddClientModalComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  inventoryService = inject(InventoryService);
  billingService = inject(BillingService);
  analyticsService = inject(AnalyticsService);
  authService = inject(AuthService);
  orderService = inject(OrderService);
  reorderService = inject(ReorderService);
  apiService = inject(ApiService);

  currentEnv = environment.envName || 'DEV';
  showAddClientModal = signal(false);
  isProfileOpen = signal(false);
  isCollapsed = signal<boolean>(typeof window !== 'undefined' && localStorage.getItem('medi_sidebar_collapsed') === 'true');

  showProfileModal = signal(false);
  profileForm = {
    name: '',
    email: '',
    phone: '',
    storeName: '',
    storeAddress: '',
    storeDlNumber: '',
    storeGstin: ''
  };

  openEditProfileModal(): void {
    const user = this.currentUser();
    this.profileForm = {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      storeName: user?.storeName || '',
      storeAddress: user?.storeAddress || '',
      storeDlNumber: user?.storeDlNumber || '',
      storeGstin: user?.storeGstin || ''
    };
    this.isProfileOpen.set(false);
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  saveProfile(): void {
    if (!this.profileForm.name.trim()) {
      alert('Name cannot be empty');
      return;
    }
    this.authService.updateUserProfile({
      name: this.profileForm.name.trim(),
      email: this.profileForm.email.trim(),
      phone: this.profileForm.phone.trim(),
      storeName: this.profileForm.storeName.trim(),
      storeAddress: this.profileForm.storeAddress.trim(),
      storeDlNumber: this.profileForm.storeDlNumber.trim(),
      storeGstin: this.profileForm.storeGstin.trim()
    });
    this.closeProfileModal();
  }

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medi_sidebar_collapsed', String(this.isCollapsed()));
    }
  }

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isOwner = this.authService.isOwner;
  isDoctor = this.authService.isDoctor;
  isCustomer = this.authService.isCustomer;

  toggleProfileDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isProfileOpen.update(v => !v);
  }

  closeProfileDropdown(): void {
    this.isProfileOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isProfileOpen()) {
      this.isProfileOpen.set(false);
    }
  }

  logout(): void {
    this.isProfileOpen.set(false);
    this.authService.logout();
  }

  lowStockCount = this.inventoryService.lowStockMedicines;
  cartCount = this.billingService.cartItemsCount;
  financials = this.analyticsService.financialSummary;
  pendingStoreOrdersCount = this.orderService.pendingOrders;
  backendStatus = this.apiService.backendStatus;

  quickDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  checkBackend(): void {
    this.apiService.checkHealth().subscribe(isOnline => {
      if (isOnline) {
        this.inventoryService.syncWithBackend();
        this.billingService.syncInvoicesFromBackend();
        this.orderService.syncOrdersFromBackend();
        this.reorderService.syncSuppliersFromBackend();
      }
    });
  }
}
