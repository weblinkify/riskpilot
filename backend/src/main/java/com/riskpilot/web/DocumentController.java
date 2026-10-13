package com.riskpilot.web;

import com.riskpilot.domain.SubmissionDocument;
import com.riskpilot.repository.DocumentRepository;
import com.riskpilot.repository.SubmissionRepository;
import com.riskpilot.service.AuditService;
import com.riskpilot.service.NotFoundException;
import com.riskpilot.service.ValidationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/submissions/{submissionId}/documents")
@Tag(name = "Documents", description = "Submission documents (metadata; file bytes are not persisted in this MVP)")
public class DocumentController {

    static final Set<String> TYPES = Set.of("ACORD_125", "ACORD_140", "SOV", "LOSS_RUNS", "INSPECTION_REPORT",
            "FINANCIAL_STATEMENT", "OTHER");

    private final SubmissionRepository submissions;
    private final DocumentRepository documents;
    private final AuditService audit;
    private final Clock clock;

    public DocumentController(SubmissionRepository submissions, DocumentRepository documents, AuditService audit,
                              Clock clock) {
        this.submissions = submissions;
        this.documents = documents;
        this.audit = audit;
        this.clock = clock;
    }

    @GetMapping
    @Operation(summary = "List documents attached to a submission")
    public List<SubmissionDocument> list(@PathVariable String submissionId) {
        requireSubmission(submissionId);
        return documents.findBySubmissionIdOrderByUploadedAtAsc(submissionId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    @Operation(summary = "Upload a document (metadata is stored; field extraction is not part of the MVP)")
    public SubmissionDocument upload(@PathVariable String submissionId, @RequestParam("file") MultipartFile file,
                                     @RequestParam(value = "type", defaultValue = "OTHER") String type,
                                     @RequestHeader(value = "X-User", defaultValue = "underwriter") String user) {
        requireSubmission(submissionId);
        if (file.isEmpty()) {
            throw new ValidationException("File is empty.");
        }
        if (!TYPES.contains(type)) {
            throw new ValidationException("Unknown document type " + type);
        }
        long n = documents.countBySubmissionId(submissionId) + 1;
        String name = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
        SubmissionDocument doc = documents.save(new SubmissionDocument(submissionId + "-U" + n + "-" + System.nanoTime() % 100000,
                submissionId, name, type, file.getSize(), 1, Instant.now(clock), List.of()));
        audit.record("SUBMISSION", submissionId, "DOCUMENT_UPLOADED", user, name + " (" + type + ")");
        return doc;
    }

    private void requireSubmission(String id) {
        if (!submissions.existsById(id)) {
            throw new NotFoundException("Submission " + id + " not found");
        }
    }
}
