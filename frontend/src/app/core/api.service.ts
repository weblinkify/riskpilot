import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  AuditLogDocument,
  DashboardDocument,
  RecordDecisionDocument,
  RunAssessmentDocument,
  SubmissionDetailDocument,
  SubmissionsDocument,
  type DashboardQuery,
  type DecisionInput,
  type SubmissionDetailQuery,
  type SubmissionFilter,
  type SubmissionsQuery,
  type AuditFieldsFragment,
  type AssessmentFieldsFragment,
  type DecisionFieldsFragment,
} from '../graphql/generated';
import type { ConstructionClass, LineOfBusiness } from '../graphql/schema-types.generated';
import { runtimeConfig } from './runtime-config';

/** REST: appetite rule (no GraphQL type – served by /api/appetite-rules). */
export interface AppetiteRule {
  id: number;
  name: string;
  lineOfBusiness: LineOfBusiness;
  state: string | null;
  constructionClass: ConstructionClass | null;
  maxTiv: number;
  active: boolean;
  notes: string;
}
export type AppetiteRuleInput = Omit<AppetiteRule, 'id'>;

export interface DocumentDto {
  id: string;
  submissionId: string;
  fileName: string;
  type: string;
  sizeBytes: number;
  pageCount: number;
  uploadedAt: string;
}

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw new Error(`${what} missing from response`);
  return value;
}

/** Thin, typed facade over GraphQL (Apollo) and REST (HttpClient). Identical in mock and real mode. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apollo = inject(Apollo);
  private readonly http = inject(HttpClient);
  private readonly base = runtimeConfig.apiBaseUrl;

  // ---------------------------------------------------------------- GraphQL
  submissions(
    filter: SubmissionFilter,
    page: number,
    size: number,
  ): Observable<SubmissionsQuery['submissions']> {
    return this.apollo
      .query({ query: SubmissionsDocument, variables: { filter, page, size } })
      .pipe(map((r) => required(r.data, 'submissions').submissions));
  }

  submission(id: string): Observable<SubmissionDetailQuery> {
    return this.apollo
      .query({ query: SubmissionDetailDocument, variables: { id } })
      .pipe(map((r) => required(r.data, 'submission')));
  }

  runAssessment(submissionId: string): Observable<AssessmentFieldsFragment> {
    return this.apollo
      .mutate({ mutation: RunAssessmentDocument, variables: { submissionId } })
      .pipe(map((r) => required(r.data, 'assessment').runAssessment));
  }

  recordDecision(input: DecisionInput): Observable<DecisionFieldsFragment> {
    return this.apollo
      .mutate({ mutation: RecordDecisionDocument, variables: { input } })
      .pipe(map((r) => required(r.data, 'decision').recordDecision));
  }

  dashboard(): Observable<DashboardQuery['dashboard']> {
    return this.apollo
      .query({ query: DashboardDocument })
      .pipe(map((r) => required(r.data, 'dashboard').dashboard));
  }

  auditLog(limit = 100): Observable<AuditFieldsFragment[]> {
    return this.apollo
      .query({ query: AuditLogDocument, variables: { limit } })
      .pipe(map((r) => required(r.data, 'audit log').auditLog));
  }

  // ---------------------------------------------------------------- REST
  rules(): Observable<AppetiteRule[]> {
    return this.http.get<AppetiteRule[]>(`${this.base}/api/appetite-rules`);
  }

  createRule(rule: AppetiteRuleInput): Observable<AppetiteRule> {
    return this.http.post<AppetiteRule>(`${this.base}/api/appetite-rules`, rule);
  }

  updateRule(id: number, rule: AppetiteRuleInput): Observable<AppetiteRule> {
    return this.http.put<AppetiteRule>(`${this.base}/api/appetite-rules/${id}`, rule);
  }

  deleteRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/appetite-rules/${id}`);
  }

  uploadDocument(submissionId: string, file: File, type: string): Observable<DocumentDto> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return this.http.post<DocumentDto>(
      `${this.base}/api/submissions/${encodeURIComponent(submissionId)}/documents`,
      form,
    );
  }

  health(): Observable<{ status: string; database: string; assessmentProvider: string }> {
    return this.http.get<{ status: string; database: string; assessmentProvider: string }>(
      `${this.base}/api/health`,
    );
  }
}

/** Human-readable message from Apollo / HttpClient errors (ProblemDetail `detail` or GraphQL message). */
export function errorMessage(err: unknown): string {
  const e = err as { error?: { detail?: string }; message?: string };
  return e?.error?.detail ?? e?.message ?? 'Something went wrong.';
}
