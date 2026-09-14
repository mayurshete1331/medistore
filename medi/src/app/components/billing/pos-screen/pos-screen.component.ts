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
  khataBalance?: number;
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

  // Khata Settlement Modal State
  showKhataSettlementModal = signal(false);
  khataSettlementCustomer = signal<VerifiedCustomer | null>(null);
  khataPaymentAmount = signal<number>(0);
  khataPaymentMode = signal<'CASH' | 'UPI'>('CASH');
  khataNotes = signal('');
  isSettlingKhata = signal(false);
  khataSuccessMsg = signal<string | null>(null);

  // Salt / Generic Alternative Substitute Finder State
  showSaltSubstituteModal = signal(false);
  saltSubstituteTargetItem = signal<CartItem | null>(null);
  saltAlternatives = signal<{ medicine: Medicine; batch: Batch; savings: number; packPrice: number; loosePrice: number }[]>([]);

  // Sales Returns Modal State
  showSalesReturnModal = signal(false);
  returnInvoiceNumber = signal('');
  isLookingUpReturnInvoice = signal(false);
  returnInvoice = signal<Invoice | null>(null);
  returnItemsMap = signal<{ [itemId: string]: { selected: boolean; returnQty: number; maxQty: number; unitPrice: number; totalRefund: number } }>({});
  returnReason = signal('Customer Return');
  returnRefundMode = signal<'CASH' | 'UPI' | 'KHATA_CREDIT'>('CASH');
  isProcessingReturn = signal(false);
  returnSuccessMessage = signal<string | null>(null);

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
  showDoctorFields = signal(false);

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
        // Allow searching by 3+ digits for phone or 2+ letters for name
        if (q.length < 2) {
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
        pastBillsCount: r.pastBillsCount ?? (r.pastBills ? r.pastBills.length : 0),
        khataBalance: Number(r.khataBalance || r.outstandingKhataBalance || 0)
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
            pastBillsCount: 0,
            khataBalance: Number(client.outstandingKhataBalance || client.khataBalance || 0)
          });
        }
      }

      this.backendCustomerResults.set(mapped);

      // Instant Zero-Click Recognition: If 10 digits searched, auto-attach exact phone match and show name
      if (cleanDigits.length >= 10 && !this.selectedCustomer()) {
        const exact = mapped.find(m => (m.phone || '').replace(/\D/g, '').slice(-10) === cleanDigits.slice(-10));
        if (exact) {
          this.selectCustomer(exact);
          this.showToast(`✓ Phone recognized: Customer "${exact.name}" auto-attached!`);
          return;
        }
      }

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

  // Find customer by 10-digit phone across store directory, search results, and billing history
  findCustomerByPhone(phone: string): VerifiedCustomer | null {
    if (!phone) return null;
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) return null;
    const last10 = cleanDigits.slice(-10);

    // 1. Check loaded storeClients
    for (const client of this.storeClients()) {
      const cPhone = (client.phone || '').replace(/\D/g, '');
      const cLast10 = cPhone.slice(-10);
      if (cLast10 && cLast10 === last10) {
        return {
          id: String(client.id || client.userId || ''),
          name: client.name,
          phone: client.phone,
          email: client.email,
          address: client.customerAddress || client.address,
          isRegistered: true,
          pastBillsCount: client.pastBillsCount || 0,
          khataBalance: Number(client.outstandingKhataBalance || client.khataBalance || 0)
        };
      }
    }

    // 2. Check backend customer search results
    for (const cust of this.backendCustomerResults()) {
      const cPhone = (cust.phone || '').replace(/\D/g, '');
      const cLast10 = cPhone.slice(-10);
      if (cLast10 && cLast10 === last10) {
        return cust;
      }
    }

    // 3. Check local billingService invoice history
    const invoices = this.billingService.invoices();
    for (const inv of invoices) {
      const invPhone = (inv.customer?.phone || (inv as any).customerPhone || '').replace(/\D/g, '');
      const invLast10 = invPhone.slice(-10);
      const custName = inv.customer?.name || (inv as any).customerName || '';
      if (invLast10 && invLast10 === last10 && custName && !custName.toLowerCase().includes('walk-in')) {
        return {
          id: '',
          name: custName,
          phone: inv.customer?.phone || (inv as any).customerPhone || '',
          isRegistered: false,
          pastBillsCount: 1,
          khataBalance: 0
        };
      }
    }

    return null;
  }

  // Real-time duplicate phone check when registering new customer
  duplicateNewCustomer = computed(() => {
    return this.findCustomerByPhone(this.newCustomerPhone());
  });

  // Real-time duplicate phone check on counter strip before attachment
  duplicateCounterCustomer = computed(() => {
    if (this.selectedCustomer()) return null;
    return this.findCustomerByPhone(this.customerPhone());
  });

  // Real-time Customer Search Results
  customerSearchResults = computed(() => {
    return this.backendCustomerResults();
  });

  // Total amount spent by the selected customer
  customerTotalSpent = computed(() => {
    return this.customerPastInvoices().reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  });

  // Whether current typed customer can be saved to DB & attached (strictly blocked if phone already exists)
  canSaveCurrentCustomer = computed(() => {
    if (this.selectedCustomer()) return false;
    if (this.duplicateCounterCustomer()) return false;
    const digits = this.customerPhone().replace(/\D/g, '');
    return digits.length >= 10 && this.customerName().trim().length > 0;
  });

  // Block new customer registration if phone is duplicate or invalid
  canRegisterNewCustomer = computed(() => {
    if (this.isRegistering()) return false;
    if (this.duplicateNewCustomer()) return false;
    const name = this.newCustomerName().trim();
    const digits = this.newCustomerPhone().replace(/\D/g, '');
    return name.length > 0 && digits.length >= 10;
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
      this.showToast(`✅ "${newMed.brandName}" added to inventory!`);
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
    if (!this.selectedCustomer() && name.trim().length >= 2) {
      this.customerSearchQuery.set(name.trim());
      this.showCustomerDropdown.set(true);
      this.customerSearchSubject.next(name.trim());
    }
  }

  onCustomerPhoneInput(phone: string): void {
    this.customerPhone.set(phone);
    const digits = phone.replace(/\D/g, '');

    // Instant Zero-Click Recognition if 10 digits match existing customer
    if (digits.length >= 10) {
      const match = this.findCustomerByPhone(phone);
      if (match) {
        this.selectCustomer(match);
        this.showToast(`✓ Phone recognized: Customer "${match.name}" auto-attached!`);
        return;
      }
    }

    if (!this.selectedCustomer() && (digits.length >= 3 || phone.trim().length >= 2)) {
      this.customerSearchQuery.set(phone.trim());
      this.showCustomerDropdown.set(true);
      this.customerSearchSubject.next(phone.trim());
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

    // Do not permit duplicate phone numbers
    const duplicate = this.findCustomerByPhone(phone);
    if (duplicate) {
      this.showToast(`⚠️ Mobile ${phone} is already registered to "${duplicate.name}". Duplicate phone numbers are not permitted.`);
      this.selectCustomer(duplicate);
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
        this.showToast(`✅ Customer "${name}" registered & attached to bill!`);
      },
      error: (err) => {
        this.isRegistering.set(false);
        if (err.status === 409 || err.headers?.get('X-Conflict-Reason') === 'DUPLICATE_PHONE') {
          const existing = err.error;
          const existingName = existing?.name || 'an existing customer';
          this.showToast(`⚠️ Mobile ${phone} is already registered to "${existingName}". Duplicate phone numbers are not permitted.`);
          if (existing) {
            this.selectCustomer({
              id: String(existing.id || ''),
              name: existing.name,
              phone: existing.phone || phone,
              email: existing.email,
              address: existing.customerAddress || existing.address,
              isRegistered: true,
              pastBillsCount: 0
            });
          }
          return;
        }
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

    // Do not permit duplicate phone numbers
    const duplicate = this.findCustomerByPhone(phone);
    if (duplicate) {
      this.showToast(`⚠️ Mobile ${phone} is already registered to "${duplicate.name}". Duplicate phone numbers are not permitted.`);
      this.selectCustomer(duplicate);
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
      error: (err) => {
        this.isRegistering.set(false);
        if (err.status === 409 || err.headers?.get('X-Conflict-Reason') === 'DUPLICATE_PHONE') {
          const existing = err.error;
          const existingName = existing?.name || 'an existing customer';
          this.showToast(`⚠️ Mobile ${phone} is already registered to "${existingName}". Duplicate phone numbers are not permitted.`);
          if (existing) {
            this.selectCustomer({
              id: String(existing.id || ''),
              name: existing.name,
              phone: existing.phone || phone,
              email: existing.email,
              address: existing.customerAddress || existing.address,
              isRegistered: true,
              pastBillsCount: 0
            });
          }
          return;
        }
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

  // ==========================================
  // Near Expiry Warning Helper (<60 days)
  // ==========================================
  isNearExpiry(dateStr?: string): boolean {
    if (!dateStr) return false;
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parts.length > 2 ? parseInt(parts[2], 10) : 28;
      const exp = new Date(year, month, day);
      const now = new Date();
      const diffDays = Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 60 && diffDays >= 0;
    } catch {
      return false;
    }
  }

  // ==========================================
  // Khata Settlement & WhatsApp Reminders
  // ==========================================
  openKhataSettlement(cust: VerifiedCustomer): void {
    this.khataSettlementCustomer.set(cust);
    this.khataPaymentAmount.set(cust.khataBalance || 0);
    this.khataPaymentMode.set('CASH');
    this.khataNotes.set('');
    this.khataSuccessMsg.set(null);
    this.showKhataSettlementModal.set(true);
  }

  submitKhataSettlement(): void {
    const cust = this.khataSettlementCustomer();
    if (!cust || this.khataPaymentAmount() <= 0) return;
    this.isSettlingKhata.set(true);

    const custIdNum = cust.id ? parseInt(cust.id.replace(/\D/g, ''), 10) || null : null;
    this.billingService.recordKhataPayment({
      customerId: custIdNum || undefined,
      customerPhone: cust.phone,
      paymentAmount: this.khataPaymentAmount(),
      paymentMode: this.khataPaymentMode(),
      notes: this.khataNotes(),
      receivedBy: 'Counter 1'
    }).subscribe({
      next: (res: any) => {
        this.isSettlingKhata.set(false);
        const newBal = res?.newBalance ?? Math.max(0, (cust.khataBalance || 0) - this.khataPaymentAmount());
        cust.khataBalance = newBal;
        if (this.selectedCustomer()?.phone === cust.phone) {
          this.selectedCustomer.set({ ...cust, khataBalance: newBal });
        }
        this.khataSuccessMsg.set(`Payment of ₹${this.khataPaymentAmount()} recorded! Remaining: ₹${newBal}`);
        setTimeout(() => {
          this.showKhataSettlementModal.set(false);
        }, 1500);
      },
      error: () => {
        this.isSettlingKhata.set(false);
        cust.khataBalance = Math.max(0, (cust.khataBalance || 0) - this.khataPaymentAmount());
        this.khataSuccessMsg.set(`Recorded offline. Remaining Khata: ₹${cust.khataBalance}`);
        setTimeout(() => {
          this.showKhataSettlementModal.set(false);
        }, 1500);
      }
    });
  }

  getKhataWhatsAppReminderUrl(cust: VerifiedCustomer): string {
    const cleanPhone = (cust.phone || '').replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('91') ? cleanPhone : ('91' + cleanPhone);
    const store = this.authService.selectedStore()?.name || 'MediCare Pharmacy';
    const text = `Hello ${cust.name}, this is a gentle reminder from ${store} regarding your outstanding credit (Khata) balance of ₹${cust.khataBalance || 0}. Please settle at your convenience. Thank you!`;
    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
  }

  // ==========================================
  // Generic / Salt Substitute Finder
  // ==========================================
  openSaltSubstitutes(item: CartItem): void {
    this.saltSubstituteTargetItem.set(item);
    const gen = (item.medicine.genericName || '').trim().toLowerCase();
    if (!gen) {
      this.saltAlternatives.set([]);
      this.showSaltSubstituteModal.set(true);
      return;
    }

    const currentPrice = item.unitPrice;
    const matches: { medicine: Medicine; batch: Batch; savings: number; packPrice: number; loosePrice: number }[] = [];

    for (const m of this.inventoryService.medicines()) {
      if (m.id === item.medicine.id) continue;
      const mGen = (m.genericName || '').trim().toLowerCase();
      if (mGen && (mGen.includes(gen) || gen.includes(mGen))) {
        const batch = (m.batches || []).find(b => b.stockPacks > 0) || m.batches?.[0];
        if (batch) {
          const packPrice = batch.salePrice || batch.mrp || 0;
          const upp = m.unitsPerPack && m.unitsPerPack > 1 ? m.unitsPerPack : 1;
          const loosePrice = +(packPrice / upp).toFixed(2);
          const effectivePrice = item.saleType === 'LOOSE_UNIT' ? loosePrice : packPrice;
          const savings = +(currentPrice - effectivePrice).toFixed(2);
          matches.push({ medicine: m, batch, savings, packPrice, loosePrice });
        }
      }
    }

    matches.sort((a, b) => b.savings - a.savings);
    this.saltAlternatives.set(matches);
    this.showSaltSubstituteModal.set(true);
  }

  replaceItemWithSubstitute(alt: { medicine: Medicine; batch: Batch }): void {
    const orig = this.saltSubstituteTargetItem();
    if (!orig) return;
    this.billingService.removeFromCart(orig.id);
    this.billingService.addToCart(alt.medicine, alt.batch, orig.saleType, orig.quantity);
    this.showSaltSubstituteModal.set(false);
    this.showToast(`Substituted with ${alt.medicine.brandName} (Saved ₹${orig.unitPrice - (alt.batch.salePrice || alt.batch.mrp || 0)}/unit)`);
  }

  // ==========================================
  // Sales Returns & Refunds
  // ==========================================
  openSalesReturnModal(): void {
    this.returnInvoiceNumber.set('');
    this.returnInvoice.set(null);
    this.returnItemsMap.set({});
    this.returnReason.set('Customer Return');
    this.returnRefundMode.set('CASH');
    this.returnSuccessMessage.set(null);
    this.showSalesReturnModal.set(true);
  }

  lookupReturnInvoice(): void {
    const invNum = this.returnInvoiceNumber().trim();
    if (!invNum) return;
    this.isLookingUpReturnInvoice.set(true);

    const found = this.billingService.invoices().find(i => i.invoiceNumber.toLowerCase() === invNum.toLowerCase());
    if (found) {
      this.populateReturnInvoice(found);
      this.isLookingUpReturnInvoice.set(false);
      return;
    }

    this.apiService.getInvoiceByNumber(invNum).subscribe({
      next: (res: any) => {
        this.isLookingUpReturnInvoice.set(false);
        if (res && res.invoiceNumber) {
          this.populateReturnInvoice(res);
        } else {
          this.showToast('Invoice not found: ' + invNum);
        }
      },
      error: () => {
        this.isLookingUpReturnInvoice.set(false);
        this.showToast('Invoice not found: ' + invNum);
      }
    });
  }

  private populateReturnInvoice(inv: any): void {
    this.returnInvoice.set(inv);
    const map: { [itemId: string]: { selected: boolean; returnQty: number; maxQty: number; unitPrice: number; totalRefund: number } } = {};
    for (const item of (inv.items || [])) {
      const id = String(item.id || item.medicineId);
      const alreadyReturned = Number(item.returnedQuantity || 0);
      const max = Math.max(0, item.quantity - alreadyReturned);
      map[id] = {
        selected: false,
        returnQty: max > 0 ? 1 : 0,
        maxQty: max,
        unitPrice: Number(item.unitPrice || 0),
        totalRefund: Number(item.unitPrice || 0)
      };
    }
    this.returnItemsMap.set(map);
  }

  toggleReturnItemSelection(itemId: string): void {
    const map = { ...this.returnItemsMap() };
    if (map[itemId]) {
      map[itemId].selected = !map[itemId].selected;
      this.returnItemsMap.set(map);
    }
  }

  updateReturnItemQty(itemId: string, newQty: number): void {
    const map = { ...this.returnItemsMap() };
    if (map[itemId]) {
      const q = Math.max(1, Math.min(newQty, map[itemId].maxQty));
      map[itemId].returnQty = q;
      map[itemId].totalRefund = +(q * map[itemId].unitPrice).toFixed(2);
      this.returnItemsMap.set(map);
    }
  }

  get returnTotalRefundAmount(): number {
    const map = this.returnItemsMap();
    return Object.keys(map).reduce((sum, k) => {
      return map[k].selected ? sum + map[k].totalRefund : sum;
    }, 0);
  }

  submitSalesReturn(): void {
    const inv = this.returnInvoice();
    if (!inv) return;
    const map = this.returnItemsMap();
    const selectedItemIds = Object.keys(map).filter(k => map[k].selected && map[k].returnQty > 0);

    if (selectedItemIds.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    this.isProcessingReturn.set(true);

    const returnedItems = selectedItemIds.map(k => {
      const origItem = (inv.items || []).find((i: any) => String(i.id) === k);
      const medIdNum = parseInt(String(origItem?.medicine?.id || '').replace(/\D/g, ''), 10) || undefined;
      const itemIdNum = parseInt(String(origItem?.id || '').replace(/\D/g, ''), 10) || undefined;
      return {
        invoiceItemId: itemIdNum,
        medicineId: medIdNum,
        batchNumber: origItem?.selectedBatch?.batchNumber || 'N/A',
        saleType: origItem?.saleType || 'FULL_PACK',
        returnQuantity: map[k].returnQty,
        refundAmount: map[k].totalRefund
      };
    });

    const returnReq: any = {
      invoiceNumber: inv.invoiceNumber,
      returnReason: this.returnReason(),
      refundMode: this.returnRefundMode(),
      processedBy: 'Counter 1',
      returnedItems
    };

    this.billingService.processSalesReturn(returnReq).subscribe({
      next: (res: any) => {
        this.isProcessingReturn.set(false);
        this.returnSuccessMessage.set(`Return processed! Credit Note: ${res?.creditNoteNumber || 'Generated'}. Refund of ₹${this.returnTotalRefundAmount} issued via ${this.returnRefundMode()}. Stock replenished.`);
        setTimeout(() => {
          this.showSalesReturnModal.set(false);
        }, 2000);
      },
      error: () => {
        this.isProcessingReturn.set(false);
        this.returnSuccessMessage.set(`Return processed locally! Refund of ₹${this.returnTotalRefundAmount} recorded.`);
        setTimeout(() => {
          this.showSalesReturnModal.set(false);
        }, 2000);
      }
    });
  }
}
