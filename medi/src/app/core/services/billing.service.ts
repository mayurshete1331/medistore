import { Injectable, signal, computed, inject } from '@angular/core';
import { Batch, Medicine } from '../models/medicine.model';
import { CartItem, CustomerInfo, Invoice, PaymentMode, SaleUnitType } from '../models/bill.model';
import { InventoryService } from './inventory.service';
import { ApiService } from './api.service';
import { INITIAL_INVOICES } from '../data/initial-data';

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
              total: item.total
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
            dispensedBy: inv.dispensedBy
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
    return INITIAL_INVOICES;
  }

  private saveInvoices(invs: Invoice[]): void {
    this.invoices.set(invs);
    try {
      localStorage.setItem(this.INVOICE_STORAGE_KEY, JSON.stringify(invs));
    } catch (e) {
      console.error('Failed to save invoices to storage', e);
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
    const subtotal = +(gross - discountAmount).toFixed(2);
    const taxAmount = +((subtotal * item.gstRate) / 100).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    return {
      ...item,
      subtotal,
      taxAmount,
      total
    };
  }

  generateInvoice(customer: CustomerInfo, paymentMode: PaymentMode): Invoice {
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

    // Deduct stock from inventory
    this.cart().forEach(item => {
      const packsDeducted = item.saleType === 'FULL_PACK'
        ? item.quantity
        : +(item.quantity / item.medicine.unitsPerPack).toFixed(2);

      this.inventoryService.deductStock(item.medicine.id, item.selectedBatch.id, packsDeducted);
    });

    // Save invoice
    const updatedInvoices = [invoice, ...this.invoices()];
    this.saveInvoices(updatedInvoices);

    // Sync checkout with Spring Boot backend
    const checkoutReq = {
      customerName: customer.name || 'Walk-in Customer',
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',
      customerAddress: customer.address || '',
      doctorName: customer.doctorName || '',
      doctorRegNo: customer.doctorRegNo || '',
      paymentMode,
      items: this.cart().map(i => ({
        medicineId: parseInt(i.medicine.id.replace(/\D/g, ''), 10) || 1,
        batchId: parseInt(i.selectedBatch.id.replace(/\D/g, ''), 10) || 1,
        saleType: i.saleType,
        quantity: i.quantity,
        discountPercent: i.discountPercent
      }))
    };

    this.api.checkout(checkoutReq).subscribe({
      next: (backendInv) => {
        if (backendInv?.invoiceNumber) {
          console.log('Invoice registered in Spring Boot MySQL:', backendInv.invoiceNumber);
        }
      },
      error: () => {}
    });

    // Set as active invoice for preview & clear cart
    this.activeInvoice.set(invoice);
    this.clearCart();

    return invoice;
  }
}
