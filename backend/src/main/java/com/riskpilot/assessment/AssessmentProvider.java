package com.riskpilot.assessment;

/**
 * Strategy for producing a risk assessment. Implementations only RECOMMEND – the underwriter decides
 * (see {@link com.riskpilot.service.DecisionService}).
 */
public interface AssessmentProvider {

    /** Short identifier stored with every assessment, e.g. {@code mock-rules-v1}. */
    String name();

    AssessmentDraft assess(AssessmentInput input);
}
