import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { BillingService } from '../../../core/services/billing.service';
import { TopSellingMedicine, SalesTrendPoint } from '../../../core/models/analytics.model';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss']
})
export class AnalyticsDashboardComponent {
  analyticsService = inject(AnalyticsService);
  billingService = inject(BillingService);

  selectedDateRange = signal<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('THIS_MONTH');

  financials = this.analyticsService.financialSummary;
  topMedicines = this.analyticsService.topSellingMedicines;
  salesTrends = this.analyticsService.salesTrends;
  stockHealth = this.analyticsService.stockHealth;
  categoryRevenue = this.analyticsService.categoryRevenue;

  // Statutory GSTR-1 Tax Liability by GST Slabs (0%, 5%, 12%, 18%)
  gstr1Breakdown = computed(() => {
    const range = this.selectedDateRange();
    let invoices = this.billingService.invoices();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (range === 'TODAY') {
      invoices = invoices.filter(i => (i.timestamp || '').startsWith(todayStr));
    } else if (range === 'THIS_MONTH') {
      invoices = invoices.filter(i => (i.timestamp || '').startsWith(thisMonthStr));
    }

    const slabs: { [rate: number]: { rate: number; taxableBase: number; cgst: number; sgst: number; totalTax: number; grossTotal: number } } = {
      0: { rate: 0, taxableBase: 0, cgst: 0, sgst: 0, totalTax: 0, grossTotal: 0 },
      5: { rate: 5, taxableBase: 0, cgst: 0, sgst: 0, totalTax: 0, grossTotal: 0 },
      12: { rate: 12, taxableBase: 0, cgst: 0, sgst: 0, totalTax: 0, grossTotal: 0 },
      18: { rate: 18, taxableBase: 0, cgst: 0, sgst: 0, totalTax: 0, grossTotal: 0 }
    };

    for (const inv of invoices) {
      if (!inv.items) continue;
      for (const item of inv.items) {
        const gst = item.gstRate || 12;
        const targetSlab = slabs[gst] || slabs[12];
        const sub = item.subtotal || 0;
        const tax = item.taxAmount || 0;
        const total = item.total || 0;

        targetSlab.taxableBase += sub;
        targetSlab.cgst += +(tax / 2).toFixed(2);
        targetSlab.sgst += +(tax / 2).toFixed(2);
        targetSlab.totalTax += tax;
        targetSlab.grossTotal += total;
      }
    }

    return Object.values(slabs).map(s => ({
      rate: s.rate,
      taxableBase: +s.taxableBase.toFixed(2),
      cgst: +s.cgst.toFixed(2),
      sgst: +s.sgst.toFixed(2),
      totalTax: +s.totalTax.toFixed(2),
      grossTotal: +s.grossTotal.toFixed(2)
    }));
  });

  // Max revenue for bar scaling
  maxTopMedRevenue = computed(() => {
    const list = this.topMedicines();
    if (list.length === 0) return 1000;
    return Math.max(...list.map(m => m.revenue));
  });

  // Calculate highest revenue in trend for SVG charting
  maxTrendRevenue = computed(() => {
    const list = this.salesTrends();
    if (list.length === 0) return 1000;
    return Math.max(...list.map(t => t.revenue)) * 1.15;
  });

  // SVG Chart Height
  readonly chartHeight = 220;
  readonly chartWidth = 700;

  getY(val: number): number {
    const max = this.maxTrendRevenue();
    if (max === 0) return this.chartHeight;
    return this.chartHeight - (val / max) * (this.chartHeight - 40);
  }

  getX(index: number, total: number): number {
    if (total <= 1) return this.chartWidth / 2;
    const padding = 50;
    return padding + (index * (this.chartWidth - padding * 2)) / (total - 1);
  }

  getTrendPointsPath(key: 'revenue' | 'cost' | 'profit'): string {
    const trends = this.salesTrends();
    if (trends.length === 0) return '';
    return trends.map((pt, i) => {
      const x = this.getX(i, trends.length);
      const y = this.getY(pt[key]);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  getAreaPath(): string {
    const trends = this.salesTrends();
    if (trends.length === 0) return '';
    const line = this.getTrendPointsPath('revenue');
    const lastX = this.getX(trends.length - 1, trends.length);
    const firstX = this.getX(0, trends.length);
    return `${line} L ${lastX} ${this.chartHeight} L ${firstX} ${this.chartHeight} Z`;
  }
}
