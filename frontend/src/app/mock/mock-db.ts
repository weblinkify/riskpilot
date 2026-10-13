import seedJson from './seed-data.json';
import type {
  AppetiteRuleDto,
  AssessmentDraft,
  AppetiteEvaluation,
  SeedData,
  SeedDocument,
  SeedSubmission,
} from './mock-types';
import type { DecisionOutcome, RecommendedAction } from '../graphql/schema-types.generated';

export interface StoredAssessment extends AssessmentDraft {
  id: string;
  submissionId: string;
  appetite: AppetiteEvaluation['result'];
  createdAt: string;
}

export interface StoredDecision {
  id: string;
  submissionId: string;
  assessmentId: string | null;
  recommendedAction: RecommendedAction | null;
  finalAction: RecommendedAction;
  outcome: DecisionOutcome;
  reason: string | null;
  underwriter: string;
  decidedAt: string;
}

export interface StoredAudit {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  details: string;
  createdAt: string;
}

export interface MockState {
  submissions: (SeedSubmission & { documents: (SeedDocument & { submissionId?: string })[] })[];
  rules: AppetiteRuleDto[];
  assessments: StoredAssessment[];
  decisions: StoredDecision[];
  audit: StoredAudit[];
  seq: number;
}

const STORAGE_KEY = 'riskpilot.mock.v1';

/** Fresh state built from the same seed the backend's Flyway migration uses. */
export function initialState(): MockState {
  const seed = structuredClone(seedJson) as unknown as SeedData;
  const decisions: StoredDecision[] = [];
  const audit: StoredAudit[] = [];
  let seq = 0;
  for (const s of seed.submissions) {
    const h = s.historicalDecision;
    if (!h) continue;
    decisions.push({
      id: h.id,
      submissionId: s.id,
      assessmentId: null,
      recommendedAction: null,
      finalAction: h.finalAction,
      outcome: 'MANUAL',
      reason: h.reason,
      underwriter: h.underwriter,
      decidedAt: h.decidedAt,
    });
    audit.push({
      id: String(++seq),
      entityType: 'SUBMISSION',
      entityId: s.id,
      action: 'DECISION_RECORDED',
      actor: h.underwriter,
      details: `${h.finalAction} (manual, historical)`,
      createdAt: h.decidedAt,
    });
  }
  return {
    submissions: seed.submissions,
    rules: seed.appetiteRules,
    assessments: [],
    decisions,
    audit,
    seq,
  };
}

/**
 * In-browser database for API_MODE=mock. State survives page reloads via localStorage
 * (best effort – falls back to memory when storage is unavailable).
 */
export class MockDb {
  state: MockState;

  constructor(private readonly persist = true) {
    this.state = (persist && MockDb.load()) || initialState();
  }

  private static load(): MockState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MockState) : null;
    } catch {
      return null;
    }
  }

  save(): void {
    if (!this.persist) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* storage full or blocked – keep in memory */
    }
  }

  reset(): void {
    this.state = initialState();
    this.save();
  }

  nextId(prefix: string): string {
    this.state.seq += 1;
    return `${prefix}-${Date.now().toString(36)}${this.state.seq}`;
  }

  audit(
    entityType: string,
    entityId: string,
    action: string,
    actor: string,
    details: string,
  ): void {
    this.state.seq += 1;
    this.state.audit.push({
      id: String(this.state.seq),
      entityType,
      entityId,
      action,
      actor,
      details,
      createdAt: new Date().toISOString(),
    });
  }

  submission(id: string) {
    return this.state.submissions.find((s) => s.id === id);
  }
}

let instance: MockDb | null = null;
export function mockDb(): MockDb {
  instance ??= new MockDb();
  return instance;
}
