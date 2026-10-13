package com.riskpilot.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Broker {
    @Column(name = "broker_name")
    private String name;
    @Column(name = "broker_agency")
    private String agency;
    @Column(name = "broker_email")
    private String email;

    public String getName() { return name; }
    public String getAgency() { return agency; }
    public String getEmail() { return email; }
}
