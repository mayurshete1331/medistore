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
}
