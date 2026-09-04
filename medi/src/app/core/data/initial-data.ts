import { Medicine } from '../models/medicine.model';
import { Supplier } from '../models/supplier.model';
import { Invoice } from '../models/bill.model';

// Database-first architecture: all medicines, suppliers, invoices, and users are fetched live from Spring Boot MySQL database on port 8081
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_MEDICINES: Medicine[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
