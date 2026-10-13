package com.riskpilot.domain;

/** A field extracted from a submission document (e.g. ACORD 140 → year_built). */
public record ExtractedField(String key, String label, String value) {
}
