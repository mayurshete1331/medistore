export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  gstin: string;
  drugLicenseNo: string;
  address: string;
  dlNumber?: string;
  paymentTerms?: string;
  rating?: number;
  leadTimeDays?: number;
}

export interface ReorderItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  packaging: string;
  currentStockPacks: number;
  reorderLevel: number;
  suggestedQty: number;   // Calculated default order
  customQty: number;      // User editable order quantity
  estimatedUnitPrice: number;
  totalCost: number;
  supplierId: string;
  supplierName: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED' | 'RECEIVED';
  dispatchedVia?: 'WHATSAPP' | 'EMAIL';
  dispatchedAt?: string;
  customNotes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  createdAt: string;
  items: ReorderItem[];
  totalCost: number;
  ownerApproved: boolean;
  ownerApprovedAt?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED_WHATSAPP' | 'DISPATCHED_EMAIL' | 'RECEIVED';
  dispatchLog?: string;
}
