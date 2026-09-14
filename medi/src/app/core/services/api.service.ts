import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StoreClient,
  StoreClientsResponse,
  StoreHistoryLog,
  AddCustomerRequest,
  AddDoctorRequest
} from '../models/store-client-history.model';

export type BackendStatus = 'ONLINE' | 'OFFLINE' | 'CHECKING';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  readonly backendStatus = signal<BackendStatus>('CHECKING');
  readonly lastChecked = signal<Date | null>(null);

  constructor() {
    this.checkHealth();
  }

  /**
   * Probes the Spring Boot backend on http://localhost:8080/api/auth/stores
   * with a 3000ms timeout to detect online/offline status.
   */
  checkHealth(): Observable<boolean> {
    this.backendStatus.set('CHECKING');
    return this.http.get(`${this.baseUrl}/auth/stores`).pipe(
      timeout(3000),
      map(() => {
        this.backendStatus.set('ONLINE');
        this.lastChecked.set(new Date());
        return true;
      }),
      catchError(() => {
        this.backendStatus.set('OFFLINE');
        this.lastChecked.set(new Date());
        return of(false);
      })
    );
  }

  // ==========================================
  // Auth & Profile Endpoints (/api/auth)
  // ==========================================
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/auth/users`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getPartnerStores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/auth/stores`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  login(req: { email: string; role?: string; password?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, req).pipe(
      tap(res => {
        this.backendStatus.set('ONLINE');
        if (res?.token) {
          try {
            localStorage.setItem('medi_jwt_token', res.token);
            if (res.refreshToken) {
              localStorage.setItem('medi_refresh_token', res.refreshToken);
            }
          } catch (e) {}
        }
      }),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  registerOwner(req: {
    name: string;
    email: string;
    password?: string;
    phone: string;
    storeName: string;
    storeAddress?: string;
    storeDlNumber?: string;
    storeGstin?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register/owner`, req).pipe(
      tap(res => {
        this.backendStatus.set('ONLINE');
        if (res?.token) {
          try {
            localStorage.setItem('medi_jwt_token', res.token);
            if (res.refreshToken) {
              localStorage.setItem('medi_refresh_token', res.refreshToken);
            }
          } catch (e) {}
        }
      }),
      catchError(err => {
        throw err;
      })
    );
  }

  // ==========================================
  // Medicine & Inventory Endpoints (/api/medicines)
  // ==========================================
  getMedicines(query?: string, category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (query && query.trim()) params = params.set('query', query.trim());
    if (category && category.trim() && category !== 'ALL') params = params.set('category', category.trim());

    return this.http.get<any[]>(`${this.baseUrl}/medicines`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getMedicineById(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/medicines/${id}`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getFefoBatches(medicineId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/medicines/${medicineId}/fefo-batches`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getLowStockMedicines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/medicines/low-stock`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  addMedicine(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/medicines`, data).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  addBatch(medicineId: string | number, batchData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/medicines/${medicineId}/batches`, batchData).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  // ==========================================
  // Billing & POS Endpoints (/api/billing)
  // ==========================================
  checkout(req: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/billing/checkout`, req).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getAllInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/billing/invoices`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getInvoiceByNumber(invoiceNumber: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/billing/invoices/${invoiceNumber}`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  processSalesReturn(req: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/billing/returns`, req).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  recordKhataPayment(req: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/billing/khata/payment`, req).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getScheduleH1Register(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/billing/schedule-h1`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  // ==========================================
  // Orders & Prescriptions (/api/orders)
  // ==========================================
  getOrders(storeId?: string | number, userId?: string | number): Observable<any[]> {
    let params = new HttpParams();
    if (storeId) params = params.set('storeId', storeId.toString());
    if (userId) params = params.set('userId', userId.toString());

    return this.http.get<any[]>(`${this.baseUrl}/orders`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  createDoctorOrder(req: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/doctor`, req).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  createCustomerOrder(req: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/customer`, req).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  updateOrderStatus(orderId: string | number, req: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/orders/${orderId}/status`, req).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  // ==========================================
  // Procurement & Reorders (/api/reorder)
  // ==========================================
  getReorderLowStock(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reorder/low-stock`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getSuppliers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reorder/suppliers`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  addSupplier(supplier: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/reorder/suppliers`, supplier).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  updateSupplier(id: string, supplier: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/reorder/suppliers/${id}`, supplier).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  deleteSupplier(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/reorder/suppliers/${id}`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/auth/profile`, profile).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getWhatsAppUrl(medicineId: string | number, customQty?: number, supplierId?: string | number, notes?: string): Observable<{ whatsappUrl: string }> {
    let params = new HttpParams();
    if (customQty) params = params.set('customQty', customQty.toString());
    if (supplierId) params = params.set('supplierId', supplierId.toString());
    if (notes) params = params.set('notes', notes);

    return this.http.get<{ whatsappUrl: string }>(`${this.baseUrl}/reorder/whatsapp-url/${medicineId}`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getEmailUrl(medicineId: string | number, customQty?: number, supplierId?: string | number, notes?: string): Observable<{ emailUrl: string }> {
    let params = new HttpParams();
    if (customQty) params = params.set('customQty', customQty.toString());
    if (supplierId) params = params.set('supplierId', supplierId.toString());
    if (notes) params = params.set('notes', notes);

    return this.http.get<{ emailUrl: string }>(`${this.baseUrl}/reorder/email-url/${medicineId}`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  // ==========================================
  // Analytics & P&L (/api/analytics)
  // ==========================================
  getFinancialSummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/pnl`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getTopSellingMedicines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/analytics/top-selling`).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  // ==========================================
  // Store Clients & Affiliations (/api/stores)
  // ==========================================
  addStoreCustomer(storeId: number | string, data: AddCustomerRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stores/${storeId}/customers`, data).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  addStoreDoctor(storeId: number | string, data: AddDoctorRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stores/${storeId}/doctors`, data).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getStoreClients(storeId: number | string, role?: string): Observable<StoreClientsResponse> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    return this.http.get<StoreClientsResponse>(`${this.baseUrl}/stores/${storeId}/clients`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  getAffiliatedStores(userId: number | string): Observable<any[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<any[]>(`${this.baseUrl}/auth/stores/affiliated`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  // ==========================================
  // Store History & Audit Log (/api/stores/{storeId}/history)
  // ==========================================
  getStoreHistory(storeId: number | string, filter?: { eventType?: string; search?: string; limit?: number }): Observable<StoreHistoryLog[]> {
    let params = new HttpParams();
    if (filter?.eventType && filter.eventType !== 'ALL') {
      params = params.set('eventType', filter.eventType);
    }
    if (filter?.search && filter.search.trim()) {
      params = params.set('search', filter.search.trim());
    }
    if (filter?.limit) {
      params = params.set('limit', filter.limit.toString());
    }

    return this.http.get<StoreHistoryLog[]>(`${this.baseUrl}/stores/${storeId}/history`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  addStoreHistoryNote(storeId: number | string, data: { title: string; description: string; performedBy: string; eventType?: string }): Observable<StoreHistoryLog> {
    return this.http.post<StoreHistoryLog>(`${this.baseUrl}/stores/${storeId}/history`, data).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  // ==========================================
  // Customer Directory & Past Invoices Lookup
  // ==========================================
  searchCustomer(query: string, storeId: string | number = '1'): Observable<any[]> {
    const params = new HttpParams().set('query', query.trim());
    return this.http.get<any[]>(`${this.baseUrl}/billing/customers/lookup`, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(() => {
        return this.getStoreClients(storeId, 'CUSTOMER').pipe(
          map(res => {
            const cleanDigits = query.replace(/\D/g, '');
            const q = query.toLowerCase().trim();
            const customers = res?.customers || [];
            return customers.filter((c: any) => {
              const cPhone = (c.phone || '').replace(/\D/g, '');
              const cName = (c.name || '').toLowerCase();
              return (cleanDigits && cPhone.includes(cleanDigits)) || cName.includes(q);
            }).map((c: any) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
              address: c.customerAddress || c.address,
              isRegistered: true,
              pastBillsCount: 0
            }));
          }),
          catchError(() => of([]))
        );
      })
    );
  }

  getCustomerPastInvoices(phone: string, name?: string): Observable<any[]> {
    let params = new HttpParams();
    if (phone) params = params.set('phone', phone.trim());
    if (name) params = params.set('name', name.trim());
    return this.http.get<any[]>(`${this.baseUrl}/billing/customers/invoices`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  // ==========================================
  // Purchase Inward & Bill Parsing Endpoints (/api/purchase-inward)
  // ==========================================
  parsePurchaseBill(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<any>(`${this.baseUrl}/purchase-inward/parse`, formData).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  parseRawInvoiceText(rawText: string, distributorName?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/purchase-inward/parse-text`, { rawText, distributorName }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }

  commitPurchaseInward(payload: any, storeId: string = '1'): Observable<any> {
    const params = new HttpParams().set('storeId', storeId);
    return this.http.post<any>(`${this.baseUrl}/purchase-inward/commit`, payload, { params }).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
        throw err;
      })
    );
  }
}
