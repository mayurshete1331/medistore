package com.medi.app.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Customer & Prescriber Info
    private String customerName;
    private String customerPhone;
    private String doctorName;
    private String doctorRegNo;

    // Financial calculations
    @Column(nullable = false)
    private Double subtotal;

    private Double totalDiscount;
    private Double cgst;
    private Double sgst;
    private Double totalTax;
    private Double roundOff;

    @Column(nullable = false)
    private Double grandTotal;

    private Double totalCostPrice;
    private Double grossProfit;

    // Payment details
    @Column(nullable = false)
    private String paymentMode; // CASH, UPI, CARD, KHATA

    @Column(nullable = false)
    private String paymentStatus; // PAID, CREDIT_KHATA

    private Boolean hasScheduleH;
    private String dispensedBy;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();
}
