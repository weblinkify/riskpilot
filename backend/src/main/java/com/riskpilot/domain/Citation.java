package com.riskpilot.domain;

/** Evidence pointer for a risk signal: which document and which extracted field. */
public record Citation(String documentId, String documentName, String field, String value) {
}
