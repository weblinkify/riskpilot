package com.riskpilot.service;

import com.riskpilot.domain.Decision;
import com.riskpilot.domain.DecisionOutcome;
import com.riskpilot.domain.LineOfBusiness;
import com.riskpilot.domain.Submission;
import com.riskpilot.domain.SubmissionStatus;
import com.riskpilot.repository.DecisionRepository;
import com.riskpilot.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {

    public record StatusCount(SubmissionStatus status, int count) {
    }

    public record LineStat(LineOfBusiness lineOfBusiness, int count, double premium) {
    }

    public record Dashboard(int totalSubmissions, List<StatusCount> byStatus, List<LineStat> byLine,
                            double avgHoursToDecision, double quoteToBindRatio, Double aiAcceptanceRate,
                            int decisionsRecorded) {
    }

    private final SubmissionRepository submissions;
    private final DecisionRepository decisions;

    public DashboardService(SubmissionRepository submissions, DecisionRepository decisions) {
        this.submissions = submissions;
        this.decisions = decisions;
    }

    @Transactional(readOnly = true)
    public Dashboard compute() {
        List<Submission> all = submissions.findAll();
        List<Decision> allDecisions = decisions.findAll();
        return compute(all, allDecisions);
    }

    /** Pure function – mirrored by the frontend mock layer. */
    public static Dashboard compute(List<Submission> all, List<Decision> allDecisions) {
        var byStatus = Arrays.stream(SubmissionStatus.values())
                .map(s -> new StatusCount(s, (int) all.stream().filter(x -> x.getStatus() == s).count())).toList();
        var byLine = Arrays.stream(LineOfBusiness.values()).map(l -> {
            var subs = all.stream().filter(x -> x.getLineOfBusiness() == l).toList();
            double premium = subs.stream().map(Submission::getPremium).reduce(BigDecimal.ZERO, BigDecimal::add).doubleValue();
            return new LineStat(l, subs.size(), premium);
        }).toList();

        double avgHours = all.stream().filter(s -> s.getDecidedAt() != null)
                .mapToLong(s -> Duration.between(s.getReceivedAt(), s.getDecidedAt()).toMinutes())
                .average().orElse(0) / 60.0;
        long quoted = count(all, SubmissionStatus.QUOTED);
        long bound = count(all, SubmissionStatus.BOUND);
        double ratio = quoted + bound == 0 ? 0 : (double) bound / (quoted + bound);

        var aiDecisions = allDecisions.stream().filter(d -> d.getOutcome() != DecisionOutcome.MANUAL).toList();
        Double acceptance = aiDecisions.isEmpty() ? null
                : round((double) aiDecisions.stream().filter(d -> d.getOutcome() == DecisionOutcome.ACCEPTED).count()
                / aiDecisions.size(), 3);
        return new Dashboard(all.size(), byStatus, byLine, round(avgHours, 1), round(ratio, 3), acceptance,
                aiDecisions.size());
    }

    private static long count(List<Submission> all, SubmissionStatus status) {
        return all.stream().filter(s -> s.getStatus() == status).count();
    }

    private static double round(double value, int places) {
        return BigDecimal.valueOf(value).setScale(places, RoundingMode.HALF_UP).doubleValue();
    }
}
