package com.medi.app.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long medicineId;
    private String medicineName;
    private String genericName;
    private String packaging;

    private Integer quantity;
    private Double unitPrice;
    private Double total;

    // Doctor dosage specifications
    private String dosage; // "1-0-1", "1-0-0", "1-1-1", "SOS"
    private String timing; // "After Meals", "Before Meals"
    private Integer durationDays; // 3, 5, 7, 15, 30

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_order_id")
    @JsonBackReference
    private StoreOrder storeOrder;
}
