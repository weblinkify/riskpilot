package com.riskpilot.repository;

import com.riskpilot.domain.Decision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DecisionRepository extends JpaRepository<Decision, String> {
    List<Decision> findBySubmissionIdInOrderByDecidedAtDesc(Collection<String> submissionIds);
}
