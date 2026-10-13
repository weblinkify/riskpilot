package com.riskpilot.domain;

import java.util.List;

public record AppetiteResult(boolean inAppetite, List<String> reasons, String matchedRuleId) {
}
