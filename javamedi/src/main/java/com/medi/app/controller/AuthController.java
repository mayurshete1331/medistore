package com.medi.app.controller;

import com.medi.app.dto.AuthDtos;
import com.medi.app.entity.PartnerStore;
import com.medi.app.entity.User;
import com.medi.app.repository.PartnerStoreRepository;
import com.medi.app.repository.UserRepository;
import com.medi.app.security.JwtUtils;
import com.medi.app.service.DataInitializer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Profiles", description = "JWT Token Generation, User profiles (Owner, Doctor, Customer) and Partner Stores")
public class AuthController {

    private final UserRepository userRepository;
    private final PartnerStoreRepository partnerStoreRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final DataInitializer dataInitializer;

    @GetMapping("/users")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STORE_OWNER')")
    @Operation(summary = "Get all available profiles or filter by role (STORE_OWNER only)")
    public ResponseEntity<List<User>> getAllUsers(@RequestParam(required = false) String role) {
        if (role != null && !role.trim().isEmpty()) {
            return ResponseEntity.ok(userRepository.findByRole(role.trim().toUpperCase()));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/stores")
    @Operation(summary = "Get preselected partner medical stores")
    public ResponseEntity<List<PartnerStore>> getPartnerStores() {
        return ResponseEntity.ok(partnerStoreRepository.findAll());
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials, generate HS512 JWT Token")
    public ResponseEntity<AuthDtos.AuthResponse> login(@RequestBody AuthDtos.LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getPassword() == null || req.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        User user = userRepository.findByEmail(req.getEmail().trim()).orElse(null);
        if (user == null || user.getPassword() == null) {
            return ResponseEntity.status(401).build();
        }

        boolean matches = passwordEncoder.matches(req.getPassword().trim(), user.getPassword());
        if (!matches) {
            return ResponseEntity.status(401).build();
        }

        // Generate HS512 JWT token and refresh token
        String jwt = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail());

        AuthDtos.AuthResponse response = AuthDtos.AuthResponse.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getExpirationMs())
                .user(user)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/owner")
    @Operation(summary = "Register a new pharmacy store and store owner account")
    public ResponseEntity<?> registerOwner(@RequestBody AuthDtos.OwnerRegisterRequest req) {
        if (req.getName() == null || req.getName().trim().isEmpty() ||
            req.getEmail() == null || req.getEmail().trim().isEmpty() ||
            req.getPassword() == null || req.getPassword().trim().length() < 4 ||
            req.getPhone() == null || req.getPhone().trim().isEmpty() ||
            req.getStoreName() == null || req.getStoreName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mandatory fields missing (Name, Email, Password, Phone, Store Name)"));
        }

        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("message", "Email address is already registered. Please sign in instead."));
        }

        String phone = req.getPhone().trim();
        String digitsOnly = phone.replaceAll("\\D", "");
        String last10 = digitsOnly.length() >= 10 ? digitsOnly.substring(digitsOnly.length() - 10) : digitsOnly;
        if (!last10.isEmpty() && !userRepository.searchCustomers("", last10).isEmpty()) {
            return ResponseEntity.status(409).body(Map.of("message", "Mobile number " + phone + " is already registered with another account."));
        }

        // 1. Create PartnerStore
        PartnerStore store = new PartnerStore();
        store.setName(req.getStoreName().trim());
        store.setAddress(req.getStoreAddress() != null && !req.getStoreAddress().trim().isEmpty() ? req.getStoreAddress().trim() : "Main Market");
        store.setPhone(phone);
        store.setEmail(email);
        store.setDlNumber(req.getStoreDlNumber() != null && !req.getStoreDlNumber().trim().isEmpty() ? req.getStoreDlNumber().trim() : "20B/MH-PENDING, 21B/MH-PENDING");
        store.setGstin(req.getStoreGstin() != null ? req.getStoreGstin().trim() : "");
        store.setDistance("0.1 km");
        store.setRating(5.0);
        store.setIsOpen(true);
        store.setDeliveryAvailable(true);
        store.setCodAvailable(true);
        PartnerStore savedStore = partnerStoreRepository.save(store);

        // 2. Create User as STORE_OWNER
        User user = new User();
        user.setName(req.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword().trim()));
        user.setRole("STORE_OWNER");
        user.setPhone(phone);
        user.setAvatarIcon("🏪");
        user.setStoreId(savedStore.getId());
        user.setStoreName(savedStore.getName());
        user.setStoreAddress(savedStore.getAddress());
        user.setStoreDlNumber(savedStore.getDlNumber());
        user.setStoreGstin(savedStore.getGstin());
        User savedUser = userRepository.save(user);

        // 3. Generate Auth Tokens
        String jwt = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole(), savedUser.getId());
        String refreshToken = jwtUtils.generateRefreshToken(savedUser.getEmail());

        AuthDtos.AuthResponse response = AuthDtos.AuthResponse.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getExpirationMs())
                .user(savedUser)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh an expired JWT token using a valid refresh token")
    public ResponseEntity<AuthDtos.AuthResponse> refreshToken(@RequestBody AuthDtos.RefreshTokenRequest req) {
        if (req.getRefreshToken() == null || !jwtUtils.validateJwtToken(req.getRefreshToken())) {
            return ResponseEntity.badRequest().build();
        }

        String email = jwtUtils.getEmailFromToken(req.getRefreshToken());
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        String newJwt = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());

        AuthDtos.AuthResponse response = AuthDtos.AuthResponse.builder()
                .token(newJwt)
                .refreshToken(req.getRefreshToken())
                .tokenType("Bearer")
                .expiresIn(jwtUtils.getExpirationMs())
                .user(user)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user details from JWT token")
    public ResponseEntity<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        String email = auth.getName();
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build());
    }

    @PutMapping("/profile")
    @Operation(summary = "Update logged-in user profile (name, phone/whatsapp, email, storeName)")
    public ResponseEntity<User> updateProfile(@RequestBody User profileUpdate) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }

        String currentEmail = auth.getName();
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (profileUpdate.getName() != null && !profileUpdate.getName().trim().isEmpty()) {
            user.setName(profileUpdate.getName().trim());
        }
        if (profileUpdate.getPhone() != null && !profileUpdate.getPhone().trim().isEmpty()) {
            user.setPhone(profileUpdate.getPhone().trim());
        }
        if (profileUpdate.getEmail() != null && !profileUpdate.getEmail().trim().isEmpty()) {
            user.setEmail(profileUpdate.getEmail().trim());
        }
        if (profileUpdate.getStoreName() != null && !profileUpdate.getStoreName().trim().isEmpty()) {
            user.setStoreName(profileUpdate.getStoreName().trim());
        }
        if (profileUpdate.getStoreAddress() != null && !profileUpdate.getStoreAddress().trim().isEmpty()) {
            user.setStoreAddress(profileUpdate.getStoreAddress().trim());
        }
        if (profileUpdate.getStoreDlNumber() != null && !profileUpdate.getStoreDlNumber().trim().isEmpty()) {
            user.setStoreDlNumber(profileUpdate.getStoreDlNumber().trim());
        }
        if (profileUpdate.getStoreGstin() != null && !profileUpdate.getStoreGstin().trim().isEmpty()) {
            user.setStoreGstin(profileUpdate.getStoreGstin().trim());
        }

        // Sync with linked PartnerStore if applicable
        if ("STORE_OWNER".equalsIgnoreCase(user.getRole())) {
            Long sId = user.getStoreId() != null ? user.getStoreId() : 1L;
            partnerStoreRepository.findById(sId).ifPresent(store -> {
                if (user.getStoreName() != null) store.setName(user.getStoreName());
                if (user.getStoreAddress() != null) store.setAddress(user.getStoreAddress());
                if (user.getPhone() != null) store.setPhone(user.getPhone());
                if (user.getEmail() != null) store.setEmail(user.getEmail());
                if (user.getStoreDlNumber() != null) store.setDlNumber(user.getStoreDlNumber());
                if (user.getStoreGstin() != null) store.setGstin(user.getStoreGstin());
                partnerStoreRepository.save(store);
            });
        }

        return ResponseEntity.ok(userRepository.save(user));
    }
}
