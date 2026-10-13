package com.riskpilot.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

@Embeddable
public class Applicant {
    @Column(name = "applicant_name")
    private String name;
    private String industry;
    private int yearsInBusiness;
    private BigDecimal annualRevenue;
    private String street;
    private String city;
    private String state;
    private String zip;

    public String getName() { return name; }
    public String getIndustry() { return industry; }
    public int getYearsInBusiness() { return yearsInBusiness; }
    public BigDecimal getAnnualRevenue() { return annualRevenue; }
    public String getStreet() { return street; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getZip() { return zip; }
}
