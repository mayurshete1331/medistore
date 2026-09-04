package com.medi.app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String role; // STORE_OWNER, DOCTOR, CUSTOMER

    private String phone;
    private String avatarIcon;

    // Doctor specific fields
    private String doctorRegNo;
    private String doctorSpecialty;
    private String clinicAddress;

    // Customer specific fields
    private String customerAddress;

    // Store Owner specific fields
    private Long storeId;
    private String storeName;
}
