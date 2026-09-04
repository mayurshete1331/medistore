import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoreOrder, OrderStatus } from '../../../core/models/order.model';

@Component({
  selector: 'app-store-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './store-orders.component.html',
  styleUrls: ['./store-orders.component.scss']
})
export class StoreOrdersComponent {
  orderService = inject(OrderService);
  authService = inject(AuthService);

  activeFilter = signal<'ALL' | 'DOCTOR' | 'CUSTOMER' | 'COD' | 'PENDING'>('ALL');
  selectedOrderForAudit = signal<StoreOrder | null>(null);

  orders = this.orderService.orders;
  currentUser = this.authService.currentUser;

  filteredOrders = computed(() => {
    const f = this.activeFilter();
    return this.orders().filter(o => {
      if (f === 'DOCTOR') return o.orderType === 'DOCTOR_PRESCRIPTION' || o.orderType === 'DOCTOR_DRUG_ORDER';
      if (f === 'CUSTOMER') return o.orderType === 'CUSTOMER_ORDER';
      if (f === 'COD') return o.paymentMethod === 'COD';
      if (f === 'PENDING') return o.orderStatus === 'NEW_RECEIVED';
      return true;
    });
  });

  pendingCount = computed(() => this.orders().filter(o => o.orderStatus === 'NEW_RECEIVED').length);
  doctorCount = computed(() => this.orders().filter(o => o.placedBy.userRole === 'DOCTOR').length);
  customerCount = computed(() => this.orders().filter(o => o.placedBy.userRole === 'CUSTOMER').length);
  codCount = computed(() => this.orders().filter(o => o.paymentMethod === 'COD').length);

  advanceStatus(order: StoreOrder): void {
    const staffName = this.currentUser().name + ' (Store Owner / Pharmacist)';
    if (order.orderStatus === 'NEW_RECEIVED') {
      this.orderService.updateOrderStatus(order.id, 'PACKED', staffName, 'Verified batches and sealed packaging');
    } else if (order.orderStatus === 'PACKED') {
      this.orderService.updateOrderStatus(order.id, 'OUT_FOR_DELIVERY', staffName, 'Handed over to delivery courier');
    } else if (order.orderStatus === 'OUT_FOR_DELIVERY') {
      this.orderService.updateOrderStatus(order.id, 'COMPLETED', staffName, 'Delivered to patient, payment reconciled');
    }
  }

  cancelOrder(order: StoreOrder): void {
    const reason = prompt('Please specify cancellation reason:');
    if (reason) {
      const staffName = this.currentUser().name + ' (Store Owner)';
      this.orderService.updateOrderStatus(order.id, 'CANCELLED', staffName, reason);
    }
  }

  openAuditModal(order: StoreOrder): void {
    this.selectedOrderForAudit.set(order);
  }

  printOrderSlip(): void {
    window.print();
  }
}
