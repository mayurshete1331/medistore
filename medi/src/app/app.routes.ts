import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { PosScreenComponent } from './components/billing/pos-screen/pos-screen.component';
import { MedicineListComponent } from './components/inventory/medicine-list/medicine-list.component';
import { ReorderDashboardComponent } from './components/reorder/reorder-dashboard/reorder-dashboard.component';
import { AnalyticsDashboardComponent } from './components/analytics/analytics-dashboard/analytics-dashboard.component';
import { DoctorPortalComponent } from './components/doctor/doctor-portal/doctor-portal.component';
import { CustomerPortalComponent } from './components/customer/customer-portal/customer-portal.component';
import { StoreOrdersComponent } from './components/owner/store-orders/store-orders.component';
import { StoreHistoryComponent } from './components/history/store-history/store-history.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Sign In — MediStore Platform' },
  { path: '', redirectTo: 'billing', pathMatch: 'full' },
  { path: 'billing', component: PosScreenComponent, canActivate: [authGuard], title: 'POS Billing — Medi' },
  { path: 'inventory', component: MedicineListComponent, canActivate: [authGuard], title: 'Medicine Master — Medi' },
  { path: 'store-orders', component: StoreOrdersComponent, canActivate: [authGuard], title: 'Store Inward Orders & Audit — Medi' },
  { path: 'history', component: StoreHistoryComponent, canActivate: [authGuard], title: 'Store Audit & History — Medi' },
  { path: 'reorder', component: ReorderDashboardComponent, canActivate: [authGuard], title: 'Auto-Reorder — Medi' },
  { path: 'analytics', component: AnalyticsDashboardComponent, canActivate: [authGuard], title: 'P&L Analytics — Medi' },
  { path: 'doctor', component: DoctorPortalComponent, canActivate: [authGuard], title: 'Doctor Prescription Portal — Medi' },
  { path: 'customer', component: CustomerPortalComponent, canActivate: [authGuard], title: 'Order Medicines & COD — Medi' },
  { path: '**', redirectTo: 'billing' }
];

