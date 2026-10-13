package com.riskpilot.service;

import com.riskpilot.assessment.AppetiteEvaluator;
import com.riskpilot.assessment.AssessmentDraft;
import com.riskpilot.assessment.AssessmentInput;
import com.riskpilot.assessment.AssessmentProvider;
import com.riskpilot.domain.Assessment;
import com.riskpilot.domain.Submission;
import com.riskpilot.domain.SubmissionStatus;
import com.riskpilot.repository.AppetiteRuleRepository;
import com.riskpilot.repository.AssessmentRepository;
import com.riskpilot.repository.DocumentRepository;
import com.riskpilot.repository.LossRepository;
import com.riskpilot.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class AssessmentService {

    private final SubmissionRepository submissions;
    private final LossRepository losses;
    private final DocumentRepository documents;
    private final AppetiteRuleRepository rules;
    private final AssessmentRepository assessments;
    private final AppetiteEvaluator appetiteEvaluator;
    private final AssessmentProvider provider;
    private final AuditService audit;
    private final Clock clock;

    public AssessmentService(SubmissionRepository submissions, LossRepository losses, DocumentRepository documents,
                             AppetiteRuleRepository rules, AssessmentRepository assessments,
                             AppetiteEvaluator appetiteEvaluator, AssessmentProvider provider, AuditService audit,
                             Clock clock) {
        this.submissions = submissions;
        this.losses = losses;
        this.documents = documents;
        this.rules = rules;
        this.assessments = assessments;
        this.appetiteEvaluator = appetiteEvaluator;
        this.provider = provider;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public Assessment run(String submissionId) {
        Submission submission = submissions.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Submission " + submissionId + " not found"));
        var appetite = appetiteEvaluator.evaluate(submission, rules.findAllByOrderByIdAsc());
        var input = new AssessmentInput(submission, losses.findBySubmissionIdOrderByLossDateDesc(submissionId),
                documents.findBySubmissionIdOrderByUploadedAtAsc(submissionId), appetite);
        AssessmentDraft draft = provider.assess(input);

        Assessment saved = assessments.save(new Assessment("ASM-" + UUID.randomUUID().toString().substring(0, 8),
                submissionId, draft.provider(), draft.model(), draft.riskScore(), draft.riskBand(),
                BigDecimal.valueOf(draft.confidence()), draft.summary(), draft.signals(), appetite.result(),
                draft.recommendedAction(), draft.rationale(), Instant.now(clock)));

        if (submission.getStatus() == SubmissionStatus.NEW) {
            submission.setStatus(SubmissionStatus.IN_REVIEW);
        }
        audit.record("SUBMISSION", submissionId, "ASSESSMENT_RUN", "riskpilot-ai",
                "%s: score %d (%s), %s appetite, recommends %s".formatted(draft.provider(), draft.riskScore(),
                        draft.riskBand(), appetite.result().inAppetite() ? "in" : "out of", draft.recommendedAction()));
        return saved;
    }
}
