import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Batch, Medicine } from '../models/medicine.model';
import { CartItem, CustomerInfo, Invoice, PaymentMode, SaleUnitType, SalesReturnRequest, KhataPaymentRequest, ScheduleH1Record } from '../models/bill.model';
import { InventoryService } from './inventory.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private readonly INVOICE_STORAGE_KEY = 'medi_invoices_v1';
  private inventoryService = inject(InventoryService);
  private api = inject(ApiService);

  readonly cart = signal<CartItem[]>([]);
  readonly invoices = signal<Invoice[]>(this.loadInvoices());
  readonly activeInvoice = signal<Invoice | null>(null);

  constructor() {
    this.syncInvoicesFromBackend();
  }

  syncInvoicesFromBackend(): void {
    this.api.getAllInvoices().subscribe({
      next: (backendInvs) => {
        if (backendInvs && backendInvs.length > 0) {
          const mapped: Invoice[] = backendInvs.map((inv: any) => ({
            id: String(inv.id || inv.invoiceNumber),
            invoiceNumber: inv.invoiceNumber,
            timestamp: inv.timestamp || new Date().toISOString(),
            customer: {
              name: inv.customerName,
              phone: inv.customerPhone,
              email: inv.customerEmail,
              address: inv.customerAddress,
              doctorName: inv.doctorName,
              doctorRegNo: inv.doctorRegNo
            },
            items: (inv.items || []).map((item: any) => ({
              id: String(item.id || Math.random()),
              medicine: {
                id: String(item.medicineId),
                brandName: item.medicineName,
                genericName: item.genericName,
                category: 'Tablet',
                manufacturer: 'Standard',
                hsnCode: item.hsnCode || '3004',
                gstRate: Number(item.gstRate) || 12,
                packaging: 'Standard',
                unitsPerPack: 10,
                unitLabel: 'Tablet',
                rackLocation: 'Rack A-1',
                isScheduleH: false,
                isScheduleH1: false,
                isNarcotic: false,
                reorderLevel: 10,
                defaultReorderQty: 20,
                batches: [],
                totalStockPacks: 100
              },
              selectedBatch: {
                id: String(item.batchId),
                batchNumber: item.batchNumber,
                mfgDate: '2024-01',
                expiryDate: item.expiryDate || '2026-12',
                purchasePrice: Number(item.costPrice) || 50,
                mrp: Number(item.mrp) || 100,
                salePrice: Number(item.unitPrice) || 90,
                stockPacks: 100
              },
              saleType: item.saleType,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              mrp: item.mrp,
              costPrice: item.costPrice,
              discountPercent: item.discountPercent,
              gstRate: item.gstRate,
              taxAmount: item.taxAmount,
              subtotal: item.subtotal,
              total: item.total,
              isReturned: !!item.isReturned,
              returnedQuantity: Number(item.returnedQuantity || 0)
            })),
            subtotal: Number(inv.subtotal),
            totalDiscount: Number(inv.totalDiscount),
            cgst: Number(inv.cgst),
            sgst: Number(inv.sgst),
            totalTax: Number(inv.totalTax),
            roundOff: Number(inv.roundOff),
            grandTotal: Number(inv.grandTotal),
            totalCostPrice: Number(inv.totalCostPrice),
            grossProfit: Number(inv.grossProfit),
            paymentMode: inv.paymentMode,
            paymentStatus: inv.paymentStatus,
            hasScheduleH: !!inv.hasScheduleH,
            dispensedBy: inv.dispensedBy,
            isReturned: !!inv.isReturned,
            returnAmount: Number(inv.returnAmount || 0),
            returnReason: inv.returnReason,
            returnTimestamp: inv.returnTimestamp,
            creditNoteNumber: inv.creditNoteNumber
          }));
          this.invoices.set(mapped);
          this.saveInvoices(mapped);
        }
      },
      error: () => {}
    });
  }


  // Cart Calculations
  readonly cartItemsCount = computed(() => this.cart().length);

  readonly cartSubtotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.subtotal, 0);
  });

  readonly cartTotalDiscount = computed(() => {
    return this.cart().reduce((sum, item) => {
      const gross = item.quantity * item.unitPrice;
      const discount = (gross * item.discountPercent) / 100;
      return sum + discount;
    }, 0);
  });

  readonly cartTotalTax = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.taxAmount, 0);
  });

  readonly cartCgst = computed(() => +(this.cartTotalTax() / 2).toFixed(2));
  readonly cartSgst = computed(() => +(this.cartTotalTax() / 2).toFixed(2));

  readonly cartGrandTotalRaw = computed(() => {
    return this.cartSubtotal() + this.cartTotalTax();
  });

  readonly cartRoundOff = computed(() => {
    const raw = this.cartGrandTotalRaw();
    const rounded = Math.round(raw);
    return +(rounded - raw).toFixed(2);
  });

  readonly cartGrandTotal = computed(() => {
    return Math.round(this.cartGrandTotalRaw());
  });

  readonly cartHasScheduleH = computed(() => {
    return this.cart().some(item => item.medicine.isScheduleH || item.medicine.isScheduleH1 || item.medicine.isNarcotic);
  });

  private loadInvoices(): Invoice[] {
    try {
      const saved = localStorage.getItem(this.INVOICE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load invoices from storage', e);
    }
    return [];
  }

  private saveInvoices(invs: Invoice[]): void {
    this.invoices.set(invs);
    try {
      // In production, keep only the latest 20 recent invoices cached in localStorage to prevent QuotaExceededError
      const recent = invs.slice(0, 20);
      localStorage.setItem(this.INVOICE_STORAGE_KEY, JSON.stringify(recent));
    } catch (e) {
      console.warn('LocalStorage quota reached or storage disabled', e);
    }
  }

  addToCart(medicine: Medicine, batch: Batch, saleType: SaleUnitType = 'FULL_PACK', quantity: number = 1): void {
    const existingIndex = this.cart().findIndex(
      item => item.medicine.id === medicine.id && item.selectedBatch.id === batch.id && item.saleType === saleType
    );

    // Calculate effective unit price
    const unitPrice = saleType === 'FULL_PACK' 
      ? batch.salePrice 
      : +(batch.salePrice / medicine.unitsPerPack).toFixed(2);

    const costPrice = saleType === 'FULL_PACK'
      ? batch.purchasePrice
      : +(batch.purchasePrice / medicine.unitsPerPack).toFixed(2);

    if (existingIndex > -1) {
      // Increase quantity
      const updated = [...this.cart()];
      const item = updated[existingIndex];
      const newQty = item.quantity + quantity;
      updated[existingIndex] = this.recalculateCartItem({
        ...item,
        quantity: newQty
      });
      this.cart.set(updated);
    } else {
      // New cart line
      const newItem: CartItem = this.recalculateCartItem({
        id: 'ci-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        medicine,
        selectedBatch: batch,
        saleType,
        quantity,
        unitPrice,
        mrp: saleType === 'FULL_PACK' ? batch.mrp : +(batch.mrp / medicine.unitsPerPack).toFixed(2),
        costPrice,
        discountPercent: 0,
        gstRate: medicine.gstRate,
        taxAmount: 0,
        subtotal: 0,
        total: 0
      });
      this.cart.set([...this.cart(), newItem]);
    }
  }

  updateQuantity(itemId: string, newQty: number): void {
    if (newQty <= 0) {
      this.removeFromCart(itemId);
      return;
    }
    const updated = this.cart().map(item => {
      if (item.id !== itemId) return item;
      return this.recalculateCartItem({ ...item, quantity: newQty });
    });
    this.cart.set(updated);
  }

  updateDiscount(itemId: string, discountPercent: number): void {
    const safeDiscount = Math.max(0, Math.min(100, discountPercent));
    const updated = this.cart().map(item => {
      if (item.id !== itemId) return item;
      return this.recalculateCartItem({ ...item, discountPercent: safeDiscount });
    });
    this.cart.set(updated);
  }

  toggleSaleType(itemId: string): void {
    const updated = this.cart().map(item => {
      if (item.id !== itemId) return item;
      const newSaleType: SaleUnitType = item.saleType === 'FULL_PACK' ? 'LOOSE_UNIT' : 'FULL_PACK';
      const unitPrice = newSaleType === 'FULL_PACK'
        ? item.selectedBatch.salePrice
        : +(item.selectedBatch.salePrice / item.medicine.unitsPerPack).toFixed(2);

      const costPrice = newSaleType === 'FULL_PACK'
        ? item.selectedBatch.purchasePrice
        : +(item.selectedBatch.purchasePrice / item.medicine.unitsPerPack).toFixed(2);

      const mrp = newSaleType === 'FULL_PACK'
        ? item.selectedBatch.mrp
        : +(item.selectedBatch.mrp / item.medicine.unitsPerPack).toFixed(2);

      return this.recalculateCartItem({
        ...item,
        saleType: newSaleType,
        unitPrice,
        costPrice,
        mrp
      });
    });
    this.cart.set(updated);
  }

  removeFromCart(itemId: string): void {
    this.cart.set(this.cart().filter(item => item.id !== itemId));
  }

  clearCart(): void {
    this.cart.set([]);
  }

  private recalculateCartItem(item: CartItem): CartItem {
    const gross = item.quantity * item.unitPrice;
    const discountAmount = (gross * item.discountPercent) / 100;
    const total = +(gross - discountAmount).toFixed(2);
    // Reverse tax calculation for Indian Legal Metrology (MRP is inclusive of GST)
    const subtotal = item.gstRate > 0
      ? +((total * 100) / (100 + item.gstRate)).toFixed(2)
      : total;
    const taxAmount = +(total - subtotal).toFixed(2);

    return {
      ...item,
      subtotal,
      taxAmount,
      total
    };
  }

  generateInvoice(customer: CustomerInfo, paymentMode: PaymentMode): Invoice {
    // Regulatory compliance check: Schedule H/H1/Narcotics require Doctor Name and MCI Reg No
    if (this.cartHasScheduleH()) {
      if (!customer.doctorName?.trim() || !customer.doctorRegNo?.trim()) {
        throw new Error("Prescription compliance violation: Medicine is classified under Schedule H/H1/Narcotic regulations. Prescribing Doctor's Name and MCI Registration Number are mandatory under the Drugs & Cosmetics Act.");
      }
    }

    const now = new Date();
    const invNumber = 'INV-' + now.getFullYear() + '-' + String(this.invoices().length + 1).padStart(4, '0');

    // Calculate total cost price for profit calculation
    const totalCostPrice = this.cart().reduce((sum, item) => {
      return sum + (item.costPrice * item.quantity);
    }, 0);

    const grossProfit = +(this.cartSubtotal() - totalCostPrice).toFixed(2);

    const invoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: invNumber,
      timestamp: now.toISOString(),
      customer,
      items: [...this.cart()],
      subtotal: this.cartSubtotal(),
      totalDiscount: this.cartTotalDiscount(),
      cgst: this.cartCgst(),
      sgst: this.cartSgst(),
      totalTax: this.cartTotalTax(),
      roundOff: this.cartRoundOff(),
      grandTotal: this.cartGrandTotal(),
      totalCostPrice: +totalCostPrice.toFixed(2),
      grossProfit,
      paymentMode,
      paymentStatus: paymentMode === 'KHATA' ? 'CREDIT_KHATA' : 'PAID',
      hasScheduleH: this.cartHasScheduleH(),
      dispensedBy: 'Counter 1'
    };

    // Deduct stock from inventory with cut-strip dispensing support
    this.cart().forEach(item => {
      this.inventoryService.deductStock(
        item.medicine.id,
        item.selectedBatch.id,
        item.saleType,
        item.quantity,
        item.medicine.unitsPerPack || 1
      );
    });

    // Save invoice
    const updatedInvoices = [invoice, ...this.invoices()];
    this.saveInvoices(updatedInvoices);

    // Sync checkout with Spring Boot backend
    const checkoutReq = {
      customer: {
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        doctorName: customer.doctorName || '',
        doctorRegNo: customer.doctorRegNo || ''
      },
      customerName: customer.name || 'Walk-in Customer',
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',
      customerAddress: customer.address || '',
      doctorName: customer.doctorName || '',
      doctorRegNo: customer.doctorRegNo || '',
      paymentMode,
      dispensedBy: 'Counter 1',
      items: this.cart().map(i => {
        const medIdNum = parseInt(String(i.medicine?.id || '').replace(/\D/g, ''), 10) || null;
        const batchIdNum = parseInt(String(i.selectedBatch?.id || '').replace(/\D/g, ''), 10) || null;
        return {
          medicineId: medIdNum,
          batchId: batchIdNum,
          medicineName: i.medicine?.brandName || '',
          genericName: i.medicine?.genericName || '',
          batchNumber: i.selectedBatch?.batchNumber || '',
          expiryDate: i.selectedBatch?.expiryDate || '',
          hsnCode: i.medicine?.hsnCode || '3004',
          saleType: i.saleType || 'FULL_PACK',
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          mrp: i.mrp || 0,
          costPrice: i.costPrice || 0,
          discountPercent: i.discountPercent || 0,
          gstRate: i.gstRate || 0,
          taxAmount: i.taxAmount || 0,
          subtotal: i.subtotal || 0,
          total: i.total || 0
        };
      })
    };

    this.api.checkout(checkoutReq).subscribe({
      next: (backendInv) => {
        if (backendInv?.invoiceNumber) {
          console.log('Invoice registered in Spring Boot MySQL:', backendInv.invoiceNumber);
        }
      },
      error: (err) => {
        console.error('POS Checkout backend sync error:', err);
      }
    });

    // Set as active invoice for preview & clear cart
    this.activeInvoice.set(invoice);
    this.clearCart();

    return invoice;
  }

  /**
   * Look up all past invoices for a specific customer by phone and/or name.
   */
  getCustomerInvoices(phone: string, name?: string): Invoice[] {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const cleanName = name && name.trim().toLowerCase() !== 'walk-in customer' ? name.trim().toLowerCase() : '';

    if (!cleanPhone && !cleanName) return [];

    return this.invoices().filter(inv => {
      const invPhone = inv.customer.phone ? inv.customer.phone.replace(/\D/g, '') : '';
      const invName = inv.customer.name ? inv.customer.name.trim().toLowerCase() : '';

      // Match by phone if phone is provided and at least 4 digits
      if (cleanPhone.length >= 4 && invPhone) {
        if (invPhone.includes(cleanPhone) || cleanPhone.includes(invPhone)) {
          return true;
        }
      }

      // Match by name if provided
      if (cleanName.length >= 2 && invName) {
        if (invName.includes(cleanName) || cleanName.includes(invName)) {
          return true;
        }
      }

      return false;
    });
  }

  processSalesReturn(req: SalesReturnRequest): Observable<any> {
    return this.api.processSalesReturn(req).pipe(
      tap(() => {
        this.syncInvoicesFromBackend();
      })
    );
  }

  recordKhataPayment(req: KhataPaymentRequest): Observable<any> {
    return this.api.recordKhataPayment(req);
  }

  getScheduleH1Register(): Observable<ScheduleH1Record[]> {
    return this.api.getScheduleH1Register();
  }
}
