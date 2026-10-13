package com.riskpilot.repository;

import com.riskpilot.domain.AuditEntry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditRepository extends JpaRepository<AuditEntry, Long> {
    List<AuditEntry> findByEntityIdOrderByCreatedAtDescIdDesc(String entityId, Pageable pageable);

    List<AuditEntry> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
}
