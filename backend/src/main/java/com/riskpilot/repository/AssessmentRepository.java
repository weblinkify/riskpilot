package com.riskpilot.repository;

import com.riskpilot.domain.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AssessmentRepository extends JpaRepository<Assessment, String> {
    Optional<Assessment> findFirstBySubmissionIdOrderByCreatedAtDesc(String submissionId);

    List<Assessment> findBySubmissionIdInOrderByCreatedAtDesc(Collection<String> submissionIds);
}
