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
}
