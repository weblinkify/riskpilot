package com.riskpilot.graphql;

import com.riskpilot.domain.Assessment;
import com.riskpilot.domain.AuditEntry;
import com.riskpilot.domain.Decision;
import com.riskpilot.domain.LineOfBusiness;
import com.riskpilot.domain.Loss;
import com.riskpilot.domain.RecommendedAction;
import com.riskpilot.domain.Submission;
import com.riskpilot.domain.SubmissionDocument;
import com.riskpilot.domain.SubmissionStatus;
import com.riskpilot.repository.AssessmentRepository;
import com.riskpilot.repository.DecisionRepository;
import com.riskpilot.repository.DocumentRepository;
import com.riskpilot.repository.LossRepository;
import com.riskpilot.service.AssessmentService;
import com.riskpilot.service.AuditService;
import com.riskpilot.service.DashboardService;
import com.riskpilot.service.DecisionService;
import com.riskpilot.service.SubmissionQueryService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Controller
public class SubmissionGraphqlController {

    public record SubmissionFilterInput(String search, List<SubmissionStatus> statuses, List<LineOfBusiness> lines) {
    }

    public record SubmissionPage(List<Submission> items, long total, int page, int size) {
    }

    public record DecisionInput(String submissionId, String assessmentId, RecommendedAction finalAction, String reason,
                                String underwriter) {
    }

    private final SubmissionQueryService queries;
    private final AssessmentService assessmentService;
    private final DecisionService decisionService;
    private final DashboardService dashboardService;
    private final AuditService auditService;
    private final LossRepository losses;
    private final DocumentRepository documents;
    private final AssessmentRepository assessments;
    private final DecisionRepository decisions;

    public SubmissionGraphqlController(SubmissionQueryService queries, AssessmentService assessmentService,
                                       DecisionService decisionService, DashboardService dashboardService,
                                       AuditService auditService, LossRepository losses, DocumentRepository documents,
                                       AssessmentRepository assessments, DecisionRepository decisions) {
        this.queries = queries;
        this.assessmentService = assessmentService;
        this.decisionService = decisionService;
        this.dashboardService = dashboardService;
        this.auditService = auditService;
        this.losses = losses;
        this.documents = documents;
        this.assessments = assessments;
        this.decisions = decisions;
    }

    // ------------------------------------------------------------------ queries

    @QueryMapping
    public SubmissionPage submissions(@Argument SubmissionFilterInput filter, @Argument int page, @Argument int size) {
        var f = filter == null ? null : new SubmissionQueryService.Filter(filter.search(), filter.statuses(), filter.lines());
        var result = queries.search(f, page, size);
        return new SubmissionPage(result.getContent(), result.getTotalElements(), result.getNumber(), result.getSize());
    }

    @QueryMapping
    public Submission submission(@Argument String id) {
        return queries.byId(id).orElse(null);
    }

    @QueryMapping
    public DashboardService.Dashboard dashboard() {
        return dashboardService.compute();
    }

    @QueryMapping
    public List<AuditEntry> auditLog(@Argument String submissionId, @Argument int limit) {
        return auditService.recent(submissionId, limit);
    }

    // ------------------------------------------------------------------ mutations

    @MutationMapping
    public Assessment runAssessment(@Argument String submissionId) {
        return assessmentService.run(submissionId);
    }

    @MutationMapping
    public Decision recordDecision(@Argument DecisionInput input) {
        return decisionService.record(new DecisionService.DecisionCommand(input.submissionId(), input.assessmentId(),
                input.finalAction(), input.reason(), input.underwriter()));
    }

    // ------------------------------------------------------------------ nested fields (batched, no N+1)

    @BatchMapping
    public Map<Submission, List<Loss>> losses(List<Submission> subs) {
        var grouped = losses.findBySubmissionIdInOrderByLossDateDesc(ids(subs)).stream()
                .collect(Collectors.groupingBy(Loss::getSubmissionId));
        return byParent(subs, s -> grouped.getOrDefault(s.getId(), List.of()));
    }

    @BatchMapping
    public Map<Submission, List<SubmissionDocument>> documents(List<Submission> subs) {
        var grouped = documents.findBySubmissionIdInOrderByUploadedAtAsc(ids(subs)).stream()
                .collect(Collectors.groupingBy(SubmissionDocument::getSubmissionId));
        return byParent(subs, s -> grouped.getOrDefault(s.getId(), List.of()));
    }

    @BatchMapping
    public Map<Submission, Assessment> latestAssessment(List<Submission> subs) {
        Map<String, Assessment> latest = new LinkedHashMap<>();
        for (Assessment a : assessments.findBySubmissionIdInOrderByCreatedAtDesc(ids(subs))) {
            latest.putIfAbsent(a.getSubmissionId(), a);
        }
        Map<Submission, Assessment> out = new LinkedHashMap<>();
        subs.forEach(s -> out.put(s, latest.get(s.getId())));
        return out;
    }

    @BatchMapping
    public Map<Submission, List<Decision>> decisions(List<Submission> subs) {
        var grouped = decisions.findBySubmissionIdInOrderByDecidedAtDesc(ids(subs)).stream()
                .collect(Collectors.groupingBy(Decision::getSubmissionId));
        return byParent(subs, s -> grouped.getOrDefault(s.getId(), List.of()));
    }

    private static List<String> ids(List<Submission> subs) {
        return subs.stream().map(Submission::getId).toList();
    }

    private static <T> Map<Submission, T> byParent(List<Submission> subs, Function<Submission, T> fn) {
        Map<Submission, T> out = new LinkedHashMap<>();
        subs.forEach(s -> out.put(s, fn.apply(s)));
        return out;
    }
}
