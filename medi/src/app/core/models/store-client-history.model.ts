import { UserRole } from './auth.model';

export interface StoreClient {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  doctorRegNo?: string;
  doctorSpecialty?: string;
  clinicAddress?: string;
  customerAddress?: string;
  addedBy?: string;
  notes?: string;
  createdAt?: string;
}

export interface StoreClientsResponse {
  storeId: number;
  totalClients: number;
  doctors: StoreClient[];
  customers: StoreClient[];
}

export type StoreEventType =
  | 'CUSTOMER_ADDED'
  | 'DOCTOR_ADDED'
  | 'SALE_BILLING'
  | 'INVENTORY_CHANGE'
  | 'ORDER_STATUS'
  | 'ORDER_RECEIVED'
  | 'PURCHASE_REORDER'
  | 'MANUAL_NOTE';

export interface StoreHistoryLog {
  id: number;
  storeId: number;
  eventType: StoreEventType;
  title: string;
  description: string;
  performedBy: string;
  referenceId?: string;
  amount?: number;
  timestamp: string;
}

export interface AddCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  addedBy?: string;
}

export interface AddDoctorRequest {
  name: string;
  phone: string;
  email?: string;
  doctorRegNo: string;
  doctorSpecialty: string;
  clinicAddress?: string;
  notes?: string;
  addedBy?: string;
}
