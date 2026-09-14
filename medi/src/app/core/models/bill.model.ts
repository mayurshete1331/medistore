import { Batch, Medicine } from './medicine.model';

export type SaleUnitType = 'FULL_PACK' | 'LOOSE_UNIT';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'KHATA';

export interface CartItem {
  id: string; // unique item id in cart
  medicine: Medicine;
  selectedBatch: Batch;
  saleType: SaleUnitType;
  quantity: number;          // number of packs OR number of loose tablets
  unitPrice: number;         // effective price per selected unit (pack price or loose unit price)
  mrp: number;               // MRP for reference
  costPrice: number;         // Purchase price per unit for profit calculation
  discountPercent: number;   // Item-specific discount %
  gstRate: number;           // 0, 5, 12, 18
  taxAmount: number;         // Calculated tax
  subtotal: number;          // quantity * unitPrice - discount
  total: number;             // subtotal + taxAmount
  isReturned?: boolean;
  returnedQuantity?: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  doctorName?: string;
  doctorRegNo?: string;
  patientAge?: number;
  notes?: string;
  khataBalance?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  totalCostPrice: number;    // COGS for profit calculation
  grossProfit: number;       // grandTotal (ex tax) - totalCostPrice
  paymentMode: PaymentMode;
  paymentStatus: 'PAID' | 'CREDIT_KHATA';
  hasScheduleH: boolean;     // Whether prescription is mandatory
  dispensedBy: string;
  isReturned?: boolean;
  returnAmount?: number;
  returnReason?: string;
  returnTimestamp?: string;
  creditNoteNumber?: string;
  printFormat?: 'A4' | 'THERMAL_80MM';
}

export interface ReturnItemDto {
  invoiceItemId?: number;
  medicineId?: number;
  batchNumber?: string;
  saleType?: string;
  returnQuantity: number;
  refundAmount?: number;
}

export interface SalesReturnRequest {
  invoiceNumber: string;
  invoiceId?: number;
  returnReason: string;
  refundMode: 'CASH' | 'UPI' | 'KHATA_CREDIT';
  processedBy?: string;
  returnedItems: ReturnItemDto[];
}

export interface KhataPaymentRequest {
  customerId?: number;
  customerPhone?: string;
  paymentAmount: number;
  paymentMode: 'CASH' | 'UPI';
  notes?: string;
  receivedBy?: string;
}

export interface ScheduleH1Record {
  invoiceNumber: string;
  timestamp: string;
  customerName: string;
  customerPhone: string;
  doctorName: string;
  doctorRegNo: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  dispensedBy: string;
  scheduleType: string;
}

