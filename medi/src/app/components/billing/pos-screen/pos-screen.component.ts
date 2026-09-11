import { Component, computed, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, finalize, catchError } from 'rxjs/operators';
import { InventoryService } from '../../../core/services/inventory.service';
import { BillingService } from '../../../core/services/billing.service';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Medicine, Batch } from '../../../core/models/medicine.model';
import { CartItem, CustomerInfo, Invoice, PaymentMode } from '../../../core/models/bill.model';
import { InvoiceModalComponent } from '../invoice-modal/invoice-modal.component';
import { BarcodeScannerModalComponent } from '../../common/barcode-scanner-modal/barcode-scanner-modal.component';
import { AddMedicineModalComponent } from '../../inventory/add-medicine-modal/add-medicine-modal.component';

export interface VerifiedCustomer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  isRegistered: boolean;
  pastBillsCount?: number;
}

@Component({
  selector: 'app-pos-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceModalComponent, BarcodeScannerModalComponent, AddMedicineModalComponent],
  templateUrl: './pos-screen.component.html',
  styleUrls: ['./pos-screen.component.scss']
})
export class PosScreenComponent implements OnInit, OnDestroy {
  inventoryService = inject(InventoryService);
  billingService = inject(BillingService);
  apiService = inject(ApiService);
  authService = inject(AuthService);

  searchQuery = signal('');
  selectedPaymentMode = signal<PaymentMode>('CASH');
  showUpiQrModal = signal(false);
  showInvoiceModal = signal(false);
  showScannerModal = signal(false);
  scanToastMessage = signal<string | null>(null);
  completedInvoice = signal<Invoice | null>(null);

  // Live Medicine DB Search & Missing Medicine Addition
  private medicineSearchSubject = new Subject<string>();
  private medSearchSub?: Subscription;
  isSearchingMedicines = signal(false);
  backendMedicineResults = signal<Medicine[]>([]);
  showAddMedicineModal = signal(false);
  prefillMedicineName = signal('');

  // Customer Verification & Directory State
  storeClients = signal<any[]>([]);
  customerSearchQuery = signal('');
  showCustomerDropdown = signal(false);
  showNewCustomerForm = signal(false);
  showPastHistory = signal(false);
  isRegistering = signal(false);
  isSearchingCustomer = signal(false);
  isLoadingPastInvoices = signal(false);

  backendCustomerResults = signal<VerifiedCustomer[]>([]);
  selectedCustomer = signal<VerifiedCustomer | null>(null);

  // Past customer invoices from backend
  customerPastInvoices = signal<any[]>([]);

  private customerSearchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // New Customer Registration Inputs
  newCustomerName = signal('');
  newCustomerPhone = signal('');
  newCustomerAddress = signal('');
  newCustomerEmail = signal('');

  // Active Bill Customer Inputs
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

  // List of Schedule H/H1/Narcotic drugs currently in the cart
  scheduleHMedicinesInCart = computed(() => {
    return this.cart().filter(
      item => item.medicine.isScheduleH || item.medicine.isScheduleH1 || item.medicine.isNarcotic
    );
  });

  scheduleHNames = computed(() => {
    return this.scheduleHMedicinesInCart().map(i => i.medicine.brandName).join(', ');
  });

  // Strict Drugs & Cosmetics compliance: Bill is blocked if Schedule H item is in cart without Doctor details
  isBillingBlockedByCompliance = computed(() => {
    if (!this.hasScheduleH()) return false;
    const docName = (this.doctorName() || '').trim();
    const docReg = (this.doctorRegNo() || '').trim();
    return docName.length === 0 || docReg.length === 0;
  });

  ngOnInit(): void {
    this.loadStoreClients();
    this.setupCustomerSearch();
    this.setupMedicineSearch();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.medSearchSub?.unsubscribe();
  }

  loadStoreClients(): void {
    const storeId = this.authService.currentUser()?.storeId || '1';
    this.apiService.getStoreClients(storeId, 'CUSTOMER').subscribe({
      next: (res) => {
        if (res?.customers) {
          this.storeClients.set(res.customers);
        }
      },
      error: () => {}
    });
  }

  /**
   * Exact Match Customer Search:
   * - Phone requires full 10 digits
   * - Name requires exact full match
   */
  private setupCustomerSearch(): void {
    this.searchSub = this.customerSearchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((query) => {
        const q = (query || '').trim();
        const cleanDigits = q.replace(/\D/g, '');
        // If numeric search, do not search until 10 digits are typed for exact match
        const isNumeric = cleanDigits.length > 0 && cleanDigits === q.replace(/[\s\-\+]/g, '');
        if ((isNumeric && cleanDigits.length < 10) || (!isNumeric && q.length < 2)) {
          this.isSearchingCustomer.set(false);
          this.backendCustomerResults.set([]);
          return of([]);
        }
        this.isSearchingCustomer.set(true);
        const storeId = this.authService.currentUser()?.storeId || '1';
        return this.apiService.searchCustomer(q, storeId).pipe(
          catchError(() => of([])),
          finalize(() => this.isSearchingCustomer.set(false))
        );
      })
    ).subscribe((results: any[]) => {
      const q = this.customerSearchQuery().trim().toLowerCase();
      const cleanDigits = q.replace(/\D/g, '');
      const mapped: VerifiedCustomer[] = (results || []).map(r => ({
        id: String(r.id || r.userId || ''),
        name: r.name,
        phone: r.phone || '',
        email: r.email || '',
        address: r.address || r.customerAddress || '',
        isRegistered: r.isRegistered ?? true,
        pastBillsCount: r.pastBillsCount ?? (r.pastBills ? r.pastBills.length : 0)
      }));

      // Also merge any store clients matching EXACT criteria
      const existingPhones = new Set(mapped.map(m => (m.phone || '').replace(/\D/g, '')));
      for (const client of this.storeClients()) {
        const cPhone = (client.phone || '').replace(/\D/g, '');
        const cName = (client.name || '').trim().toLowerCase();
        // Exact/partial phone match OR name match
        const isExactPhone = cleanDigits.length >= 3 && (cPhone === cleanDigits || cPhone.includes(cleanDigits));
        const isExactName = q.length >= 2 && (cName === q || cName.includes(q));

        if ((isExactPhone || isExactName) && (!cPhone || !existingPhones.has(cPhone))) {
          if (cPhone) existingPhones.add(cPhone);
          mapped.push({
            id: String(client.id || client.userId || ''),
            name: client.name,
            phone: client.phone,
            email: client.email,
            address: client.customerAddress || client.address,
            isRegistered: true,
            pastBillsCount: 0
          });
        }
      }

      this.backendCustomerResults.set(mapped);
      if (this.customerSearchQuery().trim().length >= 2) {
        this.showCustomerDropdown.set(true);
      }
    });
  }

  /**
   * Live Debounced Medicine DB Search:
   * Queries Spring Boot MySQL API /api/medicines?query=...
   */
  private setupMedicineSearch(): void {
    this.medSearchSub = this.medicineSearchSubject.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((query) => {
        const q = (query || '').trim();
        if (q.length < 2) {
          this.isSearchingMedicines.set(false);
          this.backendMedicineResults.set([]);
          return of([]);
        }
        this.isSearchingMedicines.set(true);
        return this.apiService.getMedicines(q).pipe(
          catchError(() => of([])),
          finalize(() => this.isSearchingMedicines.set(false))
        );
      })
    ).subscribe((results: any[]) => {
      const mapped: Medicine[] = (results || []).map((m: any) => ({
        id: String(m.id || m.brandName),
        brandName: m.brandName,
        genericName: m.genericName || '',
        category: m.category || 'Tablet',
        manufacturer: m.manufacturer || '',
        hsnCode: m.hsnCode || '',
        gstRate: Number(m.gstRate) || 12,
        packaging: m.packaging || '1x10',
        unitsPerPack: Number(m.unitsPerPack) || 1,
        unitLabel: m.unitLabel || 'Unit',
        rackLocation: m.rackLocation || 'Rack A-1',
        isScheduleH: !!m.isScheduleH,
        isScheduleH1: !!m.isScheduleH1,
        isNarcotic: !!m.isNarcotic,
        reorderLevel: Number(m.reorderLevel) || 10,
        defaultReorderQty: Number(m.defaultReorderQty) || 20,
        batches: (m.batches || []).map((b: any) => ({
          id: String(b.id || b.batchNumber),
          batchNumber: b.batchNumber,
          mfgDate: b.mfgDate || '',
          expiryDate: b.expiryDate || '',
          purchasePrice: Number(b.purchasePrice) || 0,
          mrp: Number(b.mrp) || 0,
          salePrice: Number(b.salePrice) || 0,
          stockPacks: Number(b.stockPacks) || 0
        })),
        totalStockPacks: Number(m.totalStockPacks) || 0
      }));
      this.backendMedicineResults.set(mapped);
    });
  }

  // Real-time Customer Search Results
  customerSearchResults = computed(() => {
    return this.backendCustomerResults();
  });

  // Total amount spent by the selected customer
  customerTotalSpent = computed(() => {
    return this.customerPastInvoices().reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  });

  // Whether current typed customer can be saved to DB & attached
  canSaveCurrentCustomer = computed(() => {
    if (this.selectedCustomer()) return false;
    const digits = this.customerPhone().replace(/\D/g, '');
    return digits.length >= 10 && this.customerName().trim().length > 0;
  });

  // Search Results for Medicines combining DB query results and active inventory
  searchResults = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];

    const dbResults = this.backendMedicineResults();
    const seenIds = new Set<string>();
    const combined: Medicine[] = [];

    // Prioritize fresh database search results
    for (const med of dbResults) {
      seenIds.add(med.id);
      combined.push(med);
    }

    // Merge with in-memory store medicines that match
    for (const med of this.medicines()) {
      if (!seenIds.has(med.id)) {
        if (
          med.brandName.toLowerCase().includes(q) ||
          med.genericName.toLowerCase().includes(q) ||
          med.rackLocation.toLowerCase().includes(q) ||
          (med.barcode && med.barcode.toLowerCase().includes(q))
        ) {
          seenIds.add(med.id);
          combined.push(med);
        }
      }
    }

    return combined.slice(0, 15);
  });

  // Hotkey listener for counter speed
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'F2') {
      event.preventDefault();
      const input = document.getElementById('pos-search-input');
      input?.focus();
    } else if (event.key === 'F3') {
      event.preventDefault();
      const custInput = document.getElementById('pos-customer-search-input');
      custInput?.focus();
    } else if (event.key === 'F4') {
      event.preventDefault();
      this.showScannerModal.set(!this.showScannerModal());
    } else if (event.key === 'F9' && this.cart().length > 0) {
      event.preventDefault();
      if (this.isBillingBlockedByCompliance()) {
        const offending = this.scheduleHMedicinesInCart()[0]?.medicine?.brandName || 'Schedule H Medicine';
        this.showToast(`⛔ Billing Blocked (F9): Prescribing Doctor Name & MCI Reg. No. are mandatory for '${offending}'.`);
        const input = document.getElementById('pos-doctor-name-input') || document.getElementById('pos-doctor-reg-input');
        input?.focus();
        return;
      }
      this.completeSale('CASH');
    } else if (event.key === 'Escape') {
      if (this.showScannerModal()) {
        this.showScannerModal.set(false);
      } else if (this.showCustomerDropdown()) {
        this.showCustomerDropdown.set(false);
      } else if (this.searchResults().length > 0) {
        this.searchQuery.set('');
      }
    }
  }

  // ==========================================
  // Medicine Search & Management Methods
  // ==========================================
  onMedicineSearchInput(query: string): void {
    this.searchQuery.set(query);
    this.medicineSearchSubject.next(query);
  }

  openAddMedicineModal(prefillName?: string): void {
    this.prefillMedicineName.set(prefillName || this.searchQuery().trim());
    this.showAddMedicineModal.set(true);
  }

  onMedicineAdded(newMed: Medicine): void {
    this.showAddMedicineModal.set(false);
    // Refresh inventory and sync
    this.inventoryService.syncWithBackend();

    // Auto-select or add to cart if batches available
    if (newMed && newMed.batches && newMed.batches.length > 0) {
      this.onSelectMedicine(newMed, newMed.batches[0]);
      this.showToast(`✅ Added "${newMed.brandName}" to active bill!`);
    } else {
      this.showToast(`✅ "${newMed.brandName}" registered in Database!`);
    }
  }

  // ==========================================
  // Customer Workflow Methods
  // ==========================================
  onCustomerSearchInput(query: string): void {
    this.customerSearchQuery.set(query);
    const digits = query.replace(/\D/g, '');
    const isNumeric = digits.length > 0 && digits === query.replace(/[\s\-\+]/g, '');

    // For numeric queries, require exact 10 digits before displaying dropdown
    if (isNumeric) {
      if (digits.length < 10) {
        this.showCustomerDropdown.set(false);
        this.backendCustomerResults.set([]);
      } else {
        this.showCustomerDropdown.set(true);
      }
    } else {
      if (!query || query.trim().length < 2) {
        this.showCustomerDropdown.set(false);
        this.backendCustomerResults.set([]);
      } else {
        this.showCustomerDropdown.set(true);
      }
    }
    this.customerSearchSubject.next(query);
  }

  onCustomerNameInput(name: string): void {
    this.customerName.set(name);
  }

  onCustomerPhoneInput(phone: string): void {
    this.customerPhone.set(phone);
    const digits = phone.replace(/\D/g, '');
    // Exact match trigger: when full 10-digit number is typed
    if (!this.selectedCustomer() && digits.length === 10) {
      this.customerSearchQuery.set(phone);
      this.showCustomerDropdown.set(true);
      this.customerSearchSubject.next(phone);
    }
  }

  saveCurrentCustomerToDb(): void {
    const name = this.customerName().trim();
    const phone = this.customerPhone().trim();
    const digits = phone.replace(/\D/g, '');

    if (!name) {
      this.showToast('⚠️ Please enter customer name first');
      return;
    }
    if (digits.length < 10) {
      this.showToast('⚠️ Please enter a valid 10-digit mobile number');
      return;
    }

    this.isRegistering.set(true);
    const storeId = this.authService.currentUser()?.storeId || '1';
    this.apiService.addStoreCustomer(storeId, {
      name,
      phone,
      address: '',
      email: '',
      addedBy: this.authService.currentUser()?.name || 'Counter Pharmacist'
    }).subscribe({
      next: (res) => {
        this.isRegistering.set(false);
        const created: VerifiedCustomer = {
          id: String(res.id || ''),
          name,
          phone,
          isRegistered: true,
          pastBillsCount: 0
        };
        this.storeClients.update(list => [created, ...list]);
        this.selectCustomer(created);
        this.showToast(`✅ Customer "${name}" registered in Database & attached!`);
      },
      error: () => {
        this.isRegistering.set(false);
        const created: VerifiedCustomer = {
          name,
          phone,
          isRegistered: true,
          pastBillsCount: 0
        };
        this.selectCustomer(created);
        this.showToast(`✅ Customer "${name}" attached to bill!`);
      }
    });
  }

  selectCustomer(cust: VerifiedCustomer): void {
    this.selectedCustomer.set(cust);
    this.customerName.set(cust.name);
    this.customerPhone.set(cust.phone || '');
    this.customerSearchQuery.set('');
    this.showCustomerDropdown.set(false);
    this.showNewCustomerForm.set(false);

    // Live API call to fetch customer's past invoices & purchased medicines from DB
    this.isLoadingPastInvoices.set(true);
    this.apiService.getCustomerPastInvoices(cust.phone, cust.name).subscribe({
      next: (invoices: any[]) => {
        this.isLoadingPastInvoices.set(false);
        const invList = (invoices && invoices.length > 0)
          ? invoices
          : this.billingService.getCustomerInvoices(cust.phone, cust.name);

        this.customerPastInvoices.set(invList);
        if (invList.length > 0) {
          this.showPastHistory.set(true);
          const latest = invList[0];
          const docName = latest.doctorName || latest.customer?.doctorName;
          const docReg = latest.doctorRegNo || latest.customer?.doctorRegNo;
          if (docName && !this.doctorName()) {
            this.doctorName.set(docName);
          }
          if (docReg && !this.doctorRegNo()) {
            this.doctorRegNo.set(docReg);
          }
          this.showToast(`✓ Verified Customer: ${cust.name} (${invList.length} past visit${invList.length > 1 ? 's' : ''})`);
        } else {
          this.showPastHistory.set(false);
          this.showToast(`✓ Selected Customer: ${cust.name}`);
        }
      },
      error: () => {
        this.isLoadingPastInvoices.set(false);
        const past = this.billingService.getCustomerInvoices(cust.phone, cust.name);
        this.customerPastInvoices.set(past);
        this.showToast(`✓ Selected Customer: ${cust.name}`);
      }
    });
  }

  openNewCustomerForm(): void {
    const q = this.customerSearchQuery().trim();
    const digits = q.replace(/\D/g, '');
    if (digits.length >= 5) {
      this.newCustomerPhone.set(q);
      this.newCustomerName.set('');
    } else {
      this.newCustomerName.set(q);
      this.newCustomerPhone.set('');
    }
    this.newCustomerAddress.set('');
    this.newCustomerEmail.set('');
    this.showNewCustomerForm.set(true);
    this.showCustomerDropdown.set(false);
  }

  cancelNewCustomerForm(): void {
    this.showNewCustomerForm.set(false);
  }

  registerNewCustomer(): void {
    const name = this.newCustomerName().trim();
    const phone = this.newCustomerPhone().trim();
    const address = this.newCustomerAddress().trim();
    const email = this.newCustomerEmail().trim();

    if (!name) {
      this.showToast('⚠️ Please enter customer name');
      return;
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      this.showToast('⚠️ Please enter a valid 10-digit mobile number');
      return;
    }

    this.isRegistering.set(true);
    const storeId = this.authService.currentUser()?.storeId || '1';

    this.apiService.addStoreCustomer(storeId, {
      name,
      phone,
      address,
      email,
      addedBy: this.authService.currentUser()?.name || 'Counter Pharmacist'
    }).subscribe({
      next: (res) => {
        this.isRegistering.set(false);
        const created: VerifiedCustomer = {
          id: String(res.id),
          name,
          phone,
          address,
          email,
          isRegistered: true,
          pastBillsCount: 0
        };
        this.storeClients.update(list => [created, ...list]);
        this.selectCustomer(created);
        this.showToast(`✅ Customer ${name} registered & attached to bill!`);
      },
      error: () => {
        this.isRegistering.set(false);
        // Resilient fallback: attach to bill even if backend is offline
        const created: VerifiedCustomer = {
          name,
          phone,
          address,
          email,
          isRegistered: true,
          pastBillsCount: 0
        };
        this.selectCustomer(created);
        this.showToast(`✅ Customer ${name} attached to active bill!`);
      }
    });
  }

  detachCustomer(): void {
    this.selectedCustomer.set(null);
    this.customerName.set('');
    this.customerPhone.set('');
    this.customerPastInvoices.set([]);
    this.showPastHistory.set(false);
    this.showToast('Customer detached. Active counter in Walk-in mode.');
  }

  togglePastHistory(): void {
    this.showPastHistory.update(v => !v);
  }

  addPastMedicineToCart(item: any): void {
    const medName = item.medicineName || item.medicine?.brandName || '';
    const medId = item.medicineId || item.medicine?.id;

    const found = this.medicines().find(m => 
      (medId && m.id === medId) ||
      (medName && m.brandName.toLowerCase() === medName.toLowerCase())
    ) || this.medicines().find(m => medName && m.brandName.toLowerCase().includes(medName.toLowerCase()));

    if (!found) {
      this.showToast(`⚠️ Medicine "${medName}" not found in current inventory.`);
      return;
    }

    const targetBatch = found.batches.find(b => b.stockPacks > 0) || (found.batches.length > 0 ? found.batches[0] : null);
    if (!targetBatch) {
      this.showToast(`⚠️ ${found.brandName} is currently Out of Stock.`);
      return;
    }

    const qty = item.quantity || 1;
    const saleType = item.saleType || 'FULL_PACK';
    this.billingService.addToCart(found, targetBatch, saleType, qty);
    this.showToast(`✓ Added repeat: ${found.brandName} (${qty} ${saleType === 'FULL_PACK' ? 'pack' : 'loose'})`);
  }

  repeatEntireInvoice(inv: any): void {
    let addedCount = 0;
    const items = inv.items || [];
    for (const item of items) {
      const medName = item.medicineName || item.medicine?.brandName || '';
      const medId = item.medicineId || item.medicine?.id;
      const found = this.medicines().find(m => 
        (medId && m.id === medId) ||
        (medName && m.brandName.toLowerCase() === medName.toLowerCase())
      ) || this.medicines().find(m => medName && m.brandName.toLowerCase().includes(medName.toLowerCase()));

      if (found) {
        const batch = found.batches.find(b => b.stockPacks > 0) || (found.batches.length > 0 ? found.batches[0] : null);
        if (batch) {
          this.billingService.addToCart(found, batch, item.saleType || 'FULL_PACK', item.quantity || 1);
          addedCount++;
        }
      }
    }
    if (addedCount > 0) {
      this.showToast(`✓ Re-added ${addedCount} medicine(s) from Bill #${inv.invoiceNumber} to current cart`);
    } else {
      this.showToast(`⚠️ Could not re-add medicines from bill #${inv.invoiceNumber}`);
    }
  }

  // ==========================================
  // Barcode & Medicine Search
  // ==========================================
  onBarcodeScanned(code: string): void {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;

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
      if (this.isBillingBlockedByCompliance()) {
        const offending = this.scheduleHMedicinesInCart()[0]?.medicine?.brandName || 'Schedule H Medicine';
        this.showToast(`⛔ Doctor Details Required: Enter Doctor Name & MCI Reg. No. for '${offending}' before UPI payment.`);
        const input = document.getElementById('pos-doctor-name-input') || document.getElementById('pos-doctor-reg-input');
        input?.focus();
        return;
      }
      this.showUpiQrModal.set(true);
    }
  }

  completeSale(mode?: PaymentMode): void {
    if (this.cart().length === 0) return;

    // STRICT DRUGS & COSMETICS ACT PHARMACY COMPLIANCE:
    // If cart has Schedule H/H1/Narcotic drugs, Prescribing Doctor Name & MCI Reg. No. are MANDATORY.
    if (this.hasScheduleH()) {
      const docName = (this.doctorName() || '').trim();
      const docReg = (this.doctorRegNo() || '').trim();

      if (!docName || !docReg) {
        const offending = this.scheduleHMedicinesInCart()[0]?.medicine?.brandName || 'Schedule H Medicine';
        this.showToast(`⛔ BILLING BLOCKED: '${offending}' is classified under Schedule H/H1 regulations. Prescribing Doctor Name & MCI Reg. No. are mandatory under Drugs & Cosmetics Act.`);

        setTimeout(() => {
          if (!docName) {
            const input = document.getElementById('pos-doctor-name-input');
            input?.focus();
          } else {
            const regInput = document.getElementById('pos-doctor-reg-input');
            regInput?.focus();
          }
        }, 100);

        return; // STRICTLY DO NOT ALLOW FOR BILL
      }
    }

    const payment = mode || this.selectedPaymentMode();
    const customer: CustomerInfo = {
      name: this.customerName().trim() || 'Walk-in Customer',
      phone: this.customerPhone().trim(),
      doctorName: this.doctorName().trim(),
      doctorRegNo: this.doctorRegNo().trim()
    };

    try {
      const invoice = this.billingService.generateInvoice(customer, payment);
      this.completedInvoice.set(invoice);
      this.showInvoiceModal.set(true);
      this.showUpiQrModal.set(false);
    } catch (err: any) {
      this.showToast('⛔ Billing Failed: ' + (err.message || 'Compliance Violation'));
    }
  }
}
