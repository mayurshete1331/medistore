package com.medi.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

public class MedicineDtos {

    @Data
    public static class CreateMedicineRequest {
        @NotBlank(message = "Brand name is required")
        private String brandName;

        @NotBlank(message = "Generic composition is required")
        private String genericName;

        @NotBlank(message = "Category is required")
        private String category;

        private String manufacturer;
        private String hsnCode;
        private Integer gstRate;
        private String packaging;
        private Integer unitsPerPack;
        private String unitLabel;
        private String rackLocation;

        private Boolean isScheduleH;
        private Boolean isScheduleH1;
        private Boolean isNarcotic;

        private Integer reorderLevel;
        private Integer defaultReorderQty;

        @NotNull(message = "Initial batch information is required")
        private InitialBatchDto initialBatch;
    }

    @Data
    public static class InitialBatchDto {
        @NotBlank(message = "Batch number is required")
        private String batchNumber;

        private String mfgDate;
        private String expiryDate;
        private Double purchasePrice;
        private Double mrp;
        private Double salePrice;
        private Integer stockPacks;
    }

    @Data
    public static class AddBatchRequest {
        @NotBlank
        private String batchNumber;
        private String mfgDate;
        private String expiryDate;
        private Double purchasePrice;
        private Double mrp;
        private Double salePrice;
        private Integer stockPacks;
    }
}
