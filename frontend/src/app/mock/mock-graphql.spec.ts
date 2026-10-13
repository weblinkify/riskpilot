import { MockDb } from './mock-db';
import { createMockSchema, executeMock } from './mock-graphql';

describe('mock GraphQL layer', () => {
  let db: MockDb;
  let run: (
    source: string,
    variableValues?: Record<string, unknown>,
  ) => ReturnType<typeof executeMock>;

  beforeEach(() => {
    db = new MockDb(false);
    const schema = createMockSchema(db, { query: 0, assessment: 0 });
    run = (source, variableValues) => executeMock(schema, source, variableValues);
  });

  it('paginates and filters submissions like the backend', async () => {
    const all = await run('{ submissions(page: 3, size: 10) { total page items { id } } }');
    expect(all.data?.['submissions']).toMatchObject({ total: 40, page: 3 });

    const filtered = await run(
      'query($f: SubmissionFilter) { submissions(filter: $f, size: 50) { total items { status } } }',
      { f: { statuses: ['NEW'] } },
    );
    const page = filtered.data?.['submissions'] as { total: number; items: { status: string }[] };
    expect(page.total).toBe(10);
    expect(page.items.every((i) => i.status === 'NEW')).toBe(true);
  });

  it('records an accepted decision and moves the submission to the matching status', async () => {
    const assessed = await run(
      'mutation { runAssessment(submissionId: "SUB-1003") { id recommendedAction } }',
    );
    const a = assessed.data?.['runAssessment'] as { id: string; recommendedAction: string };
    expect(db.submission('SUB-1003')?.status).toBe('IN_REVIEW');

    const res = await run(
      'mutation($i: DecisionInput!) { recordDecision(input: $i) { outcome finalAction } }',
      {
        i: {
          submissionId: 'SUB-1003',
          assessmentId: a.id,
          finalAction: a.recommendedAction,
          underwriter: 'Test',
        },
      },
    );
    expect(res.errors).toBeUndefined();
    expect(res.data?.['recordDecision']).toEqual({
      outcome: 'ACCEPTED',
      finalAction: a.recommendedAction,
    });
    expect(db.state.audit.at(-1)?.action).toBe('DECISION_ACCEPTED');
  });

  it('rejects an override without a reason', async () => {
    const assessed = await run(
      'mutation { runAssessment(submissionId: "SUB-1005") { id recommendedAction } }',
    );
    const a = assessed.data?.['runAssessment'] as { id: string; recommendedAction: string };
    const other = a.recommendedAction === 'DECLINE' ? 'QUOTE' : 'DECLINE';
    const res = await run('mutation($i: DecisionInput!) { recordDecision(input: $i) { id } }', {
      i: {
        submissionId: 'SUB-1005',
        assessmentId: a.id,
        finalAction: other,
        reason: 'short',
        underwriter: 'Test',
      },
    });
    expect(res.errors?.[0].message).toContain('requires a reason');
    expect(
      db.state.decisions.filter((d) => d.submissionId === 'SUB-1005' && d.outcome !== 'MANUAL'),
    ).toHaveLength(0);
  });

  it('computes dashboard KPIs from the seed', async () => {
    const res = await run(
      '{ dashboard { totalSubmissions quoteToBindRatio aiAcceptanceRate byStatus { status count } } }',
    );
    const d = res.data?.['dashboard'] as {
      totalSubmissions: number;
      quoteToBindRatio: number;
      aiAcceptanceRate: number | null;
    };
    expect(d.totalSubmissions).toBe(40);
    expect(d.quoteToBindRatio).toBe(Math.round((7 / 15) * 1000) / 1000);
    expect(d.aiAcceptanceRate).toBeNull();
  });
});
