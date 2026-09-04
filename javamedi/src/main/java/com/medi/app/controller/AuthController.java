 package com.medi.app.controller;

import com.medi.app.dto.AuthDtos;
import com.medi.app.entity.PartnerStore;
import com.medi.app.entity.User;
import com.medi.app.repository.PartnerStoreRepository;
import com.medi.app.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Profiles", description = "User profiles (Owner, Doctor, Customer) and Partner Stores")
public class AuthController {

    private final UserRepository userRepository;
    private final PartnerStoreRepository partnerStoreRepository;

    @GetMapping("/users")
    @Operation(summary = "Get all available profiles (Store Owner, Doctor, Customer)")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/stores")
    @Operation(summary = "Get preselected partner medical stores")
    public ResponseEntity<List<PartnerStore>> getPartnerStores() {
        return ResponseEntity.ok(partnerStoreRepository.findAll());
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials or switch active profile")
    public ResponseEntity<User> login(@RequestBody AuthDtos.LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));

        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
}
