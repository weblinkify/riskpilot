package com.riskpilot.domain;

/** ISO construction classes, ordered from most (FRAME) to least combustible (FIRE_RESISTIVE). */
public enum ConstructionClass {
    FRAME("Frame (ISO 1)"),
    JOISTED_MASONRY("Joisted masonry (ISO 2)"),
    NON_COMBUSTIBLE("Non-combustible (ISO 3)"),
    MASONRY_NON_COMBUSTIBLE("Masonry non-combustible (ISO 4)"),
    MODIFIED_FIRE_RESISTIVE("Modified fire resistive (ISO 5)"),
    FIRE_RESISTIVE("Fire resistive (ISO 6)");

    private final String label;

    ConstructionClass(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    /** True if this class is at least as fire-resistive as {@code minimum}. */
    public boolean meetsMinimum(ConstructionClass minimum) {
        return minimum == null || ordinal() >= minimum.ordinal();
    }
}
