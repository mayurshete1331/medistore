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
        private String email;
        private String address;
        private String doctorName;
        private String doctorRegNo;
    }

    @Data
    public static class CheckoutRequest {
        private Long storeId;
        private CustomerInfoDto customer;
        
        // Flat compatibility fields
        private String customerName;
        private String customerPhone;
        private String customerEmail;
        private String customerAddress;
        private String doctorName;
        private String doctorRegNo;

        private String paymentMode; // CASH, UPI, CARD, KHATA
        private String dispensedBy;
        private List<CartItemDto> items;

        public String getResolvedCustomerName() {
            if (customer != null && customer.getName() != null && !customer.getName().trim().isEmpty()) {
                return customer.getName().trim();
            }
            if (customerName != null && !customerName.trim().isEmpty()) {
                return customerName.trim();
            }
            return "Walk-in Customer";
        }

        public String getResolvedCustomerPhone() {
            if (customer != null && customer.getPhone() != null) {
                return customer.getPhone().trim();
            }
            return customerPhone != null ? customerPhone.trim() : "";
        }

        public String getResolvedDoctorName() {
            if (customer != null && customer.getDoctorName() != null && !customer.getDoctorName().trim().isEmpty()) {
                return customer.getDoctorName().trim();
            }
            return doctorName != null ? doctorName.trim() : "";
        }

        public String getResolvedDoctorRegNo() {
            if (customer != null && customer.getDoctorRegNo() != null && !customer.getDoctorRegNo().trim().isEmpty()) {
                return customer.getDoctorRegNo().trim();
            }
            return doctorRegNo != null ? doctorRegNo.trim() : "";
        }
    }

    @Data
    public static class ReturnItemDto {
        private Long invoiceItemId;
        private Long medicineId;
        private String batchNumber;
        private String saleType; // FULL_PACK or LOOSE_UNIT
        private Integer returnQuantity;
        private Double refundAmount;
    }

    @Data
    public static class SalesReturnRequest {
        private String invoiceNumber;
        private Long invoiceId;
        private String returnReason;
        private String refundMode; // CASH, UPI, KHATA_CREDIT
        private String processedBy;
        private List<ReturnItemDto> returnedItems;
    }

    @Data
    public static class KhataPaymentRequest {
        private Long customerId;
        private String customerPhone;
        private Double paymentAmount;
        private String paymentMode; // CASH, UPI
        private String notes;
        private String receivedBy;
    }
}
