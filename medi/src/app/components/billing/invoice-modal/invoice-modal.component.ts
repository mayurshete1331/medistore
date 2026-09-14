import { Component, EventEmitter, Input, Output, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Invoice } from '../../../core/models/bill.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invoice-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-modal.component.html',
  styleUrls: ['./invoice-modal.component.scss']
})
export class InvoiceModalComponent {
  authService = inject(AuthService);

  @Input({ required: true }) invoice!: Invoice;
  @Output() closed = new EventEmitter<void>();

  currentUser = this.authService.currentUser;
  selectedStore = this.authService.selectedStore;

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

  storePhone = computed(() => {
    return this.currentUser()?.phone || this.selectedStore()?.phone || '+91 98765 43210';
  });

  printFormat = signal<'A4' | 'THERMAL_80MM'>('A4');

  setFormat(fmt: 'A4' | 'THERMAL_80MM'): void {
    this.printFormat.set(fmt);
  }

  printInvoice(): void {
    window.print();
  }

  get totalQuantity(): number {
    return this.invoice?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }
}
