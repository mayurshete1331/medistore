package com.medi.app.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "store_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @Column(nullable = false)
    private String orderType; // DOCTOR_PRESCRIPTION, DOCTOR_DRUG_ORDER, CUSTOMER_ORDER

    private Long storeId;
    private String storeName;

    // Placed By Information (Doctor or Customer)
    private Long placedByUserId;
    private String placedByUserName;
    private String placedByUserRole; // DOCTOR or CUSTOMER
    private String placedByUserPhone;
    private String doctorRegNo;
    private String doctorSpecialty;

    // Patient Details
    private String patientName;
    private Integer patientAge;
    private String patientGender;
    private String patientPhone;
    private String diagnosis;

    @Column(length = 1000)
    private String prescriptionNotes;

    private String deliveryAddress;

    // Payment details
    @Column(nullable = false)
    private String paymentMethod; // ONLINE_PAID or COD (Cash on Delivery)

    @Column(nullable = false)
    private String paymentStatus; // PAID or PENDING_COLLECTION

    @Column(nullable = false)
    private Double totalAmount;

    // Status & Timestamps
    @Column(nullable = false)
    private String orderStatus; // NEW_RECEIVED, PACKED, OUT_FOR_DELIVERY, COMPLETED, CANCELLED

    private LocalDateTime createdAt;
    private LocalDateTime packedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "storeOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "storeOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private List<OrderAuditLog> auditTrail = new ArrayList<>();
}
