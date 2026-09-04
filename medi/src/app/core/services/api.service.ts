import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  login(req: { email: string; role?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, req).pipe(
      tap(() => this.backendStatus.set('ONLINE')),
      catchError(err => {
        this.backendStatus.set('OFFLINE');
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
}
