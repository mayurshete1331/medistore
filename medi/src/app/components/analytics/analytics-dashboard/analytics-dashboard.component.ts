import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';
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

  financials = this.analyticsService.financialSummary;
  topMedicines = this.analyticsService.topSellingMedicines;
  salesTrends = this.analyticsService.salesTrends;
  stockHealth = this.analyticsService.stockHealth;
  categoryRevenue = this.analyticsService.categoryRevenue;

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
