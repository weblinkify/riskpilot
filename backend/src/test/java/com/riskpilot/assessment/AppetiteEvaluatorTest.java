package com.riskpilot.assessment;

import com.riskpilot.domain.AppetiteRule;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.riskpilot.TestData.rule;
import static com.riskpilot.TestData.submission;
import static com.riskpilot.domain.ConstructionClass.FIRE_RESISTIVE;
import static com.riskpilot.domain.ConstructionClass.FRAME;
import static com.riskpilot.domain.ConstructionClass.MASONRY_NON_COMBUSTIBLE;
import static com.riskpilot.domain.LineOfBusiness.PROPERTY;
import static com.riskpilot.domain.LineOfBusiness.UMBRELLA;
import static org.assertj.core.api.Assertions.assertThat;

class AppetiteEvaluatorTest {

    private final AppetiteEvaluator evaluator = new AppetiteEvaluator();
    private final List<AppetiteRule> rules = List.of(
            rule(1, "Core property", PROPERTY, null, null, 25_000_000, true),
            rule(2, "FL masonry", PROPERTY, "FL", MASONRY_NON_COMBUSTIBLE, 15_000_000, true),
            rule(3, "LA paused", PROPERTY, "LA", null, 5_000_000, false));

    @Test
    void inAppetiteWhenGeneralRuleMatches() {
        var result = evaluator.evaluate(submission(PROPERTY, "TX", FRAME, 10_000_000), rules);
        assertThat(result.result().inAppetite()).isTrue();
        assertThat(result.result().matchedRuleId()).isEqualTo("1");
        assertThat(result.result().reasons().get(0)).contains("Core property").contains("$25,000,000");
    }

    @Test
    void stateSpecificRuleIsAuthoritative() {
        var frame = evaluator.evaluate(submission(PROPERTY, "FL", FRAME, 1_000_000), rules);
        assertThat(frame.result().inAppetite()).isFalse();
        assertThat(frame.result().reasons().get(0)).contains("below the minimum construction class");

        var fireResistive = evaluator.evaluate(submission(PROPERTY, "FL", FIRE_RESISTIVE, 1_000_000), rules);
        assertThat(fireResistive.result().inAppetite()).isTrue();
        assertThat(fireResistive.result().matchedRuleId()).isEqualTo("2");
    }

    @Test
    void inactiveRulesAreIgnored() {
        var result = evaluator.evaluate(submission(PROPERTY, "LA", FRAME, 20_000_000), rules);
        assertThat(result.result().inAppetite()).isTrue();
        assertThat(result.result().matchedRuleId()).isEqualTo("1");
    }

    @Test
    void tivOverLimitReportsExcessRatio() {
        var result = evaluator.evaluate(submission(PROPERTY, "TX", FRAME, 30_000_000), rules);
        assertThat(result.result().inAppetite()).isFalse();
        assertThat(result.tivExcessRatio()).isEqualTo(0.2);
    }

    @Test
    void noRuleForLine() {
        var result = evaluator.evaluate(submission(UMBRELLA, "TX", FRAME, 1), rules);
        assertThat(result.result().inAppetite()).isFalse();
        assertThat(result.result().reasons()).containsExactly("No active appetite rule covers Umbrella.");
    }
}
