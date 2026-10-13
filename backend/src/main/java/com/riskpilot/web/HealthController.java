package com.riskpilot.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health")
public class HealthController {

    private final JdbcTemplate jdbc;
    private final com.riskpilot.assessment.AssessmentProvider provider;

    public HealthController(JdbcTemplate jdbc, com.riskpilot.assessment.AssessmentProvider provider) {
        this.jdbc = jdbc;
        this.provider = provider;
    }

    @GetMapping("/health")
    @Operation(summary = "Liveness + database connectivity")
    public Map<String, Object> health() {
        Integer one = jdbc.queryForObject("SELECT 1", Integer.class);
        return Map.of("status", "UP", "database", one != null && one == 1 ? "UP" : "DOWN",
                "assessmentProvider", provider.name());
    }
}
