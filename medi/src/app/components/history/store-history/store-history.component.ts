import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';
import { StoreHistoryLog, StoreEventType } from '../../../core/models/store-client-history.model';
import { Invoice } from '../../../core/models/bill.model';
import { AddClientModalComponent } from '../../clients/add-client-modal/add-client-modal.component';
import { InvoiceModalComponent } from '../../billing/invoice-modal/invoice-modal.component';

@Component({
  selector: 'app-store-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, AddClientModalComponent, InvoiceModalComponent],
  templateUrl: './store-history.component.html',
  styleUrls: ['./store-history.component.scss']
})
export class StoreHistoryComponent implements OnInit {
  private api = inject(ApiService);
  readonly authService = inject(AuthService);
  readonly billingService = inject(BillingService);

  readonly activeTab = signal<'SALES_REGISTER' | 'DAY_CLOSE' | 'AUDIT_LOG'>('SALES_REGISTER');

  // Sales Register State
  readonly invoiceDateFilter = signal<'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_MONTH'>('TODAY');
  readonly invoiceSearchTerm = signal<string>('');
  readonly activeReprintInvoice = signal<Invoice | null>(null);

  // Day Close (Z-Report) State
  readonly dayCloseDate = signal<string>(new Date().toISOString().split('T')[0]);

  readonly historyLogs = signal<StoreHistoryLog[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedFilter = signal<string>('ALL');
  readonly searchTerm = signal<string>('');

  // Add note modal state
  readonly showNoteModal = signal<boolean>(false);
  readonly showAddClientModal = signal<boolean>(false);
  readonly noteTitle = signal<string>('');
  readonly noteDescription = signal<string>('');
  readonly isSubmittingNote = signal<boolean>(false);

  get currentStore() {
    return this.authService.selectedStore();
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  // Filtered list
  readonly filteredLogs = computed(() => {
    let list = this.historyLogs();
    const filter = this.selectedFilter();
    const search = this.searchTerm().trim().toLowerCase();

    if (filter !== 'ALL') {
      list = list.filter(l => l.eventType === filter);
    }

    if (search) {
      list = list.filter(l =>
        (l.title && l.title.toLowerCase().includes(search)) ||
        (l.description && l.description.toLowerCase().includes(search)) ||
        (l.performedBy && l.performedBy.toLowerCase().includes(search)) ||
        (l.referenceId && l.referenceId.toLowerCase().includes(search))
      );
    }

    return list;
  });

  // KPI counters
  readonly totalEvents = computed(() => this.historyLogs().length);
  readonly totalSales = computed(() => this.historyLogs().filter(l => l.eventType === 'SALE_BILLING').length);
  readonly totalClients = computed(() => this.historyLogs().filter(l => l.eventType === 'CUSTOMER_ADDED' || l.eventType === 'DOCTOR_ADDED').length);
  readonly totalInventory = computed(() => this.historyLogs().filter(l => l.eventType === 'INVENTORY_CHANGE').length);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    const storeId = this.currentStore?.id || '1';
    this.isLoading.set(true);

    this.api.getStoreHistory(storeId).subscribe({
      next: (logs) => {
        this.historyLogs.set(logs || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load store history', err);
        this.isLoading.set(false);
      }
    });
  }

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  getEventBadgeClass(type: StoreEventType): string {
    switch (type) {
      case 'SALE_BILLING': return 'badge-sale';
      case 'CUSTOMER_ADDED': return 'badge-customer';
      case 'DOCTOR_ADDED': return 'badge-doctor';
      case 'ORDER_RECEIVED':
      case 'ORDER_STATUS': return 'badge-order';
      case 'INVENTORY_CHANGE': return 'badge-inventory';
      case 'PURCHASE_REORDER': return 'badge-reorder';
      case 'MANUAL_NOTE': return 'badge-note';
      default: return 'badge-default';
    }
  }

  getEventIcon(type: StoreEventType): string {
    switch (type) {
      case 'SALE_BILLING': return '💳';
      case 'CUSTOMER_ADDED': return '👤';
      case 'DOCTOR_ADDED': return '🩺';
      case 'ORDER_RECEIVED': return '📥';
      case 'ORDER_STATUS': return '📦';
      case 'INVENTORY_CHANGE': return '📊';
      case 'PURCHASE_REORDER': return '🛒';
      case 'MANUAL_NOTE': return '📝';
      default: return '📌';
    }
  }

  getEventLabel(type: StoreEventType): string {
    switch (type) {
      case 'SALE_BILLING': return 'Sale Counter Bill';
      case 'CUSTOMER_ADDED': return 'Customer Registered';
      case 'DOCTOR_ADDED': return 'Doctor Registered';
      case 'ORDER_RECEIVED': return 'Order Inward';
      case 'ORDER_STATUS': return 'Order Status';
      case 'INVENTORY_CHANGE': return 'Stock Adjustment';
      case 'PURCHASE_REORDER': return 'Purchase Reorder';
      case 'MANUAL_NOTE': return 'Store Note';
      default: return 'Store Activity';
    }
  }

  openNoteModal(): void {
    this.noteTitle.set('');
    this.noteDescription.set('');
    this.showNoteModal.set(true);
  }

  closeNoteModal(): void {
    this.showNoteModal.set(false);
  }

  submitNote(): void {
    if (!this.noteTitle().trim() || !this.noteDescription().trim()) return;

    const storeId = this.currentStore?.id || '1';
    this.isSubmittingNote.set(true);

    const payload = {
      title: this.noteTitle().trim(),
      description: this.noteDescription().trim(),
      performedBy: this.currentUser?.name || 'Store Owner',
      eventType: 'MANUAL_NOTE'
    };

    this.api.addStoreHistoryNote(storeId, payload).subscribe({
      next: () => {
        this.isSubmittingNote.set(false);
        this.closeNoteModal();
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to save store note', err);
        this.isSubmittingNote.set(false);
      }
    });
  }

  openAddClientModal(): void {
    this.showAddClientModal.set(true);
  }

  onClientAdded(): void {
    this.loadHistory();
  }

  // ==========================================
  // Sales Invoices Register Computations
  // ==========================================
  readonly filteredInvoices = computed(() => {
    let list = this.billingService.invoices();
    const dateFilter = this.invoiceDateFilter();
    const search = this.invoiceSearchTerm().trim().toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split('T')[0];

    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (dateFilter === 'TODAY') {
      list = list.filter(i => (i.timestamp || '').startsWith(todayStr));
    } else if (dateFilter === 'YESTERDAY') {
      list = list.filter(i => (i.timestamp || '').startsWith(yestStr));
    } else if (dateFilter === 'THIS_MONTH') {
      list = list.filter(i => (i.timestamp || '').startsWith(thisMonthStr));
    }

    if (search) {
      list = list.filter(i =>
        (i.invoiceNumber && i.invoiceNumber.toLowerCase().includes(search)) ||
        (i.customer?.name && i.customer.name.toLowerCase().includes(search)) ||
        (i.customer?.phone && i.customer.phone.toLowerCase().includes(search)) ||
        (i.customer?.doctorName && i.customer.doctorName.toLowerCase().includes(search))
      );
    }

    return list;
  });

  readonly filteredTotal = computed(() => {
    return this.filteredInvoices().reduce((s, i) => s + (i.grandTotal || 0), 0);
  });

  // ==========================================
  // Day-Close (Z-Report) Computations
  // ==========================================
  readonly dayCloseTally = computed(() => {
    const targetDate = this.dayCloseDate();
    const dayInvoices = this.billingService.invoices().filter(i => (i.timestamp || '').startsWith(targetDate));

    let cashSales = 0;
    let upiSales = 0;
    let khataCredit = 0;
    let totalTax = 0;
    let totalRefunds = 0;
    let totalGrossProfit = 0;
    let scheduleHCount = 0;

    for (const inv of dayInvoices) {
      const gTotal = inv.grandTotal || 0;
      totalTax += inv.totalTax || 0;
      totalGrossProfit += inv.grossProfit || 0;
      if (inv.hasScheduleH) scheduleHCount++;
      if (inv.isReturned) totalRefunds += inv.returnAmount || 0;

      if (inv.paymentMode === 'CASH') cashSales += gTotal;
      else if (inv.paymentMode === 'UPI') upiSales += gTotal;
      else if (inv.paymentMode === 'KHATA') khataCredit += gTotal;
      else cashSales += gTotal;
    }

    const totalRevenue = cashSales + upiSales + khataCredit;
    const netCashInDrawer = +(cashSales - totalRefunds).toFixed(2);

    return {
      billCount: dayInvoices.length,
      totalRevenue: +totalRevenue.toFixed(2),
      cashSales: +cashSales.toFixed(2),
      upiSales: +upiSales.toFixed(2),
      khataCredit: +khataCredit.toFixed(2),
      totalTax: +totalTax.toFixed(2),
      totalRefunds: +totalRefunds.toFixed(2),
      netCashInDrawer,
      totalGrossProfit: +totalGrossProfit.toFixed(2),
      scheduleHCount
    };
  });

  reprintInvoice(inv: Invoice): void {
    this.activeReprintInvoice.set(inv);
  }

  printDayCloseReport(): void {
    window.print();
  }
}
