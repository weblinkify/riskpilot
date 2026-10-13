package com.riskpilot.service;

import com.riskpilot.domain.LineOfBusiness;
import com.riskpilot.domain.Submission;
import com.riskpilot.domain.SubmissionStatus;
import com.riskpilot.repository.SubmissionRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SubmissionQueryService {

    public record Filter(String search, List<SubmissionStatus> statuses, List<LineOfBusiness> lines) {
    }

    private final SubmissionRepository repository;

    public SubmissionQueryService(SubmissionRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Page<Submission> search(Filter filter, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)),
                Sort.by(Sort.Direction.DESC, "receivedAt").and(Sort.by("id")));
        return repository.findAll(spec(filter), pageable);
    }

    @Transactional(readOnly = true)
    public Optional<Submission> byId(String id) {
        return repository.findById(id);
    }

    static Specification<Submission> spec(Filter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter != null) {
                if (filter.statuses() != null && !filter.statuses().isEmpty()) {
                    predicates.add(root.get("status").in(filter.statuses()));
                }
                if (filter.lines() != null && !filter.lines().isEmpty()) {
                    predicates.add(root.get("lineOfBusiness").in(filter.lines()));
                }
                if (filter.search() != null && !filter.search().isBlank()) {
                    String like = "%" + filter.search().trim().toLowerCase() + "%";
                    var applicant = root.get("applicant");
                    var broker = root.get("broker");
                    predicates.add(cb.or(
                            cb.like(cb.lower(applicant.get("name")), like),
                            cb.like(cb.lower(root.get("reference")), like),
                            cb.like(cb.lower(broker.get("name")), like),
                            cb.like(cb.lower(broker.get("agency")), like),
                            cb.like(cb.lower(applicant.get("city")), like)));
                }
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
