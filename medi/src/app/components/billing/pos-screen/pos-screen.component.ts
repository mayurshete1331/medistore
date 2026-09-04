import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { BillingService } from '../../../core/services/billing.service';
import { Medicine, Batch } from '../../../core/models/medicine.model';
import { CustomerInfo, Invoice, PaymentMode, SaleUnitType } from '../../../core/models/bill.model';
import { InvoiceModalComponent } from '../invoice-modal/invoice-modal.component';
import { BarcodeScannerModalComponent } from '../../common/barcode-scanner-modal/barcode-scanner-modal.component';

@Component({
  selector: 'app-pos-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceModalComponent, BarcodeScannerModalComponent],
  templateUrl: './pos-screen.component.html',
  styleUrls: ['./pos-screen.component.scss']
})
export class PosScreenComponent {
  inventoryService = inject(InventoryService);
  billingService = inject(BillingService);

  searchQuery = signal('');
  selectedPaymentMode = signal<PaymentMode>('CASH');
  showUpiQrModal = signal(false);
  showInvoiceModal = signal(false);
  showScannerModal = signal(false);
  scanToastMessage = signal<string | null>(null);
  completedInvoice = signal<Invoice | null>(null);

  // Customer Form State
  customerName = signal('');
  customerPhone = signal('');
  doctorName = signal('');
  doctorRegNo = signal('');

  medicines = this.inventoryService.medicines;
  cart = this.billingService.cart;

  cartCount = this.billingService.cartItemsCount;
  subtotal = this.billingService.cartSubtotal;
  totalDiscount = this.billingService.cartTotalDiscount;
  cgst = this.billingService.cartCgst;
  sgst = this.billingService.cartSgst;
  totalTax = this.billingService.cartTotalTax;
  roundOff = this.billingService.cartRoundOff;
  grandTotal = this.billingService.cartGrandTotal;
  hasScheduleH = this.billingService.cartHasScheduleH;

  // Search Results
  searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return this.medicines().filter(m => 
      m.brandName.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.rackLocation.toLowerCase().includes(q)
    ).slice(0, 10);
  });

  // Hotkey listener for counter speed
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      const input = document.getElementById('pos-search-input');
      input?.focus();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.showScannerModal.set(!this.showScannerModal());
    } else if (event.key === 'F9' && this.cart().length > 0) {
      event.preventDefault();
      this.completeSale('CASH');
    } else if (event.key === 'Escape') {
      if (this.showScannerModal()) {
        this.showScannerModal.set(false);
      } else if (this.searchResults().length > 0) {
        this.searchQuery.set('');
      }
    }
  }

  onBarcodeScanned(code: string): void {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;

    // Search by barcode, batch number, or brand name
    const found = this.medicines().find(m => 
      (m.barcode && m.barcode.toLowerCase() === trimmed) ||
      m.batches.some(b => b.batchNumber.toLowerCase() === trimmed) ||
      m.brandName.toLowerCase() === trimmed
    ) || this.medicines().find(m => m.brandName.toLowerCase().includes(trimmed));

    if (found) {
      const targetBatch = found.batches.length > 0 ? found.batches[0] : null;
      if (targetBatch) {
        this.billingService.addToCart(found, targetBatch, 'FULL_PACK', 1);
        this.showToast(`✓ Scanned & Added: ${found.brandName} (Batch: ${targetBatch.batchNumber})`);
      } else {
        this.showToast(`⚠️ ${found.brandName} is Out of Stock`);
      }
    } else {
      this.showToast(`⚠️ No medicine found for barcode: ${code}`);
    }
  }

  handleSearchEnter(): void {
    const q = this.searchQuery().trim();
    if (!q) return;

    const results = this.searchResults();
    if (results.length > 0) {
      this.onSelectMedicine(results[0]);
      this.showToast(`✓ Added: ${results[0].brandName} to cart`);
    } else {
      this.onBarcodeScanned(q);
    }
    this.searchQuery.set('');
  }

  private showToast(msg: string): void {
    this.scanToastMessage.set(msg);
    setTimeout(() => {
      if (this.scanToastMessage() === msg) {
        this.scanToastMessage.set(null);
      }
    }, 3200);
  }

  onSelectMedicine(med: Medicine, batch?: Batch): void {
    const targetBatch = batch || (med.batches.length > 0 ? med.batches[0] : null);
    if (!targetBatch) return;

    this.billingService.addToCart(med, targetBatch, 'FULL_PACK', 1);
    this.searchQuery.set('');
  }

  updateQty(itemId: string, qty: number): void {
    this.billingService.updateQuantity(itemId, qty);
  }

  toggleUnit(itemId: string): void {
    this.billingService.toggleSaleType(itemId);
  }

  updateDisc(itemId: string, disc: number): void {
    this.billingService.updateDiscount(itemId, disc);
  }

  removeItem(itemId: string): void {
    this.billingService.removeFromCart(itemId);
  }

  clearCart(): void {
    this.billingService.clearCart();
  }

  setPaymentMode(mode: PaymentMode): void {
    this.selectedPaymentMode.set(mode);
    if (mode === 'UPI') {
      this.showUpiQrModal.set(true);
    }
  }

  completeSale(mode?: PaymentMode): void {
    if (this.cart().length === 0) return;

    const payment = mode || this.selectedPaymentMode();
    const customer: CustomerInfo = {
      name: this.customerName().trim() || 'Walk-in Customer',
      phone: this.customerPhone().trim(),
      doctorName: this.doctorName().trim() || (this.hasScheduleH() ? 'Consulting Doctor' : ''),
      doctorRegNo: this.doctorRegNo().trim()
    };

    const invoice = this.billingService.generateInvoice(customer, payment);
    this.completedInvoice.set(invoice);
    this.showInvoiceModal.set(true);

    // Reset customer fields
    this.customerName.set('');
    this.customerPhone.set('');
    this.doctorName.set('');
    this.doctorRegNo.set('');
    this.showUpiQrModal.set(false);
  }

  // Quick fill sample customer for rapid testing
  fillDemoCustomer(): void {
    this.customerName.set('Anand K. Joshi');
    this.customerPhone.set('+91 98200 45678');
    this.doctorName.set('Dr. S. K. Kulkarni (MBBS, MD)');
    this.doctorRegNo.set('MMC-2018/04/129');
  }
}
