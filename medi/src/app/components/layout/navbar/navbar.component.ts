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
import { AddClientModalComponent } from '../../clients/add-client-modal/add-client-modal.component';
import { LoginModalComponent } from '../../auth/login-modal/login-modal.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AddClientModalComponent, LoginModalComponent],
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
  showSwitchProfileModal = signal(false);

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

  openSwitchProfile(): void {
    this.isProfileOpen.set(false);
    this.showSwitchProfileModal.set(true);
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
        this.authService.syncWithBackend();
        this.reorderService.syncSuppliersFromBackend();
      }
    });
  }
}

