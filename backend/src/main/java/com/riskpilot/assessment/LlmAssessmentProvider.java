package com.riskpilot.assessment;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StructuredMessageCreateParams;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import com.riskpilot.domain.RecommendedAction;
import com.riskpilot.domain.RiskSignal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Optional provider backed by Claude (Anthropic Messages API, official Java SDK).
 *
 * <p>Grounding strategy: the deterministic {@link MockAssessmentProvider} first extracts evidence-backed
 * signals (each with a document + field citation). Claude receives only those facts, picks which signals are
 * material, sets the score and recommendation, and writes the narrative. Signals Claude references that are not
 * in the candidate list are discarded, so every citation shown to the underwriter is real. Appetite is a hard
 * constraint: an out-of-appetite submission can never be recommended for QUOTE. Any API failure falls back to the
 * deterministic result.
 */
public class LlmAssessmentProvider implements AssessmentProvider {

    private static final Logger log = LoggerFactory.getLogger(LlmAssessmentProvider.class);

    private final MockAssessmentProvider grounding = new MockAssessmentProvider();
    private final AnthropicClient client;
    private final String model;

    public LlmAssessmentProvider(String apiKey, String model) {
        this.client = AnthropicOkHttpClient.builder().apiKey(apiKey).build();
        this.model = model;
    }

    @Override
    public String name() {
        return "anthropic";
    }

    /** Structured output schema Claude must fill. */
    public record LlmVerdict(
            @JsonPropertyDescription("Overall risk score 0-100, higher is riskier") int riskScore,
            @JsonPropertyDescription("One of QUOTE, REFER, REQUEST_INFO, DECLINE") String recommendedAction,
            @JsonPropertyDescription("Two to three sentence underwriting summary of the account") String summary,
            @JsonPropertyDescription("One to two sentences justifying the recommended action") String rationale,
            @JsonPropertyDescription("Codes of the candidate signals that materially drive the assessment")
            List<String> materialSignalCodes) {
    }

    @Override
    public AssessmentDraft assess(AssessmentInput input) {
        AssessmentDraft baseline = grounding.assess(input);
        try {
            StructuredMessageCreateParams<LlmVerdict> params = MessageCreateParams.builder()
                    .model(model)
                    .maxTokens(16000L)
                    .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.MEDIUM).build())
                    .outputConfig(LlmVerdict.class)
                    // Server-side refusal fallback: routes a refused request to a suitable fallback model.
                    .putAdditionalHeader("anthropic-beta", "server-side-fallback-2026-07-01")
                    .putAdditionalBodyProperty("fallbacks", JsonValue.from("default"))
                    .system(SYSTEM_PROMPT)
                    .addUserMessage(prompt(input, baseline))
                    .build();

            LlmVerdict verdict = client.messages().create(params).content().stream()
                    .flatMap(block -> block.text().stream())
                    .map(typed -> typed.text())
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("No structured output in response"));
            return merge(baseline, verdict, input.appetite());
        } catch (RuntimeException e) {
            log.warn("LLM assessment failed, falling back to deterministic provider: {}", e.getMessage());
            return new AssessmentDraft("anthropic→fallback:" + MockAssessmentProvider.NAME, model,
                    baseline.riskScore(), baseline.riskBand(), baseline.confidence(), baseline.summary(),
                    baseline.signals(), baseline.recommendedAction(), baseline.rationale());
        }
    }

    AssessmentDraft merge(AssessmentDraft baseline, LlmVerdict verdict, AppetiteEvaluation appetite) {
        Set<String> chosen = verdict.materialSignalCodes() == null ? Set.of()
                : verdict.materialSignalCodes().stream().collect(Collectors.toSet());
        // Citation guard: keep only signals that came from the grounded candidate list.
        List<RiskSignal> signals = baseline.signals().stream().filter(s -> chosen.contains(s.code())).toList();
        if (signals.isEmpty()) {
            signals = baseline.signals();
        }
        int score = Math.max(0, Math.min(100, verdict.riskScore()));
        RecommendedAction action;
        try {
            action = RecommendedAction.valueOf(verdict.recommendedAction());
        } catch (IllegalArgumentException | NullPointerException e) {
            action = baseline.recommendedAction();
        }
        String rationale = verdict.rationale();
        if (!appetite.result().inAppetite() && action == RecommendedAction.QUOTE) {
            action = baseline.recommendedAction(); // appetite is a hard constraint
            rationale = baseline.rationale();
        }
        return new AssessmentDraft(name(), model, score, MockAssessmentProvider.band(score), baseline.confidence(),
                verdict.summary(), signals, action, rationale);
    }

    private static final String SYSTEM_PROMPT = """
            You are an assistant to a commercial property & casualty underwriter. You RECOMMEND; the human decides.
            Use only the facts and candidate signals provided. Do not invent facts, documents or fields.
            Appetite results come from the carrier's rules engine and are authoritative: never recommend QUOTE
            for a submission that is out of appetite. Recommend REQUEST_INFO when material information (such as
            loss runs) is missing. Return the structured verdict only.""";

    private static String prompt(AssessmentInput input, AssessmentDraft baseline) {
        var s = input.submission();
        var p = s.getProperty();
        StringBuilder sb = new StringBuilder();
        sb.append("Submission ").append(s.getReference()).append(" – ").append(Labels.line(s.getLineOfBusiness())).append('\n')
                .append("Applicant: ").append(s.getApplicant().getName()).append(", ").append(s.getApplicant().getIndustry())
                .append(", ").append(s.getApplicant().getYearsInBusiness()).append(" years in business, ")
                .append(s.getApplicant().getCity()).append(", ").append(s.getApplicant().getState()).append('\n')
                .append("Property: ").append(p.getOccupancy()).append("; ").append(p.getConstructionClass().label())
                .append("; built ").append(p.getYearBuilt()).append("; ").append(p.getSquareFeet()).append(" sq ft; ")
                .append(p.isSprinklered() ? "sprinklered" : "not sprinklered").append("; PC ").append(p.getProtectionClass())
                .append("; TIV ").append(Labels.money(p.getTiv())).append('\n')
                .append("Losses (5y): ").append(input.losses().size()).append('\n')
                .append("Documents on file: ").append(input.documents().stream().map(d -> d.getType()).toList()).append('\n')
                .append("Appetite: ").append(input.appetite().result().inAppetite() ? "IN" : "OUT").append(" – ")
                .append(String.join(" ", input.appetite().result().reasons())).append("\n\n")
                .append("Candidate signals (code | label | points | evidence):\n");
        for (RiskSignal sig : baseline.signals()) {
            sb.append("- ").append(sig.code()).append(" | ").append(sig.label()).append(" | ").append(sig.points())
                    .append(" | ").append(sig.citation().documentName()).append('.').append(sig.citation().field())
                    .append(" = ").append(sig.citation().value()).append('\n');
        }
        sb.append("\nReference (rules-based) score: ").append(baseline.riskScore())
                .append(", reference action: ").append(baseline.recommendedAction());
        return sb.toString();
    }
}
