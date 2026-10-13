package com.riskpilot.assessment;

import com.riskpilot.domain.AppetiteResult;
import com.riskpilot.domain.AppetiteRule;
import com.riskpilot.domain.Submission;
import org.springframework.stereotype.Component;

import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

/**
 * Deterministic appetite check against the carrier's rules.
 * <ol>
 *   <li>Only active rules for the submission's line of business are considered.</li>
 *   <li>Rules for the submission's state are authoritative; otherwise "any state" rules apply.</li>
 *   <li>A rule's construction class is a minimum (FRAME=1 … FIRE_RESISTIVE=6).</li>
 *   <li>Of the remaining rules the one with the highest max TIV (lowest id on ties) decides.</li>
 * </ol>
 * The frontend mock engine implements the identical algorithm.
 */
@Component
public class AppetiteEvaluator {

    public AppetiteEvaluation evaluate(Submission submission, List<AppetiteRule> rules) {
        var line = submission.getLineOfBusiness();
        var state = submission.getApplicant().getState();
        var construction = submission.getProperty().getConstructionClass();
        var tiv = submission.getProperty().getTiv();
        var lineLabel = Labels.line(line);

        List<AppetiteRule> forLine = rules.stream().filter(AppetiteRule::isActive)
                .filter(r -> r.getLineOfBusiness() == line).toList();
        if (forLine.isEmpty()) {
            return out("No active appetite rule covers " + lineLabel + ".", null);
        }
        List<AppetiteRule> forState = forLine.stream().filter(r -> state.equals(r.getState())).toList();
        if (forState.isEmpty()) {
            forState = forLine.stream().filter(r -> r.getState() == null).toList();
        }
        if (forState.isEmpty()) {
            return out(lineLabel + " is not written in " + state + ".", null);
        }
        List<AppetiteRule> forConstruction = forState.stream()
                .filter(r -> construction.meetsMinimum(r.getConstructionClass())).toList();
        if (forConstruction.isEmpty()) {
            return out(construction.label() + " is below the minimum construction class for " + lineLabel
                    + " in " + state + ".", null);
        }
        AppetiteRule best = forConstruction.stream()
                .sorted(Comparator.comparing(AppetiteRule::getMaxTiv).reversed()
                        .thenComparing(AppetiteRule::getId))
                .findFirst().orElseThrow();
        if (tiv.compareTo(best.getMaxTiv()) <= 0) {
            return new AppetiteEvaluation(new AppetiteResult(true, List.of(
                    "Matches rule \"" + best.getName() + "\": TIV " + Labels.money(tiv) + " is within the "
                            + Labels.money(best.getMaxTiv()) + " limit."), String.valueOf(best.getId())), null);
        }
        double excess = tiv.subtract(best.getMaxTiv()).divide(best.getMaxTiv(), 4, RoundingMode.HALF_UP).doubleValue();
        return out("TIV " + Labels.money(tiv) + " exceeds the " + Labels.money(best.getMaxTiv()) + " limit of rule \""
                + best.getName() + "\".", excess);
    }

    private static AppetiteEvaluation out(String reason, Double excess) {
        return new AppetiteEvaluation(new AppetiteResult(false, List.of(reason), null), excess);
    }
}
