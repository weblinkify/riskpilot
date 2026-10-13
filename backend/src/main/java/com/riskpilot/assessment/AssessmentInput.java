package com.riskpilot.assessment;

import com.riskpilot.domain.Loss;
import com.riskpilot.domain.Submission;
import com.riskpilot.domain.SubmissionDocument;

import java.util.List;

/** Everything a provider may look at. Providers never touch the database directly. */
public record AssessmentInput(Submission submission, List<Loss> losses, List<SubmissionDocument> documents,
                              AppetiteEvaluation appetite) {
}
