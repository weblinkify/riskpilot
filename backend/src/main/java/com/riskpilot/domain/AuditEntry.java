package com.riskpilot.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Append-only audit record. */
@Entity
@Table(name = "audit_log")
public class AuditEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String entityType;
    private String entityId;
    private String action;
    private String actor;
    private String details;
    private Instant createdAt;

    protected AuditEntry() {
    }

    public AuditEntry(String entityType, String entityId, String action, String actor, String details, Instant createdAt) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.actor = actor;
        this.details = details;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getEntityType() { return entityType; }
    public String getEntityId() { return entityId; }
    public String getAction() { return action; }
    public String getActor() { return actor; }
    public String getDetails() { return details; }
    public Instant getCreatedAt() { return createdAt; }
}
