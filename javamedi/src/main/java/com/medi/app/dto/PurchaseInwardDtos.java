package com.medi.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

public class PurchaseInwardDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedItemDto {
        private String medicineName;
        private String genericName;
        private String batchNumber;
        private String expiryDate;
        private Integer quantity;
        private Double purchasePrice;
        private Double mrp;
        private Double salePrice;
        private Integer gstRate;
        private String hsnCode;
        private String packaging;
        private String category;
        private String rackLocation;

        // DB Matching metadata
        private Long existingMedicineId;
        private Boolean isExisting;
        private String matchedBrandName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedBillResponse {
        private String distributorName;
        private String invoiceNumber;
        private String invoiceDate;
        private Double totalAmount;
        private Integer totalItems;
        private Integer extractedRawLineCount;
        private String message;
        @Builder.Default
        private List<ParsedItemDto> items = new ArrayList<>();
        @Builder.Default
        private List<String> detectedHeaders = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitInwardRequest {
        private String distributorName;
        private String invoiceNumber;
        private String invoiceDate;
        private List<ParsedItemDto> items = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitInwardResponse {
        private Boolean success;
        private Integer itemsImported;
        private Integer newMedicinesCreated;
        private Integer batchesAdded;
        private Integer totalPacksAdded;
        private Double totalValuation;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RawTextParseRequest {
        private String rawText;
        private String distributorName;
    }
}
