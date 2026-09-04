package com.medi.app.dto;

import lombok.Data;

import java.util.List;

public class OrderDtos {

    @Data
    public static class PrescribedItemDto {
        private Long medicineId;
        private String medicineName;
        private String genericName;
        private String packaging;
        private Integer quantity;
        private Double unitPrice;
        private Double total;
        private String dosage; // "1-0-1"
        private String timing; // "After Meals"
        private Integer durationDays; // 5
    }

    @Data
    public static class CreateDoctorOrderRequest {
        private Long storeId;
        private String storeName;
        private Long doctorUserId;

        // Patient info
        private String patientName;
        private Integer patientAge;
        private String patientGender;
        private String patientPhone;
        private String diagnosis;

        private String prescriptionNotes;
        private String deliveryAddress;
        private String paymentMethod; // COD or ONLINE_PAID
        private List<PrescribedItemDto> items;
    }

    @Data
    public static class CreateCustomerOrderRequest {
        private Long storeId;
        private String storeName;
        private Long customerUserId;
        private String patientName;
        private String customerPhone;
        private String deliveryAddress;
        private String paymentMethod; // COD or ONLINE_PAID
        private List<PrescribedItemDto> items;
    }

    @Data
    public static class UpdateOrderStatusRequest {
        private String newStatus; // PACKED, OUT_FOR_DELIVERY, COMPLETED, CANCELLED
        private String performedBy;
        private String notes;
    }
}
