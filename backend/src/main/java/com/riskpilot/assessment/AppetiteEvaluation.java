package com.riskpilot.assessment;

import com.riskpilot.domain.AppetiteResult;

/**
 * Appetite outcome plus, when the only failure was TIV, how far over the limit it is
 * (e.g. 0.12 = 12 % over). Used to decide REFER vs DECLINE.
 */
public record AppetiteEvaluation(AppetiteResult result, Double tivExcessRatio) {
}
