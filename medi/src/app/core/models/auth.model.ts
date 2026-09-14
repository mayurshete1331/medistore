export type UserRole = 'STORE_OWNER' | 'DOCTOR' | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarIcon: string;
  // Doctor specifics
  doctorRegNo?: string;        // MCI / State Medical Council Reg #
  doctorSpecialty?: string;    // e.g. "Cardiologist", "General Physician"
  clinicAddress?: string;
  // Customer specifics
  customerAddress?: string;
  // Store Owner specifics
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  storeDlNumber?: string;
  storeGstin?: string;
}

export interface PartnerStore {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  dlNumber: string;
  gstin: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  deliveryAvailable: boolean;
  codAvailable: boolean;
}
