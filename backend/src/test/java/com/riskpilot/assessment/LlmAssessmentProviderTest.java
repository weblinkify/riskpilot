package com.riskpilot.assessment;

import com.riskpilot.domain.AppetiteResult;
import com.riskpilot.domain.RecommendedAction;
import com.riskpilot.domain.RiskBand;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.riskpilot.TestData.submission;
import static com.riskpilot.domain.ConstructionClass.FRAME;
import static com.riskpilot.domain.LineOfBusiness.PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;

/** Tests the grounding/guard logic applied to Claude's verdict (no network calls). */
class LlmAssessmentProviderTest {

    private final LlmAssessmentProvider provider = new LlmAssessmentProvider("test-key", "claude-opus-5-5");
    private static final AppetiteEvaluation IN = new AppetiteEvaluation(new AppetiteResult(true, List.of("ok"), "1"), null);
    private static final AppetiteEvaluation OUT = new AppetiteEvaluation(new AppetiteResult(false, List.of("not written"), null), null);

    private AssessmentDraft baseline(AppetiteEvaluation appetite) {
        return new MockAssessmentProvider().assess(
                new AssessmentInput(submission(PROPERTY, "TX", FRAME, 1_000_000), List.of(), List.of(), appetite));
    }

    @Test
    void dropsSignalsThatAreNotInTheGroundedCandidateList() {
        var verdict = new LlmAssessmentProvider.LlmVerdict(42, "REQUEST_INFO", "summary", "why",
                List.of("CONSTRUCTION", "INVENTED_SIGNAL"));
        var draft = provider.merge(baseline(IN), verdict, IN);
        assertThat(draft.signals()).extracting(s -> s.code()).containsExactly("CONSTRUCTION");
        assertThat(draft.riskScore()).isEqualTo(42);
        assertThat(draft.riskBand()).isEqualTo(RiskBand.MODERATE);
        assertThat(draft.provider()).isEqualTo("anthropic");
    }

    @Test
    void neverQuotesAnOutOfAppetiteSubmission() {
        var verdict = new LlmAssessmentProvider.LlmVerdict(10, "QUOTE", "summary", "looks fine", List.of());
        var base = baseline(OUT);
        var draft = provider.merge(base, verdict, OUT);
        assertThat(draft.recommendedAction()).isEqualTo(RecommendedAction.DECLINE);
        assertThat(draft.rationale()).isEqualTo(base.rationale());
        assertThat(draft.signals()).isEqualTo(base.signals()); // nothing selected → keep all grounded signals
    }

    @Test
    void fallsBackToBaselineActionWhenModelReturnsUnknownAction() {
        var verdict = new LlmAssessmentProvider.LlmVerdict(150, "BIND_IT", "summary", "why", List.of());
        var base = baseline(IN);
        var draft = provider.merge(base, verdict, IN);
        assertThat(draft.recommendedAction()).isEqualTo(base.recommendedAction());
        assertThat(draft.riskScore()).isEqualTo(100);
    }
}
