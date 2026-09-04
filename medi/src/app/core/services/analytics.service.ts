import { Injectable, computed, inject } from '@angular/core';
import { BillingService } from './billing.service';
import { InventoryService } from './inventory.service';
import { FinancialSummary, TopSellingMedicine, SalesTrendPoint, StockHealthOverview } from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private billingService = inject(BillingService);
  private inventoryService = inject(InventoryService);

  readonly invoices = this.billingService.invoices;
  readonly medicines = this.inventoryService.medicines;

  // 1. Overall Financial Summary (P&L)
  readonly financialSummary = computed<FinancialSummary>(() => {
    const invs = this.invoices();

    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    let grossProfit = 0;
    let totalUnitsSold = 0;
    let cashRevenue = 0;
    let upiRevenue = 0;
    let cardRevenue = 0;
    let khataCreditRevenue = 0;

    invs.forEach(inv => {
      totalRevenue += inv.grandTotal;
      totalCostOfGoods += inv.totalCostPrice;
      grossProfit += inv.grossProfit;

      inv.items.forEach(item => {
        totalUnitsSold += item.quantity;
      });

      if (inv.paymentMode === 'CASH') cashRevenue += inv.grandTotal;
      else if (inv.paymentMode === 'UPI') upiRevenue += inv.grandTotal;
      else if (inv.paymentMode === 'CARD') cardRevenue += inv.grandTotal;
      else if (inv.paymentMode === 'KHATA') khataCreditRevenue += inv.grandTotal;
    });

    const netMarginPercent = totalRevenue > 0 ? +((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      totalRevenue: +totalRevenue.toFixed(2),
      totalCostOfGoods: +totalCostOfGoods.toFixed(2),
      grossProfit: +grossProfit.toFixed(2),
      netMarginPercent,
      totalInvoices: invs.length,
      totalUnitsSold,
      cashRevenue: +cashRevenue.toFixed(2),
      upiRevenue: +upiRevenue.toFixed(2),
      cardRevenue: +cardRevenue.toFixed(2),
      khataCreditRevenue: +khataCreditRevenue.toFixed(2)
    };
  });

  // 2. Top-Selling Medicines
  readonly topSellingMedicines = computed<TopSellingMedicine[]>(() => {
    const invs = this.invoices();
    const map = new Map<string, {
      medicineId: string;
      brandName: string;
      genericName: string;
      category: string;
      quantitySold: number;
      revenue: number;
      profit: number;
    }>();

    let grandSalesSum = 0;

    invs.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.medicine.id;
        const lineRevenue = item.total;
        const lineCost = item.costPrice * item.quantity;
        const lineProfit = lineRevenue - lineCost;

        grandSalesSum += lineRevenue;

        if (!map.has(key)) {
          map.set(key, {
            medicineId: item.medicine.id,
            brandName: item.medicine.brandName,
            genericName: item.medicine.genericName,
            category: item.medicine.category,
            quantitySold: 0,
            revenue: 0,
            profit: 0
          });
        }

        const curr = map.get(key)!;
        curr.quantitySold += item.quantity;
        curr.revenue += lineRevenue;
        curr.profit += lineProfit;
      });
    });

    const list = Array.from(map.values()).map(item => ({
      ...item,
      revenue: +item.revenue.toFixed(2),
      profit: +item.profit.toFixed(2),
      percentageOfSales: grandSalesSum > 0 ? +((item.revenue / grandSalesSum) * 100).toFixed(1) : 0
    }));

    // Sort by revenue descending
    return list.sort((a, b) => b.revenue - a.revenue);
  });

  // 3. Sales & Profit Trends (daily breakdown)
  readonly salesTrends = computed<SalesTrendPoint[]>(() => {
    const invs = this.invoices();
    const dayMap = new Map<string, { revenue: number; cost: number; profit: number; count: number }>();

    invs.forEach(inv => {
      const dateStr = inv.timestamp.split('T')[0];
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { revenue: 0, cost: 0, profit: 0, count: 0 });
      }
      const d = dayMap.get(dateStr)!;
      d.revenue += inv.grandTotal;
      d.cost += inv.totalCostPrice;
      d.profit += inv.grossProfit;
      d.count += 1;
    });

    // If few data points, create a continuous recent 7-day trend
    const points: SalesTrendPoint[] = [];
    const sortedKeys = Array.from(dayMap.keys()).sort();

    sortedKeys.forEach(k => {
      const val = dayMap.get(k)!;
      const dObj = new Date(k);
      const label = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      points.push({
        label,
        date: k,
        revenue: +val.revenue.toFixed(2),
        cost: +val.cost.toFixed(2),
        profit: +val.profit.toFixed(2),
        invoices: val.count
      });
    });

    return points;
  });

  // 4. Stock Health & Expiry
  readonly stockHealth = computed<StockHealthOverview>(() => {
    const meds = this.medicines();
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    meds.forEach(m => {
      if (m.totalStockPacks === 0) outOfStock++;
      else if (m.totalStockPacks <= m.reorderLevel) lowStock++;
      else inStock++;
    });

    return {
      totalMedicines: meds.length,
      inStockCount: inStock,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      expiringIn30Days: this.inventoryService.expiringSoonBatches().length,
      totalInventoryValuation: +this.inventoryService.totalValuation().toFixed(2)
    };
  });

  // 5. Category-wise Revenue Breakdown
  readonly categoryRevenue = computed(() => {
    const top = this.topSellingMedicines();
    const catMap = new Map<string, number>();

    top.forEach(t => {
      const current = catMap.get(t.category) || 0;
      catMap.set(t.category, current + t.revenue);
    });

    return Array.from(catMap.entries()).map(([category, revenue]) => ({
      category,
      revenue: +revenue.toFixed(2)
    })).sort((a, b) => b.revenue - a.revenue);
  });
}
