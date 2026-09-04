package com.medi.app.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "invoice_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long medicineId;
    private String medicineName;
    private String genericName;
    private String batchNumber;
    private String expiryDate;
    private String hsnCode;

    private String saleType; // FULL_PACK or LOOSE_UNIT
    private Integer quantity; // Pack count or loose tablet count
    private Double unitPrice;
    private Double mrp;
    private Double costPrice;
    private Double discountPercent;
    private Integer gstRate;
    private Double taxAmount;
    private Double subtotal;
    private Double total;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    @JsonBackReference
    private Invoice invoice;
}
