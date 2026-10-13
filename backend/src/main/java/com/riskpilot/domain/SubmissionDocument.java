package com.riskpilot.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "documents")
public class SubmissionDocument {
    @Id
    private String id;
    private String submissionId;
    private String fileName;
    @Column(name = "doc_type")
    private String type;
    private long sizeBytes;
    private int pageCount;
    private Instant uploadedAt;
    @JdbcTypeCode(SqlTypes.JSON)
    private List<ExtractedField> extractedFields = new ArrayList<>();

    protected SubmissionDocument() {
    }

    public SubmissionDocument(String id, String submissionId, String fileName, String type, long sizeBytes,
                              int pageCount, Instant uploadedAt, List<ExtractedField> extractedFields) {
        this.id = id;
        this.submissionId = submissionId;
        this.fileName = fileName;
        this.type = type;
        this.sizeBytes = sizeBytes;
        this.pageCount = pageCount;
        this.uploadedAt = uploadedAt;
        this.extractedFields = extractedFields;
    }

    public String getId() { return id; }
    public String getSubmissionId() { return submissionId; }
    public String getFileName() { return fileName; }
    public String getType() { return type; }
    public long getSizeBytes() { return sizeBytes; }
    public int getPageCount() { return pageCount; }
    public Instant getUploadedAt() { return uploadedAt; }
    public List<ExtractedField> getExtractedFields() { return extractedFields; }
}
