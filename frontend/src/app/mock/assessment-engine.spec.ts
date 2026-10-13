import golden from './assessment-golden.json';
import seed from './seed-data.json';
import { assess, evaluateAppetite } from './assessment-engine';
import type { SeedData } from './mock-types';

const data = seed as unknown as SeedData;
const expected = golden as Record<string, unknown>;

describe('assessment engine (frontend port)', () => {
  it('reproduces the backend golden output for every seed submission', () => {
    expect(Object.keys(expected)).toHaveLength(40);
    for (const s of data.submissions) {
      const appetite = evaluateAppetite(s, data.appetiteRules);
      const draft = assess(s, appetite);
      const actual = {
        riskScore: draft.riskScore,
        riskBand: draft.riskBand,
        confidence: draft.confidence,
        recommendedAction: draft.recommendedAction,
        rationale: draft.rationale,
        summary: draft.summary,
        appetite: appetite.result,
        signals: draft.signals,
      };
      expect(actual, s.id).toEqual(expected[s.id]);
    }
  });

  it('flags out-of-appetite submissions and never recommends quoting them', () => {
    for (const s of data.submissions) {
      const appetite = evaluateAppetite(s, data.appetiteRules);
      if (!appetite.result.inAppetite) {
        expect(assess(s, appetite).recommendedAction).not.toBe('QUOTE');
      }
    }
  });

  it('cites a document or the submission package for every signal', () => {
    const s = data.submissions[0];
    const draft = assess(s, evaluateAppetite(s, data.appetiteRules));
    for (const sig of draft.signals) {
      expect(sig.citation.documentName.length).toBeGreaterThan(0);
      expect(sig.citation.field.length).toBeGreaterThan(0);
    }
  });
});
