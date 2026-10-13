CREATE TABLE submissions (
    id                      VARCHAR(32) PRIMARY KEY,
    reference               VARCHAR(32)    NOT NULL UNIQUE,
    status                  VARCHAR(20)    NOT NULL,
    line_of_business        VARCHAR(30)    NOT NULL,
    premium                 NUMERIC(14, 2) NOT NULL,
    received_at             TIMESTAMPTZ    NOT NULL,
    decided_at              TIMESTAMPTZ,
    -- applicant
    applicant_name          VARCHAR(200)   NOT NULL,
    industry                VARCHAR(120)   NOT NULL,
    years_in_business       INT            NOT NULL,
    annual_revenue          NUMERIC(16, 2) NOT NULL,
    street                  VARCHAR(200)   NOT NULL,
    city                    VARCHAR(100)   NOT NULL,
    state                   VARCHAR(2)     NOT NULL,
    zip                     VARCHAR(10)    NOT NULL,
    -- broker
    broker_name             VARCHAR(120)   NOT NULL,
    broker_agency           VARCHAR(200)   NOT NULL,
    broker_email            VARCHAR(200)   NOT NULL,
    -- property
    construction_class      VARCHAR(40)    NOT NULL,
    occupancy               VARCHAR(120)   NOT NULL,
    year_built              INT            NOT NULL,
    stories                 INT            NOT NULL,
    square_feet             INT            NOT NULL,
    sprinklered             BOOLEAN        NOT NULL,
    protection_class        INT            NOT NULL,
    tiv                     NUMERIC(16, 2) NOT NULL,
    flood_zone              VARCHAR(4)     NOT NULL,
    distance_to_coast_miles NUMERIC(8, 1)  NOT NULL,
    roof_age_years          INT,
    open_recommendations    INT
);

CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_received ON submissions (received_at DESC);

CREATE TABLE losses (
    id              VARCHAR(40) PRIMARY KEY,
    submission_id   VARCHAR(32)    NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    loss_date       DATE           NOT NULL,
    cause           VARCHAR(40)    NOT NULL,
    description     VARCHAR(300)   NOT NULL,
    amount_paid     NUMERIC(14, 2) NOT NULL,
    amount_reserved NUMERIC(14, 2) NOT NULL,
    status          VARCHAR(10)    NOT NULL
);
CREATE INDEX idx_losses_submission ON losses (submission_id);

CREATE TABLE documents (
    id               VARCHAR(40) PRIMARY KEY,
    submission_id    VARCHAR(32)  NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    file_name        VARCHAR(255) NOT NULL,
    doc_type         VARCHAR(40)  NOT NULL,
    size_bytes       BIGINT       NOT NULL,
    page_count       INT          NOT NULL,
    uploaded_at      TIMESTAMPTZ  NOT NULL,
    extracted_fields JSONB        NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX idx_documents_submission ON documents (submission_id);

CREATE TABLE appetite_rules (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(120)   NOT NULL,
    line_of_business   VARCHAR(30)    NOT NULL,
    state              VARCHAR(2),
    construction_class VARCHAR(40),
    max_tiv            NUMERIC(16, 2) NOT NULL,
    active             BOOLEAN        NOT NULL DEFAULT TRUE,
    notes              VARCHAR(500)   NOT NULL DEFAULT ''
);

CREATE TABLE assessments (
    id                 VARCHAR(40) PRIMARY KEY,
    submission_id      VARCHAR(32) NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    provider           VARCHAR(40) NOT NULL,
    model              VARCHAR(80),
    risk_score         INT         NOT NULL,
    risk_band          VARCHAR(20) NOT NULL,
    confidence         NUMERIC(4, 3) NOT NULL,
    summary            TEXT        NOT NULL,
    signals            JSONB       NOT NULL,
    appetite           JSONB       NOT NULL,
    recommended_action VARCHAR(20) NOT NULL,
    rationale          TEXT        NOT NULL,
    created_at         TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_assessments_submission ON assessments (submission_id, created_at DESC);

CREATE TABLE decisions (
    id                 VARCHAR(40) PRIMARY KEY,
    submission_id      VARCHAR(32) NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
    assessment_id      VARCHAR(40) REFERENCES assessments (id),
    recommended_action VARCHAR(20),
    final_action       VARCHAR(20)  NOT NULL,
    outcome            VARCHAR(20)  NOT NULL,
    reason             VARCHAR(1000),
    underwriter        VARCHAR(120) NOT NULL,
    decided_at         TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_decisions_submission ON decisions (submission_id, decided_at DESC);

-- Append-only audit trail (no UPDATE/DELETE paths exist in the application).
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(40)  NOT NULL,
    entity_id   VARCHAR(64)  NOT NULL,
    action      VARCHAR(40)  NOT NULL,
    actor       VARCHAR(120) NOT NULL,
    details     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_audit_entity ON audit_log (entity_id, created_at DESC);
