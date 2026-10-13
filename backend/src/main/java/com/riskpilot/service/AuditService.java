package com.riskpilot.service;

import com.riskpilot.domain.AuditEntry;
import com.riskpilot.repository.AuditRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/** Append-only audit trail. There is intentionally no update or delete API. */
@Service
public class AuditService {

    private final AuditRepository repository;
    private final Clock clock;

    public AuditService(AuditRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(String entityType, String entityId, String action, String actor, String details) {
        repository.save(new AuditEntry(entityType, entityId, action, actor, details, Instant.now(clock)));
    }

    @Transactional(readOnly = true)
    public List<AuditEntry> recent(String entityId, int limit) {
        var page = PageRequest.of(0, Math.max(1, Math.min(limit, 500)));
        return entityId == null ? repository.findAllByOrderByCreatedAtDescIdDesc(page)
                : repository.findByEntityIdOrderByCreatedAtDescIdDesc(entityId, page);
    }
}
