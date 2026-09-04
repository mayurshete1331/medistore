import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { BillingService } from '../../../core/services/billing.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { ReorderService } from '../../../core/services/reorder.service';
import { ApiService } from '../../../core/services/api.service';
import { LoginModalComponent } from '../../auth/login-modal/login-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LoginModalComponent],
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

  showLoginModal = signal(false);

  currentUser = this.authService.currentUser;
  isOwner = this.authService.isOwner;
  isDoctor = this.authService.isDoctor;
  isCustomer = this.authService.isCustomer;

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

