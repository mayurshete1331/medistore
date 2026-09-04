package com.medi.app.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
@Tag(name = "System & Environment", description = "System health, runtime environment details (dev, qa, stage, prod)")
public class SystemEnvironmentController {

    private final Environment environment;

    @Value("${app.environment:DEV}")
    private String appEnvironment;

    @Value("${server.port:8081}")
    private Integer serverPort;

    @GetMapping("/env")
    @Operation(summary = "Get current active environment and profile details")
    public ResponseEntity<Map<String, Object>> getEnvironmentInfo() {
        String[] activeProfiles = environment.getActiveProfiles();
        String active = activeProfiles.length > 0 ? activeProfiles[0] : "dev";

        return ResponseEntity.ok(Map.of(
                "environment", appEnvironment.toUpperCase(),
                "activeProfile", active,
                "allActiveProfiles", Arrays.asList(activeProfiles),
                "serverPort", serverPort,
                "status", "HEALTHY",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
