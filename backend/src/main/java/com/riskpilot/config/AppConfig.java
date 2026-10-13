package com.riskpilot.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Clock;

@Configuration
public class AppConfig implements WebMvcConfigurer {

    @Value("${riskpilot.cors.allowed-origins:http://localhost:4200}")
    private String[] allowedOrigins;

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    OpenAPI riskPilotOpenApi() {
        return new OpenAPI().info(new Info().title("RiskPilot REST API").version("0.1.0")
                .description("REST endpoints of the RiskPilot underwriting workbench. Submissions, assessments and "
                        + "decisions are served over GraphQL at /graphql (GraphiQL at /graphiql)."));
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(allowedOrigins).allowedMethods("GET", "POST", "PUT", "DELETE");
        registry.addMapping("/graphql").allowedOrigins(allowedOrigins).allowedMethods("GET", "POST");
    }
}
