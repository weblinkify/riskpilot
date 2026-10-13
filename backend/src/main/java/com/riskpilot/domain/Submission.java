package com.riskpilot.domain;

import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    private String id;
    private String reference;
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;
    @Enumerated(EnumType.STRING)
    private LineOfBusiness lineOfBusiness;
    private BigDecimal premium;
    private Instant receivedAt;
    private Instant decidedAt;
    @Embedded
    private Applicant applicant;
    @Embedded
    private Broker broker;
    @Embedded
    private PropertyDetails property;

    public String getId() { return id; }
    public String getReference() { return reference; }
    public SubmissionStatus getStatus() { return status; }
    public LineOfBusiness getLineOfBusiness() { return lineOfBusiness; }
    public BigDecimal getPremium() { return premium; }
    public Instant getReceivedAt() { return receivedAt; }
    public Instant getDecidedAt() { return decidedAt; }
    public Applicant getApplicant() { return applicant; }
    public Broker getBroker() { return broker; }
    public PropertyDetails getProperty() { return property; }

    public void setStatus(SubmissionStatus status) { this.status = status; }
    public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
}
