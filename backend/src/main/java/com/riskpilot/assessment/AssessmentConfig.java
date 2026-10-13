package com.riskpilot.assessment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Selects the {@link AssessmentProvider}. The app is fully functional with the default mock provider. */
@Configuration
public class AssessmentConfig {

    private static final Logger log = LoggerFactory.getLogger(AssessmentConfig.class);

    @Bean
    AssessmentProvider assessmentProvider(@Value("${riskpilot.assessment.provider:mock}") String provider,
                                          @Value("${riskpilot.anthropic.api-key:}") String apiKey,
                                          @Value("${riskpilot.anthropic.model:claude-opus-5-5}") String model) {
        if ("llm".equalsIgnoreCase(provider)) {
            if (apiKey == null || apiKey.isBlank()) {
                log.warn("ASSESSMENT_PROVIDER=llm but ANTHROPIC_API_KEY is not set – using the mock provider.");
            } else {
                log.info("Using LLM assessment provider (model {}).", model);
                return new LlmAssessmentProvider(apiKey, model);
            }
        }
        log.info("Using deterministic mock assessment provider.");
        return new MockAssessmentProvider();
    }
}
