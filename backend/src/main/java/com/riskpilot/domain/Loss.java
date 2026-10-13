package com.riskpilot.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "losses")
public class Loss {
    @Id
    private String id;
    private String submissionId;
    private LocalDate lossDate;
    private String cause;
    private String description;
    private BigDecimal amountPaid;
    private BigDecimal amountReserved;
    private String status;

    public String getId() { return id; }
    public String getSubmissionId() { return submissionId; }
    public LocalDate getLossDate() { return lossDate; }
    public String getCause() { return cause; }
    public String getDescription() { return description; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public BigDecimal getAmountReserved() { return amountReserved; }
    public String getStatus() { return status; }

    public BigDecimal incurred() { return amountPaid.add(amountReserved); }
    public boolean isOpen() { return "OPEN".equals(status); }
}
