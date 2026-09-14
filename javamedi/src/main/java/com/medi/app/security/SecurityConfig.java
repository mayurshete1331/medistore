package com.medi.app.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.vercel.app",
                "https://*.netlify.app",
                "https://*.pages.dev",
                "https://*.onrender.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public authentication & Documentation
                        .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/register/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/stores").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/system/env").permitAll()
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/swagger-resources/**"
                        ).permitAll()
                        .requestMatchers("/error").permitAll()

                        // Role-Based Store Owner Endpoints
                        .requestMatchers("/api/billing/**").hasRole("STORE_OWNER")
                        .requestMatchers("/api/analytics/**").hasRole("STORE_OWNER")
                        .requestMatchers("/api/reorder/**").hasRole("STORE_OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/medicines/**").hasRole("STORE_OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/medicines/**").hasRole("STORE_OWNER")
                        .requestMatchers(HttpMethod.PUT, "/api/orders/*/status").hasRole("STORE_OWNER")
                        .requestMatchers("/api/stores/*/customers").hasRole("STORE_OWNER")
                        .requestMatchers("/api/stores/*/doctors").hasRole("STORE_OWNER")
                        .requestMatchers("/api/stores/*/clients").hasRole("STORE_OWNER")
                        .requestMatchers(HttpMethod.POST, "/api/stores/*/history").hasRole("STORE_OWNER")
                        .requestMatchers("/api/purchase-inward/**").hasRole("STORE_OWNER")

                        // Doctor & Customer Endpoints
                        .requestMatchers("/api/orders/doctor").hasAnyRole("DOCTOR", "STORE_OWNER")
                        .requestMatchers("/api/orders/customer").hasAnyRole("CUSTOMER", "STORE_OWNER")

                        // Authenticated Shared Endpoints
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/medicines/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/orders/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/stores/*/history").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/*/affiliated-stores").authenticated()

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
