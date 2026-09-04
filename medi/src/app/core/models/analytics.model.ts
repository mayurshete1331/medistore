export interface FinancialSummary {
  totalRevenue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  netMarginPercent: number;
  totalInvoices: number;
  totalUnitsSold: number;
  cashRevenue: number;
  upiRevenue: number;
  cardRevenue: number;
  khataCreditRevenue: number;
}

export interface TopSellingMedicine {
  medicineId: string;
  brandName: string;
  genericName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  percentageOfSales: number;
}

export interface SalesTrendPoint {
  label: string;       // e.g. "Mon", "Tue", or "Day 1"
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  invoices: number;
}

export interface StockHealthOverview {
  totalMedicines: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringIn30Days: number;
  totalInventoryValuation: number;
}
