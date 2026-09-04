package com.medi.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AnalyticsDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialSummaryDto {
        private Double totalRevenue;
        private Double totalCostOfGoods;
        private Double grossProfit;
        private Double netMarginPercent;
        private Long totalInvoices;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopSellingMedicineDto {
        private Long medicineId;
        private String medicineName;
        private String genericName;
        private Long quantitySold;
        private Double revenue;
        private Double profit;
    }
}
