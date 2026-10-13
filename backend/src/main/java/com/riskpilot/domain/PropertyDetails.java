package com.riskpilot.domain;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

import java.math.BigDecimal;

@Embeddable
public class PropertyDetails {
    @Enumerated(EnumType.STRING)
    private ConstructionClass constructionClass;
    private String occupancy;
    private int yearBuilt;
    private int stories;
    private int squareFeet;
    private boolean sprinklered;
    private int protectionClass;
    private BigDecimal tiv;
    private String floodZone;
    private BigDecimal distanceToCoastMiles;
    private Integer roofAgeYears;
    private Integer openRecommendations;

    public ConstructionClass getConstructionClass() { return constructionClass; }
    public String getOccupancy() { return occupancy; }
    public int getYearBuilt() { return yearBuilt; }
    public int getStories() { return stories; }
    public int getSquareFeet() { return squareFeet; }
    public boolean isSprinklered() { return sprinklered; }
    public boolean getSprinklered() { return sprinklered; }
    public int getProtectionClass() { return protectionClass; }
    public BigDecimal getTiv() { return tiv; }
    public String getFloodZone() { return floodZone; }
    public BigDecimal getDistanceToCoastMiles() { return distanceToCoastMiles; }
    public Integer getRoofAgeYears() { return roofAgeYears; }
    public Integer getOpenRecommendations() { return openRecommendations; }
}
