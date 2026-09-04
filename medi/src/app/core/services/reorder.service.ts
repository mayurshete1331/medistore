import { Injectable, signal, computed, inject } from '@angular/core';
import { InventoryService } from './inventory.service';
import { Supplier, ReorderItem, PurchaseOrder } from '../models/supplier.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ReorderService {
  private readonly SUPPLIER_STORAGE = 'medi_suppliers_v1';
  private readonly REORDER_STORAGE = 'medi_reorders_v1';

  private inventoryService = inject(InventoryService);
  private api = inject(ApiService);

  readonly suppliers = signal<Supplier[]>(this.loadSuppliers());
  readonly customReorderOverrides = signal<Record<string, { customQty: number; supplierId: string; notes: string; approved: boolean }>>(this.loadOverrides());

  constructor() {
    this.syncSuppliersFromBackend();
  }

  syncSuppliersFromBackend(): void {
    this.api.getSuppliers().subscribe({
      next: (backendSups) => {
        if (backendSups && backendSups.length > 0) {
          const mapped: Supplier[] = backendSups.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            contactPerson: s.contactPerson || s.name,
            phone: s.phone || '',
            whatsappNumber: s.whatsappNumber || s.phone || '',
            email: s.email || '',
            drugLicenseNo: s.drugLicenseNo || s.dlNumber || 'MH-MZ4-20B-10928',
            dlNumber: s.dlNumber || s.drugLicenseNo || 'MH-MZ4-20B-10928',
            address: s.address || 'Industrial Estate, Mumbai',
            gstin: s.gstin || '27AABCS1234F1Z5',
            paymentTerms: s.paymentTerms || '30 Days Credit',
            rating: Number(s.rating) || 4.5,
            leadTimeDays: Number(s.leadTimeDays) || 2
          }));
          this.suppliers.set(mapped);
        }
      },
      error: () => {}
    });
  }

  // Compute all reorder items by looking at low-stock medicines
  readonly activeReorders = computed<ReorderItem[]>(() => {
    const lowStockMeds = this.inventoryService.lowStockMedicines();
    const suppliersList = this.suppliers();
    const defaultSupplier = suppliersList[0] || { id: 'sup-1', name: 'Default Supplier' };
    const overrides = this.customReorderOverrides();

    return lowStockMeds.map(med => {
      const override = overrides[med.id];
      const suggestedQty = Math.max(med.defaultReorderQty, (med.reorderLevel * 2) - med.totalStockPacks);
      const customQty = override ? override.customQty : suggestedQty;
      const supplierId = override ? override.supplierId : defaultSupplier.id;
      const selectedSupplier = suppliersList.find(s => s.id === supplierId) || defaultSupplier;

      // Estimate cost from latest batch purchase price
      const unitCost = med.batches.length > 0 ? med.batches[0].purchasePrice : 100;
      const totalCost = +(unitCost * customQty).toFixed(2);

      return {
        medicineId: med.id,
        medicineName: med.brandName,
        genericName: med.genericName,
        packaging: med.packaging,
        currentStockPacks: med.totalStockPacks,
        reorderLevel: med.reorderLevel,
        suggestedQty,
        customQty,
        estimatedUnitPrice: unitCost,
        totalCost,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        status: override?.approved ? 'APPROVED' : 'PENDING_APPROVAL',
        customNotes: override?.notes || ''
      };
    });
  });

  readonly pendingApprovalCount = computed(() => {
    return this.activeReorders().filter(r => r.status === 'PENDING_APPROVAL').length;
  });

  readonly approvedCount = computed(() => {
    return this.activeReorders().filter(r => r.status === 'APPROVED').length;
  });

  readonly totalReorderEstimatedCost = computed(() => {
    return this.activeReorders().reduce((sum, r) => sum + r.totalCost, 0);
  });

  private loadSuppliers(): Supplier[] {
    try {
      const saved = localStorage.getItem(this.SUPPLIER_STORAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load suppliers', e);
    }
    return [];
  }

  private loadOverrides(): Record<string, { customQty: number; supplierId: string; notes: string; approved: boolean }> {
    try {
      const saved = localStorage.getItem(this.REORDER_STORAGE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load reorder overrides', e);
    }
    return {};
  }

  private saveOverrides(overrides: Record<string, { customQty: number; supplierId: string; notes: string; approved: boolean }>): void {
    this.customReorderOverrides.set(overrides);
    try {
      localStorage.setItem(this.REORDER_STORAGE, JSON.stringify(overrides));
    } catch (e) {
      console.error('Failed to save reorder overrides', e);
    }
  }

  updateCustomQuantity(medicineId: string, quantity: number): void {
    const current = { ...this.customReorderOverrides() };
    const prev = current[medicineId] || {
      customQty: quantity,
      supplierId: this.suppliers()[0]?.id || '',
      notes: '',
      approved: false
    };
    current[medicineId] = { ...prev, customQty: Math.max(1, quantity) };
    this.saveOverrides(current);
  }

  updateSupplier(medicineId: string, supplierId: string): void {
    const current = { ...this.customReorderOverrides() };
    const prev = current[medicineId] || {
      customQty: 10,
      supplierId,
      notes: '',
      approved: false
    };
    current[medicineId] = { ...prev, supplierId };
    this.saveOverrides(current);
  }

  updateNotes(medicineId: string, notes: string): void {
    const current = { ...this.customReorderOverrides() };
    const prev = current[medicineId] || {
      customQty: 10,
      supplierId: this.suppliers()[0]?.id || '',
      notes: '',
      approved: false
    };
    current[medicineId] = { ...prev, notes };
    this.saveOverrides(current);
  }

  approveSingleReorder(medicineId: string): void {
    const current = { ...this.customReorderOverrides() };
    const prev = current[medicineId] || {
      customQty: 10,
      supplierId: this.suppliers()[0]?.id || '',
      notes: '',
      approved: false
    };
    current[medicineId] = { ...prev, approved: true };
    this.saveOverrides(current);
  }

  approveAllReorders(): void {
    const current = { ...this.customReorderOverrides() };
    this.activeReorders().forEach(item => {
      const prev = current[item.medicineId] || {
        customQty: item.customQty,
        supplierId: item.supplierId,
        notes: '',
        approved: false
      };
      current[item.medicineId] = { ...prev, approved: true };
    });
    this.saveOverrides(current);
  }

  revokeApproval(medicineId: string): void {
    const current = { ...this.customReorderOverrides() };
    if (current[medicineId]) {
      current[medicineId] = { ...current[medicineId], approved: false };
      this.saveOverrides(current);
    }
  }

  // Format professional Purchase Order message for WhatsApp
  generateWhatsAppUrl(item: ReorderItem): string {
    const supplier = this.suppliers().find(s => s.id === item.supplierId) || this.suppliers()[0];
    const phone = (supplier?.whatsappNumber || '919876543210').replace(/[^0-9]/g, '');

    const message = 
`*🏥 PURCHASE ORDER - MEDI PHARMACY*
----------------------------------------
*To:* ${supplier.name}
*Attention:* ${supplier.contactPerson}

*URGENT STOCK REORDER REQUEST:*
• *Medicine:* ${item.medicineName}
• *Composition:* ${item.genericName}
• *Packaging:* ${item.packaging}
• *Order Qty:* ${item.customQty} Packs
• *Est. Rate:* ₹${item.estimatedUnitPrice}/pack
• *Est. Total:* ₹${item.totalCost}

*Special Instructions:*
${item.customNotes || 'Please dispatch earliest batch with min 12+ months expiry.'}

*Authorized by:* Store Owner / Chief Pharmacist
*Timestamp:* ${new Date().toLocaleString()}
----------------------------------------
_Generated automatically via Medi Store Management System_`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  }

  // Generate Email mailto: URL with pre-filled subject and table
  generateEmailUrl(item: ReorderItem): string {
    const supplier = this.suppliers().find(s => s.id === item.supplierId) || this.suppliers()[0];
    const subject = encodeURIComponent(`Purchase Order [URGENT]: ${item.medicineName} (${item.customQty} Packs) - Medi Pharmacy`);
    
    const body = encodeURIComponent(
`Dear ${supplier.contactPerson || supplier.name},

Please process our purchase order for the following medicine urgently:

Medicine Name: ${item.medicineName}
Composition: ${item.genericName}
Packaging: ${item.packaging}
Quantity Required: ${item.customQty} Packs
Estimated Cost: INR ${item.totalCost}

Notes / Instructions:
${item.customNotes || 'Ensure batches have at least 1-year shelf life.'}

Delivery Address:
Medi Pharmacy & Healthcare Store
Main Counter, Drug License No: MH-MZ4-20B-10928
GSTIN: 27AABCM1122D1Z9

Authorized by Store Owner.
Thank you,
Medi Pharmacy Management System`
    );

    return `mailto:${supplier.email}?subject=${subject}&body=${body}`;
  }

  // Bulk WhatsApp Order generation
  generateBulkWhatsAppUrl(supplierId: string): string {
    const supplier = this.suppliers().find(s => s.id === supplierId) || this.suppliers()[0];
    const items = this.activeReorders().filter(r => r.supplierId === supplierId && r.status === 'APPROVED');
    const phone = (supplier?.whatsappNumber || '919876543210').replace(/[^0-9]/g, '');

    let itemsList = '';
    let grandTotal = 0;

    items.forEach((item, index) => {
      itemsList += `${index + 1}. *${item.medicineName}* (${item.packaging})\n   Qty: *${item.customQty} packs* | Est: ₹${item.totalCost}\n`;
      grandTotal += item.totalCost;
    });

    const message = 
`*🏥 CONSOLIDATED PURCHASE ORDER - MEDI PHARMACY*
----------------------------------------
*To:* ${supplier.name}
*Attn:* ${supplier.contactPerson}

*Approved Order Items (${items.length}):*
${itemsList}
*Estimated Order Total:* ₹${grandTotal.toFixed(2)}

*Authorization:* Approved by Store Owner
*Date:* ${new Date().toLocaleDateString()}
Please confirm delivery timeline.
----------------------------------------`;

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
  }

  markAsReceived(medicineId: string, packsReceived: number): void {
    this.inventoryService.restockMedicine(medicineId, packsReceived);
    // Reset override
    const current = { ...this.customReorderOverrides() };
    delete current[medicineId];
    this.saveOverrides(current);
  }
}
