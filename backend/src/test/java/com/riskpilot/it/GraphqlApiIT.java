package com.riskpilot.it;

import com.riskpilot.TestcontainersConfiguration;
import com.riskpilot.repository.AuditRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.graphql.tester.AutoConfigureGraphQlTester;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureGraphQlTester
@Import(TestcontainersConfiguration.class)
@Transactional
class GraphqlApiIT {

    @Autowired
    GraphQlTester graphQl;
    @Autowired
    AuditRepository auditRepository;

    @Test
    void inboxIsSeededAndPaginated() {
        graphQl.document("{ submissions(page: 0, size: 10) { total page size items { id status applicant { name } } } }")
                .execute()
                .path("submissions.total").entity(Integer.class).isEqualTo(40)
                .path("submissions.items").entityList(Object.class).hasSize(10);
    }

    @Test
    void filtersByStatusAndSearch() {
        graphQl.document("""
                        query($f: SubmissionFilter) { submissions(filter: $f, size: 50) { total items { status } } }""")
                .variable("f", Map.of("statuses", List.of("NEW")))
                .execute()
                .path("submissions.total").entity(Integer.class).isEqualTo(10)
                .path("submissions.items[*].status").entityList(String.class).satisfies(l -> assertThat(l).containsOnly("NEW"));

        graphQl.document("""
                        query($f: SubmissionFilter) { submissions(filter: $f) { total items { applicant { name } } } }""")
                .variable("f", Map.of("search", "harborview"))
                .execute()
                .path("submissions.total").entity(Integer.class).isEqualTo(1);
    }

    @Test
    void submissionDetailResolvesNestedData() {
        graphQl.document("""
                        { submission(id: "SUB-1001") { reference property { tiv constructionClass } losses { id }
                          documents { fileName extractedFields { key value } } decisions { id } latestAssessment { id } } }""")
                .execute()
                .path("submission.reference").entity(String.class).isEqualTo("RP-2026-01001")
                .path("submission.documents").entityList(Object.class).hasSizeGreaterThan(2)
                .path("submission.latestAssessment").valueIsNull();
    }

    @Test
    void assessThenAcceptAndOverride() {
        String assessmentId = graphQl.document("""
                        mutation { runAssessment(submissionId: "SUB-1003") { id riskScore recommendedAction
                          signals { code citation { documentName field } } appetite { inAppetite reasons } } }""")
                .execute()
                .path("runAssessment.signals[*].citation.documentName").entityList(String.class)
                .satisfies(names -> assertThat(names).isNotEmpty().allSatisfy(n -> assertThat(n).isNotBlank()))
                .path("runAssessment.id").entity(String.class).get();

        String recommended = graphQl.document("{ submission(id: \"SUB-1003\") { status latestAssessment { recommendedAction } } }")
                .execute()
                .path("submission.status").entity(String.class).isEqualTo("IN_REVIEW")
                .path("submission.latestAssessment.recommendedAction").entity(String.class).get();

        // Override without a reason is rejected (human-in-the-loop guard).
        String other = recommended.equals("DECLINE") ? "QUOTE" : "DECLINE";
        graphQl.document("""
                        mutation($i: DecisionInput!) { recordDecision(input: $i) { id } }""")
                .variable("i", Map.of("submissionId", "SUB-1003", "assessmentId", assessmentId, "finalAction", other,
                        "underwriter", "Test UW"))
                .execute()
                .errors().satisfy(errors -> assertThat(errors).singleElement()
                        .satisfies(e -> assertThat(e.getMessage()).contains("requires a reason")));

        // Override with reason is stored and audited.
        graphQl.document("""
                        mutation($i: DecisionInput!) { recordDecision(input: $i) { outcome finalAction recommendedAction reason } }""")
                .variable("i", Map.of("submissionId", "SUB-1003", "assessmentId", assessmentId, "finalAction", other,
                        "reason", "Broker relationship and risk improvements verified on site.", "underwriter", "Test UW"))
                .execute()
                .path("recordDecision.outcome").entity(String.class).isEqualTo("OVERRIDDEN")
                .path("recordDecision.recommendedAction").entity(String.class).isEqualTo(recommended);

        graphQl.document("{ auditLog(submissionId: \"SUB-1003\") { action actor details } }")
                .execute()
                .path("auditLog[*].action").entityList(String.class)
                .satisfies(actions -> assertThat(actions).startsWith("DECISION_OVERRIDDEN", "ASSESSMENT_RUN"));
    }

    @Test
    void dashboardKpis() {
        graphQl.document("{ dashboard { totalSubmissions byStatus { status count } byLine { lineOfBusiness count } avgHoursToDecision quoteToBindRatio } }")
                .execute()
                .path("dashboard.totalSubmissions").entity(Integer.class).isEqualTo(40)
                .path("dashboard.quoteToBindRatio").entity(Double.class).isEqualTo(Math.round(7.0 / 15 * 1000) / 1000.0)
                .path("dashboard.avgHoursToDecision").entity(Double.class).satisfies(h -> assertThat(h).isPositive());
    }
}
