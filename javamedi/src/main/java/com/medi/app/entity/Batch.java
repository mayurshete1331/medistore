package com.medi.app.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String batchNumber;

    @Column(nullable = false)
    private String mfgDate; // YYYY-MM

    @Column(nullable = false)
    private String expiryDate; // YYYY-MM

    @Column(nullable = false)
    private Double purchasePrice; // Cost to store

    @Column(nullable = false)
    private Double mrp; // Maximum retail price

    @Column(nullable = false)
    private Double salePrice; // Store sale price

    @Column(nullable = false)
    private Integer stockPacks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id")
    @JsonBackReference
    private Medicine medicine;
}
