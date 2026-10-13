package com.riskpilot.assessment;

import com.riskpilot.domain.RecommendedAction;
import com.riskpilot.domain.RiskBand;
import com.riskpilot.domain.RiskSignal;

import java.util.List;

/** Provider output before it is persisted as an {@link com.riskpilot.domain.Assessment}. */
public record AssessmentDraft(String provider, String model, int riskScore, RiskBand riskBand, double confidence,
                              String summary, List<RiskSignal> signals, RecommendedAction recommendedAction,
                              String rationale) {
}
