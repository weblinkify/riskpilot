package com.riskpilot.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "assessments")
public class Assessment {
    @Id
    private String id;
    private String submissionId;
    private String provider;
    private String model;
    private int riskScore;
    @Enumerated(EnumType.STRING)
    private RiskBand riskBand;
    private BigDecimal confidence;
    private String summary;
    @JdbcTypeCode(SqlTypes.JSON)
    private List<RiskSignal> signals;
    @JdbcTypeCode(SqlTypes.JSON)
    private AppetiteResult appetite;
    @Enumerated(EnumType.STRING)
    private RecommendedAction recommendedAction;
    private String rationale;
    private Instant createdAt;

    protected Assessment() {
    }

    public Assessment(String id, String submissionId, String provider, String model, int riskScore, RiskBand riskBand,
                      BigDecimal confidence, String summary, List<RiskSignal> signals, AppetiteResult appetite,
                      RecommendedAction recommendedAction, String rationale, Instant createdAt) {
        this.id = id;
        this.submissionId = submissionId;
        this.provider = provider;
        this.model = model;
        this.riskScore = riskScore;
        this.riskBand = riskBand;
        this.confidence = confidence;
        this.summary = summary;
        this.signals = signals;
        this.appetite = appetite;
        this.recommendedAction = recommendedAction;
        this.rationale = rationale;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public String getSubmissionId() { return submissionId; }
    public String getProvider() { return provider; }
    public String getModel() { return model; }
    public int getRiskScore() { return riskScore; }
    public RiskBand getRiskBand() { return riskBand; }
    public BigDecimal getConfidence() { return confidence; }
    public String getSummary() { return summary; }
    public List<RiskSignal> getSignals() { return signals; }
    public AppetiteResult getAppetite() { return appetite; }
    public RecommendedAction getRecommendedAction() { return recommendedAction; }
    public String getRationale() { return rationale; }
    public Instant getCreatedAt() { return createdAt; }
}
