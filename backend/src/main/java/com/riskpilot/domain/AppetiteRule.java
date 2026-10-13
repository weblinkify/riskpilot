package com.riskpilot.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "appetite_rules")
public class AppetiteRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Enumerated(EnumType.STRING)
    private LineOfBusiness lineOfBusiness;
    /** Two-letter state, or null for "any state". */
    private String state;
    /** Minimum acceptable construction class, or null for "any". */
    @Enumerated(EnumType.STRING)
    private ConstructionClass constructionClass;
    private BigDecimal maxTiv;
    private boolean active = true;
    private String notes = "";

    public Long getId() { return id; }
    public String getName() { return name; }
    public LineOfBusiness getLineOfBusiness() { return lineOfBusiness; }
    public String getState() { return state; }
    public ConstructionClass getConstructionClass() { return constructionClass; }
    public BigDecimal getMaxTiv() { return maxTiv; }
    public boolean isActive() { return active; }
    public String getNotes() { return notes; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setLineOfBusiness(LineOfBusiness lineOfBusiness) { this.lineOfBusiness = lineOfBusiness; }
    public void setState(String state) { this.state = state; }
    public void setConstructionClass(ConstructionClass constructionClass) { this.constructionClass = constructionClass; }
    public void setMaxTiv(BigDecimal maxTiv) { this.maxTiv = maxTiv; }
    public void setActive(boolean active) { this.active = active; }
    public void setNotes(String notes) { this.notes = notes; }
}
