package com.medi.app.controller;

import com.medi.app.dto.AnalyticsDtos;
import com.medi.app.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Profit & Loss and Analytics", description = "Real-time Financial P&L, COGS, and Top-selling drug rankings")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/pnl")
    @Operation(summary = "Get real-time Profit & Loss metrics (Total Sales, COGS, Gross Profit, Net Margin %)")
    public ResponseEntity<AnalyticsDtos.FinancialSummaryDto> getFinancialSummary() {
        return ResponseEntity.ok(analyticsService.getFinancialSummary());
    }

    @GetMapping("/top-selling")
    @Operation(summary = "Get ranked list of top-selling medicines by revenue and volume")
    public ResponseEntity<List<AnalyticsDtos.TopSellingMedicineDto>> getTopSellingMedicines() {
        return ResponseEntity.ok(analyticsService.getTopSellingMedicines());
    }
}
