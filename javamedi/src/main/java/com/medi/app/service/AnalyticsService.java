package com.medi.app.service;

import com.medi.app.dto.AnalyticsDtos;
import com.medi.app.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final InvoiceRepository invoiceRepository;

    public AnalyticsDtos.FinancialSummaryDto getFinancialSummary() {
        Double totalRev = invoiceRepository.getTotalRevenue();
        Double totalCost = invoiceRepository.getTotalCostOfGoods();
        Double grossProfit = invoiceRepository.getTotalGrossProfit();
        long totalInvoices = invoiceRepository.count();

        double rev = totalRev != null ? totalRev : 0.0;
        double cost = totalCost != null ? totalCost : 0.0;
        double profit = grossProfit != null ? grossProfit : 0.0;
        double margin = rev > 0 ? Math.round((profit / rev) * 1000.0) / 10.0 : 0.0;

        return AnalyticsDtos.FinancialSummaryDto.builder()
                .totalRevenue(Math.round(rev * 100.0) / 100.0)
                .totalCostOfGoods(Math.round(cost * 100.0) / 100.0)
                .grossProfit(Math.round(profit * 100.0) / 100.0)
                .netMarginPercent(margin)
                .totalInvoices(totalInvoices)
                .build();
    }

    public List<AnalyticsDtos.TopSellingMedicineDto> getTopSellingMedicines() {
        List<Object[]> rows = invoiceRepository.findTopSellingMedicinesData();
        List<AnalyticsDtos.TopSellingMedicineDto> result = new ArrayList<>();

        for (Object[] row : rows) {
            Long medId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String generic = (String) row[2];
            long qty = ((Number) row[3]).longValue();
            double rev = ((Number) row[4]).doubleValue();
            double profit = ((Number) row[5]).doubleValue();

            result.add(AnalyticsDtos.TopSellingMedicineDto.builder()
                    .medicineId(medId)
                    .medicineName(name)
                    .genericName(generic)
                    .quantitySold(qty)
                    .revenue(Math.round(rev * 100.0) / 100.0)
                    .profit(Math.round(profit * 100.0) / 100.0)
                    .build());
        }

        return result;
    }
}
