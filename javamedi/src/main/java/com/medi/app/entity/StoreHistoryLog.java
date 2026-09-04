package com.medi.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_history_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreHistoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String eventType; // 'CUSTOMER_ADDED', 'DOCTOR_ADDED', 'SALE_BILLING', 'INVENTORY_CHANGE', 'ORDER_STATUS', 'PURCHASE_REORDER', 'MANUAL_NOTE'

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String performedBy;

    private String referenceId; // Invoice number, Order number, Batch number, User ID

    private Double amount; // Financial amount if applicable (e.g. invoice total)
}
