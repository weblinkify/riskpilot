package com.riskpilot.it;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.riskpilot.TestcontainersConfiguration;
import com.riskpilot.assessment.AppetiteEvaluator;
import com.riskpilot.assessment.AssessmentInput;
import com.riskpilot.assessment.MockAssessmentProvider;
import com.riskpilot.domain.Submission;
import com.riskpilot.repository.AppetiteRuleRepository;
import com.riskpilot.repository.DocumentRepository;
import com.riskpilot.repository.LossRepository;
import com.riskpilot.repository.SubmissionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Keeps the Java scorer and the frontend's in-browser port in lock-step: both must reproduce the same golden
 * file for all 40 seed submissions. Regenerate with {@code ./mvnw verify -Dgolden.update=true}.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class AssessmentParityIT {

    static final Path GOLDEN = Path.of("../frontend/src/app/mock/assessment-golden.json");

    @Autowired SubmissionRepository submissions;
    @Autowired LossRepository losses;
    @Autowired DocumentRepository documents;
    @Autowired AppetiteRuleRepository rules;
    @Autowired ObjectMapper mapper;

    @Test
    void mockProviderMatchesGoldenFile() throws Exception {
        var provider = new MockAssessmentProvider();
        var evaluator = new AppetiteEvaluator();
        var allRules = rules.findAllByOrderByIdAsc();
        Map<String, Object> out = new LinkedHashMap<>();
        for (Submission s : submissions.findAll(Sort.by("id"))) {
            var appetite = evaluator.evaluate(s, allRules);
            var draft = provider.assess(new AssessmentInput(s, losses.findBySubmissionIdOrderByLossDateDesc(s.getId()),
                    documents.findBySubmissionIdOrderByUploadedAtAsc(s.getId()), appetite));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("riskScore", draft.riskScore());
            row.put("riskBand", draft.riskBand());
            row.put("confidence", draft.confidence());
            row.put("recommendedAction", draft.recommendedAction());
            row.put("rationale", draft.rationale());
            row.put("summary", draft.summary());
            row.put("appetite", appetite.result());
            row.put("signals", draft.signals());
            out.put(s.getId(), row);
        }
        String actual = mapper.copy().enable(SerializationFeature.INDENT_OUTPUT).writeValueAsString(out) + "\n";

        if (Boolean.getBoolean("golden.update")) {
            Files.writeString(GOLDEN, actual);
        }
        assertThat(GOLDEN).as("golden file – run ./mvnw verify -Dgolden.update=true").exists();
        JsonNode expected = mapper.readTree(Files.readString(GOLDEN));
        assertThat(mapper.readTree(actual)).isEqualTo(expected);
        assertThat(expected.size()).isEqualTo(40);
    }
}
