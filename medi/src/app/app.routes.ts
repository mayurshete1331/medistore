import { Routes } from '@angular/router';
import { PosScreenComponent } from './components/billing/pos-screen/pos-screen.component';
import { MedicineListComponent } from './components/inventory/medicine-list/medicine-list.component';
import { ReorderDashboardComponent } from './components/reorder/reorder-dashboard/reorder-dashboard.component';
import { AnalyticsDashboardComponent } from './components/analytics/analytics-dashboard/analytics-dashboard.component';
import { DoctorPortalComponent } from './components/doctor/doctor-portal/doctor-portal.component';
import { CustomerPortalComponent } from './components/customer/customer-portal/customer-portal.component';
import { StoreOrdersComponent } from './components/owner/store-orders/store-orders.component';

export const routes: Routes = [
  { path: '', redirectTo: 'billing', pathMatch: 'full' },
  { path: 'billing', component: PosScreenComponent, title: 'POS Billing — Medi' },
  { path: 'inventory', component: MedicineListComponent, title: 'Medicine Master — Medi' },
  { path: 'store-orders', component: StoreOrdersComponent, title: 'Store Inward Orders & Audit — Medi' },
  { path: 'reorder', component: ReorderDashboardComponent, title: 'Auto-Reorder — Medi' },
  { path: 'analytics', component: AnalyticsDashboardComponent, title: 'P&L Analytics — Medi' },
  { path: 'doctor', component: DoctorPortalComponent, title: 'Doctor Prescription Portal — Medi' },
  { path: 'customer', component: CustomerPortalComponent, title: 'Order Medicines & COD — Medi' },
  { path: '**', redirectTo: 'billing' }
];
