import { UserRole } from './auth.model';

export type OrderType = 'DOCTOR_PRESCRIPTION' | 'DOCTOR_DRUG_ORDER' | 'CUSTOMER_ORDER';
export type OrderPaymentMethod = 'ONLINE_PAID' | 'COD';
export type OrderPaymentStatus = 'PAID' | 'PENDING_COLLECTION';
export type OrderStatus = 'NEW_RECEIVED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';

export interface PrescribedOrderItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  packaging: string;
  quantity: number;
  unitPrice: number;
  total: number;
  // Dosage instructions (Doctor specific)
  dosage?: string;          // e.g. "1-0-1", "0-1-0", "1-1-1"
  timing?: string;          // e.g. "After Food", "Before Food"
  durationDays?: number;    // e.g. 5 days, 10 days
}

export interface OrderPatientInfo {
  patientName: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  patientPhone: string;
  diagnosis?: string;
  vitalsBp?: string;
  vitalsPulse?: string;
  vitalsWeight?: string;
  vitalsTemp?: string;
  vitalsSpo2?: string;
  familyMemberName?: string;
}

export interface OrderAuditEntry {
  timestamp: string;
  action: string;
  performedBy: string;
  notes?: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  storeId: string;
  storeName: string;
  
  // Who placed the order
  placedBy: {
    userId: string;
    userName: string;
    userRole: UserRole;
    userPhone: string;
    doctorRegNo?: string;
    doctorSpecialty?: string;
  };

  // Patient info (for Doctor or Customer)
  patient: OrderPatientInfo;

  // Items & Prescriptions
  items: PrescribedOrderItem[];
  prescriptionNotes?: string;
  deliveryAddress?: string;
  prescriptionPhotoUrl?: string;
  familyMemberName?: string;
  patientVitalsBp?: string;
  patientVitalsPulse?: string;
  patientVitalsWeight?: string;
  patientVitalsTemp?: string;
  patientVitalsSpo2?: string;

  // Payments
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  totalAmount: number;

  // Fulfillment Lifecycle
  orderStatus: OrderStatus;
  createdAt: string;
  packedAt?: string;
  dispatchedAt?: string;
  completedAt?: string;

  // Audit register
  auditTrail: OrderAuditEntry[];
}
