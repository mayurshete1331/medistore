package com.medi.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_affiliations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"store_id", "user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreAffiliation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id", nullable = false)
    private Long storeId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String role; // 'DOCTOR' or 'CUSTOMER'

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private String addedBy; // Name of store owner or staff who added them

    private String notes;

    private Double outstandingKhataBalance;
}
