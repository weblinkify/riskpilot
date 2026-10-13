import {
  GraphQLError,
  GraphQLObjectType,
  GraphQLSchema,
  buildSchema,
  graphql,
  type GraphQLFieldResolver,
} from 'graphql';
import { typeDefs } from '../graphql/schema.generated';
import type {
  DecisionInput,
  LineOfBusiness,
  RecommendedAction,
  SubmissionFilter,
  SubmissionStatus,
} from '../graphql/schema-types.generated';
import { assess, evaluateAppetite } from './assessment-engine';
import { MockDb, StoredAssessment, StoredDecision } from './mock-db';
import type { SeedSubmission } from './mock-types';

type Resolver = (parent: unknown, args: never) => unknown;

/** Attaches resolver maps to a schema built from SDL (a minimal makeExecutableSchema). */
function withResolvers(
  schema: GraphQLSchema,
  resolvers: Record<string, Record<string, Resolver>>,
): GraphQLSchema {
  for (const [typeName, fields] of Object.entries(resolvers)) {
    const type = schema.getType(typeName);
    if (!(type instanceof GraphQLObjectType)) throw new Error(`Unknown object type ${typeName}`);
    const typeFields = type.getFields();
    for (const [fieldName, fn] of Object.entries(fields)) {
      if (!typeFields[fieldName]) throw new Error(`Unknown field ${typeName}.${fieldName}`);
      typeFields[fieldName].resolve = ((parent, args) =>
        fn(parent, args as never)) as GraphQLFieldResolver<unknown, unknown>;
    }
  }
  return schema;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const STATUSES: SubmissionStatus[] = ['NEW', 'IN_REVIEW', 'QUOTED', 'DECLINED', 'BOUND'];
const LINES: LineOfBusiness[] = ['PROPERTY', 'COMMERCIAL_PACKAGE', 'GENERAL_LIABILITY', 'UMBRELLA'];

function fail(message: string, code: 'NOT_FOUND' | 'BAD_REQUEST'): never {
  throw new GraphQLError(message, { extensions: { classification: code } });
}

function statusFor(action: RecommendedAction): SubmissionStatus {
  return action === 'QUOTE' ? 'QUOTED' : action === 'DECLINE' ? 'DECLINED' : 'IN_REVIEW';
}

const round = (v: number, places: number) => Math.round(v * 10 ** places) / 10 ** places;

/**
 * Resolvers that mirror the Spring GraphQL controllers, executed in the browser against the
 * backend's own schema (see schema.generated.ts). `latencyMs` simulates network/AI time.
 */
export function createMockSchema(db: MockDb, latencyMs = { query: 80, assessment: 700 }) {
  const resolvers = {
    Query: {
      submissions: async (
        _: unknown,
        args: { filter?: SubmissionFilter | null; page?: number; size?: number },
      ) => {
        await sleep(latencyMs.query);
        const { filter } = args;
        const page = Math.max(args.page ?? 0, 0);
        const size = Math.max(1, Math.min(args.size ?? 10, 100));
        const search = filter?.search?.trim().toLowerCase();
        const items = db.state.submissions
          .filter((s) => !filter?.statuses?.length || filter.statuses.includes(s.status))
          .filter((s) => !filter?.lines?.length || filter.lines.includes(s.lineOfBusiness))
          .filter(
            (s) =>
              !search ||
              [
                s.applicant.name,
                s.reference,
                s.broker.name,
                s.broker.agency,
                s.applicant.city,
              ].some((v) => v.toLowerCase().includes(search)),
          )
          .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt) || a.id.localeCompare(b.id));
        return {
          items: items.slice(page * size, page * size + size),
          total: items.length,
          page,
          size,
        };
      },
      submission: async (_: unknown, { id }: { id: string }) => {
        await sleep(latencyMs.query);
        return db.submission(id) ?? null;
      },
      dashboard: async () => {
        await sleep(latencyMs.query);
        const all = db.state.submissions;
        const decided = all.filter((s) => s.decidedAt);
        const avgMinutes = decided.length
          ? decided.reduce(
              (sum, s) =>
                sum + Math.floor((Date.parse(s.decidedAt!) - Date.parse(s.receivedAt)) / 60000),
              0,
            ) / decided.length
          : 0;
        const quoted = all.filter((s) => s.status === 'QUOTED').length;
        const bound = all.filter((s) => s.status === 'BOUND').length;
        const ai = db.state.decisions.filter((d) => d.outcome !== 'MANUAL');
        return {
          totalSubmissions: all.length,
          byStatus: STATUSES.map((status) => ({
            status,
            count: all.filter((s) => s.status === status).length,
          })),
          byLine: LINES.map((lineOfBusiness) => {
            const subs = all.filter((s) => s.lineOfBusiness === lineOfBusiness);
            return {
              lineOfBusiness,
              count: subs.length,
              premium: subs.reduce((sum, s) => sum + s.premium, 0),
            };
          }),
          avgHoursToDecision: round(avgMinutes / 60, 1),
          quoteToBindRatio: quoted + bound === 0 ? 0 : round(bound / (quoted + bound), 3),
          aiAcceptanceRate: ai.length
            ? round(ai.filter((d) => d.outcome === 'ACCEPTED').length / ai.length, 3)
            : null,
          decisionsRecorded: ai.length,
        };
      },
      auditLog: async (
        _: unknown,
        { submissionId, limit }: { submissionId?: string | null; limit?: number },
      ) => {
        await sleep(latencyMs.query);
        return db.state.audit
          .filter((a) => !submissionId || a.entityId === submissionId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || Number(b.id) - Number(a.id))
          .slice(0, Math.max(1, Math.min(limit ?? 50, 500)));
      },
    },
    Mutation: {
      runAssessment: async (_: unknown, { submissionId }: { submissionId: string }) => {
        await sleep(latencyMs.assessment);
        const s =
          db.submission(submissionId) ?? fail(`Submission ${submissionId} not found`, 'NOT_FOUND');
        const appetite = evaluateAppetite(s, db.state.rules);
        const draft = assess(s, appetite);
        const stored: StoredAssessment = {
          ...draft,
          id: db.nextId('ASM'),
          submissionId,
          appetite: appetite.result,
          createdAt: new Date().toISOString(),
        };
        db.state.assessments.push(stored);
        if (s.status === 'NEW') s.status = 'IN_REVIEW';
        db.audit(
          'SUBMISSION',
          submissionId,
          'ASSESSMENT_RUN',
          'riskpilot-ai',
          `${draft.provider}: score ${draft.riskScore} (${draft.riskBand}), ${appetite.result.inAppetite ? 'in' : 'out of'} appetite, recommends ${draft.recommendedAction}`,
        );
        db.save();
        return stored;
      },
      recordDecision: async (_: unknown, { input }: { input: DecisionInput }) => {
        await sleep(latencyMs.query);
        if (!input.underwriter?.trim()) fail('Underwriter is required.', 'BAD_REQUEST');
        const s =
          db.submission(input.submissionId) ??
          fail(`Submission ${input.submissionId} not found`, 'NOT_FOUND');
        const a =
          db.state.assessments.find((x) => x.id === input.assessmentId) ??
          fail(`Assessment ${input.assessmentId} not found`, 'NOT_FOUND');
        if (a.submissionId !== s.id)
          fail('Assessment does not belong to this submission.', 'BAD_REQUEST');
        if (s.status === 'BOUND') fail('Submission is already bound.', 'BAD_REQUEST');
        const accepted = a.recommendedAction === input.finalAction;
        const reason = input.reason?.trim() ?? null;
        if (!accepted && (!reason || reason.length < 10)) {
          fail(
            'Overriding the AI recommendation requires a reason (min. 10 characters).',
            'BAD_REQUEST',
          );
        }
        const now = new Date().toISOString();
        const decision: StoredDecision = {
          id: db.nextId('DEC'),
          submissionId: s.id,
          assessmentId: a.id,
          recommendedAction: a.recommendedAction,
          finalAction: input.finalAction,
          outcome: accepted ? 'ACCEPTED' : 'OVERRIDDEN',
          reason: reason || null,
          underwriter: input.underwriter.trim(),
          decidedAt: now,
        };
        db.state.decisions.push(decision);
        s.status = statusFor(input.finalAction);
        if (input.finalAction === 'QUOTE' || input.finalAction === 'DECLINE') s.decidedAt = now;
        db.audit(
          'SUBMISSION',
          s.id,
          accepted ? 'DECISION_ACCEPTED' : 'DECISION_OVERRIDDEN',
          decision.underwriter,
          accepted
            ? `Accepted AI recommendation ${input.finalAction}`
            : `Overrode AI recommendation ${a.recommendedAction} → ${input.finalAction}. Reason: ${reason}`,
        );
        db.save();
        return decision;
      },
    },
    Submission: {
      losses: (s: SeedSubmission) => s.losses,
      documents: (s: SeedSubmission) => s.documents,
      latestAssessment: (s: SeedSubmission) =>
        db.state.assessments
          .filter((a) => a.submissionId === s.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
      decisions: (s: SeedSubmission) =>
        db.state.decisions
          .filter((d) => d.submissionId === s.id)
          .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt)),
    },
  };
  return withResolvers(
    buildSchema(typeDefs),
    resolvers as unknown as Record<string, Record<string, Resolver>>,
  );
}

/** Executes an operation against a mock schema (used by unit tests). */
export function executeMock(
  schema: GraphQLSchema,
  source: string,
  variableValues?: Record<string, unknown>,
) {
  return graphql({ schema, source, variableValues });
}
