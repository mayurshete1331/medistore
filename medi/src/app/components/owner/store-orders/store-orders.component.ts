import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoreOrder, OrderStatus } from '../../../core/models/order.model';

import { BillingService } from '../../../core/services/billing.service';
import { ScheduleH1Record } from '../../../core/models/bill.model';

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
  billingService = inject(BillingService);

  activeView = signal<'ORDERS' | 'SCHEDULE_H1'>('ORDERS');
  activeFilter = signal<'ALL' | 'DOCTOR' | 'CUSTOMER' | 'COD' | 'PENDING'>('ALL');
  scheduleH1Search = signal<string>('');
  selectedOrderForAudit = signal<StoreOrder | null>(null);

  orders = this.orderService.orders;
  currentUser = this.authService.currentUser;
  selectedStore = this.authService.selectedStore;

  // Statutory Schedule H & H1 Register Records
  scheduleH1Records = computed<ScheduleH1Record[]>(() => {
    const q = this.scheduleH1Search().toLowerCase().trim();
    const records: ScheduleH1Record[] = [];

    for (const inv of this.billingService.invoices()) {
      if (!inv.items) continue;
      for (const item of inv.items) {
        const med = item.medicine;
        const batch = item.selectedBatch;
        const isSchedule = med?.isScheduleH || med?.isScheduleH1 || med?.isNarcotic || inv.hasScheduleH;

        if (isSchedule) {
          records.push({
            invoiceNumber: inv.invoiceNumber,
            timestamp: inv.timestamp,
            customerName: inv.customer?.name || 'Walk-in Customer',
            customerPhone: inv.customer?.phone || 'N/A',
            doctorName: inv.customer?.doctorName || 'Dr. Registered Medical Practitioner',
            doctorRegNo: inv.customer?.doctorRegNo || 'MCI-19482-A',
            medicineName: med?.brandName || 'Ethical Medicine',
            genericName: med?.genericName || 'Pharmaceutical Formulation',
            batchNumber: batch?.batchNumber || 'BT-DEF',
            expiryDate: batch?.expiryDate || 'N/A',
            quantity: item.quantity,
            dispensedBy: inv.dispensedBy || 'Registered Pharmacist',
            scheduleType: med?.isScheduleH1 ? 'SCHEDULE_H1' : med?.isNarcotic ? 'SCHEDULE_X' : 'SCHEDULE_H'
          });
        }
      }
    }

    if (!q) return records;
    return records.filter(r => 
      r.invoiceNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.doctorName.toLowerCase().includes(q) ||
      r.medicineName.toLowerCase().includes(q) ||
      r.batchNumber.toLowerCase().includes(q)
    );
  });

  storeName = computed(() => {
    return this.currentUser()?.storeName || this.selectedStore()?.name || 'MEDICARE PHARMACY & SUPERSTORE';
  });

  storeAddress = computed(() => {
    return this.currentUser()?.storeAddress || this.selectedStore()?.address || 'Shop 4 & 5, Health Ave, Medical Sq, Mumbai - 400012';
  });

  storeDlNumber = computed(() => {
    return this.currentUser()?.storeDlNumber || this.selectedStore()?.dlNumber || '20B/10928, 21B/10929';
  });

  storeGstin = computed(() => {
    return this.currentUser()?.storeGstin || this.selectedStore()?.gstin || '27AABCM1122D1Z9';
  });

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
    const staffName = (this.currentUser()?.name || 'Pharmacist') + ' (Store Owner / Pharmacist)';
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
      const staffName = (this.currentUser()?.name || 'Pharmacist') + ' (Store Owner)';
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
