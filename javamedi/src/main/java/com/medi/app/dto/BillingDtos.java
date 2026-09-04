package com.medi.app.dto;

import lombok.Data;

import java.util.List;

public class BillingDtos {

    @Data
    public static class CartItemDto {
        private Long medicineId;
        private Long batchId;
        private String medicineName;
        private String genericName;
        private String batchNumber;
        private String expiryDate;
        private String hsnCode;

        private String saleType; // FULL_PACK or LOOSE_UNIT
        private Integer quantity;
        private Double unitPrice;
        private Double mrp;
        private Double costPrice;
        private Double discountPercent;
        private Integer gstRate;
        private Double taxAmount;
        private Double subtotal;
        private Double total;
    }

    @Data
    public static class CustomerInfoDto {
        private String name;
        private String phone;
        private String doctorName;
        private String doctorRegNo;
    }

    @Data
    public static class CheckoutRequest {
        private CustomerInfoDto customer;
        private String paymentMode; // CASH, UPI, CARD, KHATA
        private String dispensedBy;
        private List<CartItemDto> items;
    }
}
