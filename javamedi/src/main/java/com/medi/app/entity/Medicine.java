package com.medi.app.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id")
    private Long storeId;

    @Column(nullable = false)
    private String brandName;

    @Column(nullable = false, length = 500)
    private String genericName; // Chemical formula / Salt

    @Column(nullable = false)
    private String category; // Tablet, Capsule, Syrup, Injection, Ointment, Drops, Inhaler, Surgical

    private String manufacturer;
    private String hsnCode;
    private Integer gstRate; // 0, 5, 12, 18
    private String packaging; // e.g. "10 Tablets/Strip"
    private Integer unitsPerPack; // 10 for tablets, 1 for syrup
    private String unitLabel; // "Tab", "Bottle", "Vial"
    private String rackLocation; // "Rack A-01"

    private Boolean isScheduleH; // Rx required
    private Boolean isScheduleH1; // Strict Antibiotic register
    private Boolean isNarcotic;

    private Integer reorderLevel; // Minimum threshold
    private Integer defaultReorderQty; // Suggested replenish qty
    private String barcode; // EAN-13 or GS1 Barcode

    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<Batch> batches = new ArrayList<>();

    public Integer getTotalStockPacks() {
        if (batches == null || batches.isEmpty()) return 0;
        return batches.stream().mapToInt(Batch::getStockPacks).sum();
    }
}
