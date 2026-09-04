package com.medi.app.dto;

import lombok.Data;

public class AuthDtos {

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
        private String role;
    }

    @Data
    public static class SwitchRoleRequest {
        private String role; // STORE_OWNER, DOCTOR, CUSTOMER
    }

    @Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String refreshToken;
        private String tokenType; // "Bearer"
        private Long expiresIn;
        private com.medi.app.entity.User user;
    }

    @Data
    public static class RefreshTokenRequest {
        private String refreshToken;
    }
}
