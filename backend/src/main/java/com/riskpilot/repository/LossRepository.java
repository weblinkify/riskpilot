package com.riskpilot.repository;

import com.riskpilot.domain.Loss;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface LossRepository extends JpaRepository<Loss, String> {
    List<Loss> findBySubmissionIdOrderByLossDateDesc(String submissionId);

    List<Loss> findBySubmissionIdInOrderByLossDateDesc(Collection<String> submissionIds);
}
