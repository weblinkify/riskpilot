package com.riskpilot.domain;

public record RiskSignal(String code, String label, SignalImpact impact, int points, String explanation,
                         Citation citation) {
}
