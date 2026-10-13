package com.riskpilot.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "decisions")
public class Decision {
    @Id
    private String id;
    private String submissionId;
    private String assessmentId;
    @Enumerated(EnumType.STRING)
    private RecommendedAction recommendedAction;
    @Enumerated(EnumType.STRING)
    private RecommendedAction finalAction;
    @Enumerated(EnumType.STRING)
    private DecisionOutcome outcome;
    private String reason;
    private String underwriter;
    private Instant decidedAt;

    protected Decision() {
    }

    public Decision(String id, String submissionId, String assessmentId, RecommendedAction recommendedAction,
                    RecommendedAction finalAction, DecisionOutcome outcome, String reason, String underwriter,
                    Instant decidedAt) {
        this.id = id;
        this.submissionId = submissionId;
        this.assessmentId = assessmentId;
        this.recommendedAction = recommendedAction;
        this.finalAction = finalAction;
        this.outcome = outcome;
        this.reason = reason;
        this.underwriter = underwriter;
        this.decidedAt = decidedAt;
    }

    public String getId() { return id; }
    public String getSubmissionId() { return submissionId; }
    public String getAssessmentId() { return assessmentId; }
    public RecommendedAction getRecommendedAction() { return recommendedAction; }
    public RecommendedAction getFinalAction() { return finalAction; }
    public DecisionOutcome getOutcome() { return outcome; }
    public String getReason() { return reason; }
    public String getUnderwriter() { return underwriter; }
    public Instant getDecidedAt() { return decidedAt; }
}
