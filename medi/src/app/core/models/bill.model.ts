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
}
