package com.medi.app.controller;

import com.medi.app.entity.PartnerStore;
import com.medi.app.entity.StoreAffiliation;
import com.medi.app.entity.StoreHistoryLog;
import com.medi.app.entity.User;
import com.medi.app.repository.PartnerStoreRepository;
import com.medi.app.repository.StoreAffiliationRepository;
import com.medi.app.repository.UserRepository;
import com.medi.app.service.StoreHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Store Clients & History", description = "Store Owners adding Customers/Doctors, Store Affiliation Filtering & Store History Audit Logs")
public class StoreClientController {

    private final UserRepository userRepository;
    private final PartnerStoreRepository partnerStoreRepository;
    private final StoreAffiliationRepository storeAffiliationRepository;
    private final StoreHistoryService storeHistoryService;
    private final PasswordEncoder passwordEncoder;

    // ==========================================
    // 1. Owner Adds Customer
    // ==========================================
    @PostMapping("/stores/{storeId}/customers")
    @Operation(summary = "Store owner registers a customer and links them to the store")
    public ResponseEntity<User> addCustomerToStore(
            @PathVariable Long storeId,
            @RequestBody Map<String, String> req) {

        PartnerStore store = partnerStoreRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found: " + storeId));

        String email = req.get("email") != null && !req.get("email").trim().isEmpty()
                ? req.get("email").trim()
                : "cust." + System.currentTimeMillis() + "@medi.in";

        String name = req.get("name") != null ? req.get("name").trim() : "Walk-in Customer";
        String phone = req.get("phone") != null ? req.get("phone").trim() : "";
        String address = req.get("customerAddress") != null ? req.get("customerAddress").trim() : "";
        String addedBy = req.get("addedBy") != null ? req.get("addedBy").trim() : "Store Owner";
        String notes = req.get("notes");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode("123456"))
                    .role("CUSTOMER")
                    .phone(phone)
                    .avatarIcon("👤")
                    .customerAddress(address)
                    .build();
            return userRepository.save(newUser);
        });

        // Link affiliation if not already linked
        if (!storeAffiliationRepository.existsByStoreIdAndUserId(storeId, user.getId())) {
            StoreAffiliation aff = StoreAffiliation.builder()
                    .storeId(storeId)
                    .userId(user.getId())
                    .role("CUSTOMER")
                    .createdAt(LocalDateTime.now())
                    .addedBy(addedBy)
                    .notes(notes)
                    .build();
            storeAffiliationRepository.save(aff);
        }

        // Record in Store History
        storeHistoryService.recordLog(
                storeId,
                "CUSTOMER_ADDED",
                "New Customer Registered: " + name,
                "Customer " + name + " (" + phone + ", " + email + ") registered and affiliated with " + store.getName() + ".",
                addedBy,
                String.valueOf(user.getId()),
                null
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    // ==========================================
    // 2. Owner Adds Doctor
    // ==========================================
    @PostMapping("/stores/{storeId}/doctors")
    @Operation(summary = "Store owner registers a doctor and links them to the store")
    public ResponseEntity<User> addDoctorToStore(
            @PathVariable Long storeId,
            @RequestBody Map<String, String> req) {

        PartnerStore store = partnerStoreRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found: " + storeId));

        String email = req.get("email") != null && !req.get("email").trim().isEmpty()
                ? req.get("email").trim()
                : "dr." + System.currentTimeMillis() + "@clinic.in";

        String name = req.get("name") != null ? req.get("name").trim() : "Doctor";
        String phone = req.get("phone") != null ? req.get("phone").trim() : "";
        String doctorRegNo = req.get("doctorRegNo") != null ? req.get("doctorRegNo").trim() : "REG-PENDING";
        String doctorSpecialty = req.get("doctorSpecialty") != null ? req.get("doctorSpecialty").trim() : "General Practice";
        String clinicAddress = req.get("clinicAddress") != null ? req.get("clinicAddress").trim() : "";
        String addedBy = req.get("addedBy") != null ? req.get("addedBy").trim() : "Store Owner";
        String notes = req.get("notes");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode("123456"))
                    .role("DOCTOR")
                    .phone(phone)
                    .avatarIcon("🩺")
                    .doctorRegNo(doctorRegNo)
                    .doctorSpecialty(doctorSpecialty)
                    .clinicAddress(clinicAddress)
                    .build();
            return userRepository.save(newUser);
        });

        // Link affiliation if not already linked
        if (!storeAffiliationRepository.existsByStoreIdAndUserId(storeId, user.getId())) {
            StoreAffiliation aff = StoreAffiliation.builder()
                    .storeId(storeId)
                    .userId(user.getId())
                    .role("DOCTOR")
                    .createdAt(LocalDateTime.now())
                    .addedBy(addedBy)
                    .notes(notes)
                    .build();
            storeAffiliationRepository.save(aff);
        }

        // Record in Store History
        storeHistoryService.recordLog(
                storeId,
                "DOCTOR_ADDED",
                "New Partner Doctor Registered: " + name,
                "Doctor " + name + " (Reg: " + doctorRegNo + ", " + doctorSpecialty + ") affiliated with " + store.getName() + ".",
                addedBy,
                String.valueOf(user.getId()),
                null
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    // ==========================================
    // 3. Get All Clients Affiliated with Store
    // ==========================================
    @GetMapping("/stores/{storeId}/clients")
    @Operation(summary = "Get all doctors and customers affiliated with a store")
    public ResponseEntity<Map<String, Object>> getStoreClients(@PathVariable Long storeId) {
        List<StoreAffiliation> affiliations = storeAffiliationRepository.findByStoreId(storeId);

        List<Long> userIds = affiliations.stream().map(StoreAffiliation::getUserId).collect(Collectors.toList());
        List<User> allClients = userRepository.findAllById(userIds);

        List<User> doctors = allClients.stream().filter(u -> "DOCTOR".equals(u.getRole())).collect(Collectors.toList());
        List<User> customers = allClients.stream().filter(u -> "CUSTOMER".equals(u.getRole())).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "storeId", storeId,
                "totalClients", allClients.size(),
                "doctors", doctors,
                "customers", customers
        ));
    }

    // ==========================================
    // 4. Restricted Store Visibility for Doctor / Customer
    // ==========================================
    @GetMapping("/auth/stores/affiliated")
    @Operation(summary = "Get only the stores affiliated with the currently logged-in doctor or customer")
    public ResponseEntity<List<PartnerStore>> getAffiliatedStoresForUser(@RequestParam Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Store owners see their own store or all stores
        if ("STORE_OWNER".equals(user.getRole())) {
            return ResponseEntity.ok(partnerStoreRepository.findAll());
        }

        // Doctors and customers: find their affiliations
        List<StoreAffiliation> affiliations = storeAffiliationRepository.findByUserId(userId);
        if (affiliations.isEmpty()) {
            // If no affiliation yet, return empty list (strict scoping)
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Long> storeIds = affiliations.stream().map(StoreAffiliation::getStoreId).collect(Collectors.toList());
        return ResponseEntity.ok(partnerStoreRepository.findAllById(storeIds));
    }

    // ==========================================
    // 5. Store History / Audit Trail Endpoints
    // ==========================================
    @GetMapping("/stores/{storeId}/history")
    @Operation(summary = "Get complete chronological history of activities for a store")
    public ResponseEntity<List<StoreHistoryLog>> getStoreHistory(@PathVariable Long storeId) {
        return ResponseEntity.ok(storeHistoryService.getStoreHistory(storeId));
    }

    @PostMapping("/stores/{storeId}/history")
    @Operation(summary = "Manually record a store note or audit entry")
    public ResponseEntity<StoreHistoryLog> addManualStoreHistoryLog(
            @PathVariable Long storeId,
            @RequestBody Map<String, Object> req) {

        String title = req.get("title") != null ? req.get("title").toString() : "Store Notice";
        String description = req.get("description") != null ? req.get("description").toString() : "";
        String performedBy = req.get("performedBy") != null ? req.get("performedBy").toString() : "Store Owner";
        String referenceId = req.get("referenceId") != null ? req.get("referenceId").toString() : null;
        Double amount = req.get("amount") != null ? Double.valueOf(req.get("amount").toString()) : null;

        StoreHistoryLog logEntry = storeHistoryService.recordLog(
                storeId,
                "MANUAL_NOTE",
                title,
                description,
                performedBy,
                referenceId,
                amount
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(logEntry);
    }
}
