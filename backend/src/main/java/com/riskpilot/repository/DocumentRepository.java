package com.riskpilot.repository;

import com.riskpilot.domain.SubmissionDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DocumentRepository extends JpaRepository<SubmissionDocument, String> {
    List<SubmissionDocument> findBySubmissionIdOrderByUploadedAtAsc(String submissionId);

    List<SubmissionDocument> findBySubmissionIdInOrderByUploadedAtAsc(Collection<String> submissionIds);

    long countBySubmissionId(String submissionId);
}
