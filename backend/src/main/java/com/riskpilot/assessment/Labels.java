package com.riskpilot.assessment;

import com.riskpilot.domain.LineOfBusiness;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/** Human-readable formatting shared by the assessment engine (mirrored in the frontend mock engine). */
public final class Labels {
    private Labels() {
    }

    public static String money(BigDecimal amount) {
        NumberFormat format = NumberFormat.getIntegerInstance(Locale.US);
        return "$" + format.format(amount.setScale(0, java.math.RoundingMode.HALF_UP));
    }

    public static String line(LineOfBusiness line) {
        return switch (line) {
            case PROPERTY -> "Property";
            case COMMERCIAL_PACKAGE -> "Commercial package";
            case GENERAL_LIABILITY -> "General liability";
            case UMBRELLA -> "Umbrella";
        };
    }
}
