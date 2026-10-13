package com.riskpilot.service;

import com.riskpilot.domain.Assessment;
import com.riskpilot.domain.Decision;
import com.riskpilot.domain.DecisionOutcome;
import com.riskpilot.domain.RecommendedAction;
import com.riskpilot.domain.Submission;
import com.riskpilot.domain.SubmissionStatus;
import com.riskpilot.repository.AssessmentRepository;
import com.riskpilot.repository.DecisionRepository;
import com.riskpilot.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

/**
 * Human-in-the-loop: the AI only recommends; this service records what the underwriter actually decided.
 * Overrides require a written reason, and every decision is written to the audit log in the same transaction.
 */
@Service
public class DecisionService {

    public record DecisionCommand(String submissionId, String assessmentId, RecommendedAction finalAction,
                                  String reason, String underwriter) {
    }

    private final SubmissionRepository submissions;
    private final AssessmentRepository assessments;
    private final DecisionRepository decisions;
    private final AuditService audit;
    private final Clock clock;

    public DecisionService(SubmissionRepository submissions, AssessmentRepository assessments,
                           DecisionRepository decisions, AuditService audit, Clock clock) {
        this.submissions = submissions;
        this.assessments = assessments;
        this.decisions = decisions;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public Decision record(DecisionCommand cmd) {
        if (cmd.underwriter() == null || cmd.underwriter().isBlank()) {
            throw new ValidationException("Underwriter is required.");
        }
        Submission submission = submissions.findById(cmd.submissionId())
                .orElseThrow(() -> new NotFoundException("Submission " + cmd.submissionId() + " not found"));
        Assessment assessment = assessments.findById(cmd.assessmentId())
                .orElseThrow(() -> new NotFoundException("Assessment " + cmd.assessmentId() + " not found"));
        if (!assessment.getSubmissionId().equals(submission.getId())) {
            throw new ValidationException("Assessment does not belong to this submission.");
        }
        if (submission.getStatus() == SubmissionStatus.BOUND) {
            throw new ValidationException("Submission is already bound.");
        }
        boolean accepted = assessment.getRecommendedAction() == cmd.finalAction();
        String reason = cmd.reason() == null ? null : cmd.reason().trim();
        if (!accepted && (reason == null || reason.length() < 10)) {
            throw new ValidationException("Overriding the AI recommendation requires a reason (min. 10 characters).");
        }

        Instant now = Instant.now(clock);
        Decision decision = decisions.save(new Decision("DEC-" + UUID.randomUUID().toString().substring(0, 8),
                submission.getId(), assessment.getId(), assessment.getRecommendedAction(), cmd.finalAction(),
                accepted ? DecisionOutcome.ACCEPTED : DecisionOutcome.OVERRIDDEN,
                reason == null || reason.isEmpty() ? null : reason, cmd.underwriter().trim(), now));

        submission.setStatus(statusFor(cmd.finalAction()));
        if (cmd.finalAction() == RecommendedAction.QUOTE || cmd.finalAction() == RecommendedAction.DECLINE) {
            submission.setDecidedAt(now);
        }
        audit.record("SUBMISSION", submission.getId(), accepted ? "DECISION_ACCEPTED" : "DECISION_OVERRIDDEN",
                decision.getUnderwriter(), accepted
                        ? "Accepted AI recommendation " + cmd.finalAction()
                        : "Overrode AI recommendation " + assessment.getRecommendedAction() + " → " + cmd.finalAction()
                        + ". Reason: " + reason);
        return decision;
    }

    static SubmissionStatus statusFor(RecommendedAction action) {
        return switch (action) {
            case QUOTE -> SubmissionStatus.QUOTED;
            case DECLINE -> SubmissionStatus.DECLINED;
            case REFER, REQUEST_INFO -> SubmissionStatus.IN_REVIEW;
        };
    }
}
