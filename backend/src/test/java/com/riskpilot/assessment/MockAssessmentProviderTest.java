package com.riskpilot.assessment;

import com.riskpilot.domain.AppetiteResult;
import com.riskpilot.domain.RecommendedAction;
import com.riskpilot.domain.RiskBand;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static com.riskpilot.TestData.submission;
import static com.riskpilot.domain.ConstructionClass.FRAME;
import static com.riskpilot.domain.LineOfBusiness.PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;

class MockAssessmentProviderTest {

    private static final AppetiteEvaluation IN = new AppetiteEvaluation(new AppetiteResult(true, List.of("ok"), "1"), null);

    @ParameterizedTest
    @CsvSource({"0,LOW", "29,LOW", "30,MODERATE", "49,MODERATE", "50,ELEVATED", "69,ELEVATED", "70,HIGH", "100,HIGH"})
    void bands(int score, RiskBand band) {
        assertThat(MockAssessmentProvider.band(score)).isEqualTo(band);
    }

    @Test
    void recommendationFollowsAppetiteThenDataThenScore() {
        var outTiv = new AppetiteEvaluation(new AppetiteResult(false, List.of("TIV over"), null), 0.2);
        var outFar = new AppetiteEvaluation(new AppetiteResult(false, List.of("TIV over"), null), 0.6);
        var outState = new AppetiteEvaluation(new AppetiteResult(false, List.of("not written"), null), null);

        assertThat(MockAssessmentProvider.recommend(outTiv, true, 10)).isEqualTo(RecommendedAction.REFER);
        assertThat(MockAssessmentProvider.recommend(outFar, true, 10)).isEqualTo(RecommendedAction.DECLINE);
        assertThat(MockAssessmentProvider.recommend(outState, true, 10)).isEqualTo(RecommendedAction.DECLINE);
        assertThat(MockAssessmentProvider.recommend(IN, false, 10)).isEqualTo(RecommendedAction.REQUEST_INFO);
        assertThat(MockAssessmentProvider.recommend(IN, true, 75)).isEqualTo(RecommendedAction.DECLINE);
        assertThat(MockAssessmentProvider.recommend(IN, true, 55)).isEqualTo(RecommendedAction.REFER);
        assertThat(MockAssessmentProvider.recommend(IN, true, 54)).isEqualTo(RecommendedAction.QUOTE);
    }

    @Test
    void missingDocumentsProduceExplicitSignalsWithCitations() {
        var draft = new MockAssessmentProvider().assess(
                new AssessmentInput(submission(PROPERTY, "TX", FRAME, 1_000_000), List.of(), List.of(), IN));
        assertThat(draft.recommendedAction()).isEqualTo(RecommendedAction.REQUEST_INFO);
        assertThat(draft.signals()).extracting(s -> s.code()).contains("LOSS_RUNS_MISSING", "NO_INSPECTION", "CONSTRUCTION");
        assertThat(draft.signals()).allSatisfy(s -> assertThat(s.citation().documentName()).isNotBlank());
        assertThat(draft.confidence()).isEqualTo(0.6);
    }
}
