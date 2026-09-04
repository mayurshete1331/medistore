package com.medi.app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "partner_stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerStore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;
    private String phone;
    private String email;
    private String dlNumber;
    private String gstin;
    private String distance;
    private Double rating;
    private Boolean isOpen;
    private Boolean deliveryAvailable;
    private Boolean codAvailable;
}
