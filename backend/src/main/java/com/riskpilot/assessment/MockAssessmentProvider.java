package com.riskpilot.assessment;

import com.riskpilot.domain.Citation;
import com.riskpilot.domain.ConstructionClass;
import com.riskpilot.domain.ExtractedField;
import com.riskpilot.domain.Loss;
import com.riskpilot.domain.RecommendedAction;
import com.riskpilot.domain.RiskBand;
import com.riskpilot.domain.RiskSignal;
import com.riskpilot.domain.SignalImpact;
import com.riskpilot.domain.Submission;
import com.riskpilot.domain.SubmissionDocument;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Deterministic, rule-based scorer (the default provider). Every signal cites the document and
 * extracted field it was derived from. The frontend's in-browser mock engine
 * ({@code frontend/src/app/mock/assessment-engine.ts}) is a line-by-line port of this class, and a
 * shared golden file keeps the two in lock-step.
 *
 * <p>Score = clamp(25 + Σ signal points, 0, 100). Bands: &lt;30 LOW, &lt;50 MODERATE, &lt;70 ELEVATED, else HIGH.
 */
public class MockAssessmentProvider implements AssessmentProvider {

    public static final String NAME = "mock-rules-v1";
    static final int BASE_SCORE = 25;
    static final int DECLINE_THRESHOLD = 75;
    static final int REFER_THRESHOLD = 55;
    static final double REFER_TIV_TOLERANCE = 0.25;

    private static final Map<ConstructionClass, Integer> CONSTRUCTION_POINTS = Map.of(
            ConstructionClass.FRAME, 18,
            ConstructionClass.JOISTED_MASONRY, 12,
            ConstructionClass.NON_COMBUSTIBLE, 6,
            ConstructionClass.MASONRY_NON_COMBUSTIBLE, 2,
            ConstructionClass.MODIFIED_FIRE_RESISTIVE, -2,
            ConstructionClass.FIRE_RESISTIVE, -4);

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public AssessmentDraft assess(AssessmentInput input) {
        List<RiskSignal> signals = signals(input);
        int score = Math.max(0, Math.min(100, BASE_SCORE + signals.stream().mapToInt(RiskSignal::points).sum()));
        RiskBand band = band(score);
        boolean hasLossRuns = find(input.documents(), "LOSS_RUNS").isPresent();
        RecommendedAction action = recommend(input.appetite(), hasLossRuns, score);
        return new AssessmentDraft(NAME, null, score, band, confidence(input.documents()),
                summary(input.submission(), score, band, signals), signals, action,
                rationale(action, input.appetite(), score));
    }

    // ------------------------------------------------------------------ signals

    List<RiskSignal> signals(AssessmentInput input) {
        Submission s = input.submission();
        var p = s.getProperty();
        List<SubmissionDocument> docs = input.documents();
        List<RiskSignal> out = new ArrayList<>();

        int constructionPts = CONSTRUCTION_POINTS.get(p.getConstructionClass());
        add(out, "CONSTRUCTION", "Construction class", constructionPts,
                p.getConstructionClass().label() + (constructionPts > 0 ? " is combustible-leaning." : " is fire-resistive."),
                cite(docs, "ACORD_140", "construction_class"));

        add(out, "SPRINKLERS", p.isSprinklered() ? "Fully sprinklered" : "No sprinkler protection",
                p.isSprinklered() ? -8 : 10,
                p.isSprinklered() ? "Automatic sprinklers materially reduce fire severity."
                        : "No automatic sprinkler system reported.",
                cite(docs, "ACORD_140", "sprinklered"));

        int pc = p.getProtectionClass();
        int pcPts = pc >= 8 ? 10 : pc >= 5 ? 4 : -2;
        add(out, "PROTECTION_CLASS", "ISO protection class " + pc, pcPts,
                pc >= 8 ? "Limited public fire protection (PC 8–10)." : pc >= 5 ? "Average public fire protection."
                        : "Strong public fire protection (PC 1–4).",
                cite(docs, "ACORD_140", "protection_class"));

        int yb = p.getYearBuilt();
        int agePts = yb < 1970 ? 10 : yb < 1990 ? 5 : yb >= 2010 ? -3 : 0;
        add(out, "BUILDING_AGE", "Built " + yb, agePts,
                agePts > 0 ? "Older building; wiring, plumbing and roof systems may predate modern codes."
                        : "Modern construction to current building codes.",
                cite(docs, "ACORD_140", "year_built"));

        var lossRuns = find(docs, "LOSS_RUNS");
        if (lossRuns.isPresent()) {
            int count = input.losses().size();
            int freqPts = count == 0 ? -6 : count == 1 ? 0 : count <= 3 ? 8 : 15;
            add(out, "LOSS_FREQUENCY", count + (count == 1 ? " loss" : " losses") + " in 5 years", freqPts,
                    count == 0 ? "Loss-free for the last five years." : "Loss frequency above the class average.",
                    cite(docs, "LOSS_RUNS", "loss_count_5y"));
            BigDecimal incurred = input.losses().stream().map(Loss::incurred).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (incurred.compareTo(BigDecimal.valueOf(250_000)) > 0) {
                add(out, "LOSS_SEVERITY", "Large incurred losses", 8,
                        Labels.money(incurred) + " incurred over five years.",
                        cite(docs, "LOSS_RUNS", "total_incurred_5y"));
            }
            long open = input.losses().stream().filter(Loss::isOpen).count();
            if (open > 0) {
                add(out, "OPEN_CLAIMS", open + " open " + (open == 1 ? "claim" : "claims"), 5,
                        "Open reserves may still develop adversely.", cite(docs, "LOSS_RUNS", "open_claims"));
            }
        } else {
            out.add(new RiskSignal("LOSS_RUNS_MISSING", "Loss runs not provided", SignalImpact.INCREASES_RISK, 5,
                    "Loss experience cannot be verified without currently valued loss runs.",
                    new Citation(null, "Submission package", "documents", "No LOSS_RUNS document")));
        }

        double coast = p.getDistanceToCoastMiles().doubleValue();
        int coastPts = coast < 5 ? 12 : coast < 25 ? 5 : 0;
        add(out, "COASTAL_EXPOSURE", fmt(coast) + " mi to coast", coastPts,
                coast < 5 ? "Within 5 miles of the coast: windstorm and surge exposure."
                        : "Within 25 miles of the coast: elevated windstorm exposure.",
                cite(docs, "SOV", "distance_to_coast_miles"));

        String zone = p.getFloodZone();
        int floodPts = zone.startsWith("V") ? 10 : zone.startsWith("A") ? 6 : 0;
        add(out, "FLOOD_ZONE", "FEMA flood zone " + zone, floodPts,
                zone.startsWith("V") ? "Coastal high-hazard flood zone." : "Special flood hazard area (1% annual chance).",
                cite(docs, "SOV", "flood_zone"));

        if (find(docs, "INSPECTION_REPORT").isPresent()) {
            Integer roof = p.getRoofAgeYears();
            if (roof != null) {
                int roofPts = roof > 20 ? 8 : roof < 10 ? -3 : 0;
                add(out, "ROOF_AGE", "Roof age " + roof + " yrs", roofPts,
                        roof > 20 ? "Roof beyond typical service life; wind/hail vulnerability."
                                : "Recently replaced roof.",
                        cite(docs, "INSPECTION_REPORT", "roof_age_years"));
            }
            Integer recs = p.getOpenRecommendations();
            if (recs != null && recs >= 3) {
                add(out, "OPEN_RECOMMENDATIONS", recs + " open loss-control recommendations", 5,
                        "Outstanding recommendations from the last inspection.",
                        cite(docs, "INSPECTION_REPORT", "open_recommendations"));
            }
        } else {
            out.add(new RiskSignal("NO_INSPECTION", "No inspection report", SignalImpact.INFORMATIONAL, 0,
                    "Roof condition and loss-control status are unverified; consider ordering an inspection.",
                    new Citation(null, "Submission package", "documents", "No INSPECTION_REPORT document")));
        }

        int years = s.getApplicant().getYearsInBusiness();
        int yearsPts = years < 3 ? 6 : years >= 15 ? -4 : 0;
        add(out, "YEARS_IN_BUSINESS", years + (years == 1 ? " year" : " years") + " in business", yearsPts,
                years < 3 ? "Limited operating history." : "Established operation with long track record.",
                cite(docs, "ACORD_125", "years_in_business"));

        if (p.getTiv().compareTo(BigDecimal.valueOf(30_000_000)) > 0) {
            add(out, "TIV_CONCENTRATION", "High single-location TIV", 6,
                    Labels.money(p.getTiv()) + " concentrated at one location.",
                    cite(docs, "SOV", "total_insured_value"));
        }
        return out;
    }

    private static void add(List<RiskSignal> out, String code, String label, int points, String explanation,
                            Citation citation) {
        if (points == 0) {
            return; // only material signals are shown
        }
        SignalImpact impact = points > 0 ? SignalImpact.INCREASES_RISK : SignalImpact.DECREASES_RISK;
        out.add(new RiskSignal(code, label, impact, points, explanation, citation));
    }

    static Optional<SubmissionDocument> find(List<SubmissionDocument> docs, String type) {
        return docs.stream().filter(d -> type.equals(d.getType())).findFirst();
    }

    static Citation cite(List<SubmissionDocument> docs, String type, String field) {
        return find(docs, type)
                .map(d -> new Citation(d.getId(), d.getFileName(), field, d.getExtractedFields().stream()
                        .filter(f -> f.key().equals(field)).map(ExtractedField::value).findFirst().orElse("—")))
                .orElse(new Citation(null, type + " (not on file)", field, "—"));
    }

    private static String fmt(double miles) {
        return miles == Math.rint(miles) ? String.valueOf((long) miles) : String.valueOf(miles);
    }

    // ------------------------------------------------------------------ scoring

    static RiskBand band(int score) {
        if (score < 30) return RiskBand.LOW;
        if (score < 50) return RiskBand.MODERATE;
        if (score < 70) return RiskBand.ELEVATED;
        return RiskBand.HIGH;
    }

    static double confidence(List<SubmissionDocument> docs) {
        double c = 0.6;
        if (find(docs, "LOSS_RUNS").isPresent()) c += 0.2;
        if (find(docs, "INSPECTION_REPORT").isPresent()) c += 0.12;
        if (find(docs, "FINANCIAL_STATEMENT").isPresent()) c += 0.05;
        return BigDecimal.valueOf(c).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    static RecommendedAction recommend(AppetiteEvaluation appetite, boolean hasLossRuns, int score) {
        if (!appetite.result().inAppetite()) {
            Double excess = appetite.tivExcessRatio();
            return excess != null && excess <= REFER_TIV_TOLERANCE ? RecommendedAction.REFER : RecommendedAction.DECLINE;
        }
        if (!hasLossRuns) return RecommendedAction.REQUEST_INFO;
        if (score >= DECLINE_THRESHOLD) return RecommendedAction.DECLINE;
        if (score >= REFER_THRESHOLD) return RecommendedAction.REFER;
        return RecommendedAction.QUOTE;
    }

    static String rationale(RecommendedAction action, AppetiteEvaluation appetite, int score) {
        if (!appetite.result().inAppetite()) {
            if (action == RecommendedAction.REFER) {
                long pct = Math.round(appetite.tivExcessRatio() * 100);
                return "TIV is " + pct + "% over the rule limit, within referral tolerance (25%). Refer to a senior underwriter for authority.";
            }
            return "Outside carrier appetite: " + appetite.result().reasons().get(0);
        }
        return switch (action) {
            case REQUEST_INFO -> "In appetite, but loss runs are missing. Request 5-year currently valued loss runs before pricing.";
            case DECLINE -> "Risk score " + score + " is at or above the decline threshold (" + DECLINE_THRESHOLD + ").";
            case REFER -> "Risk score " + score + " is in the referral band (" + REFER_THRESHOLD + "–" + (DECLINE_THRESHOLD - 1) + "). Senior review recommended.";
            case QUOTE -> "In appetite with risk score " + score + ". Proceed to quote at standard terms.";
        };
    }

    static String summary(Submission s, int score, RiskBand band, List<RiskSignal> signals) {
        var p = s.getProperty();
        List<String> drivers = signals.stream()
                .filter(sig -> sig.impact() == SignalImpact.INCREASES_RISK)
                .sorted((a, b) -> Integer.compare(b.points(), a.points()))
                .limit(2).map(sig -> sig.label().toLowerCase()).toList();
        String driverText = drivers.isEmpty() ? "no material adverse signals" : String.join(" and ", drivers);
        return s.getApplicant().getName() + ": " + p.getOccupancy().toLowerCase() + " in " + s.getApplicant().getCity()
                + ", " + s.getApplicant().getState() + ". " + p.getConstructionClass().label() + ", built "
                + p.getYearBuilt() + ", TIV " + Labels.money(p.getTiv()) + ". Risk score " + score + " ("
                + band.name().toLowerCase() + "), driven mainly by " + driverText + ".";
    }
}
