import type {
  ConstructionClass,
  LineOfBusiness,
  RecommendedAction,
  RiskBand,
} from '../graphql/schema-types.generated';
import type {
  AppetiteEvaluation,
  AppetiteRuleDto,
  AssessmentDraft,
  SeedDocument,
  SeedSubmission,
  Signal,
} from './mock-types';

/**
 * In-browser port of the backend's AppetiteEvaluator + MockAssessmentProvider
 * (backend/src/main/java/com/riskpilot/assessment). Kept in lock-step by a shared golden file
 * (assessment-golden.json) that both test suites verify.
 */

export const PROVIDER_NAME = 'mock-rules-v1';
const BASE_SCORE = 25;
const DECLINE_THRESHOLD = 75;
const REFER_THRESHOLD = 55;
const REFER_TIV_TOLERANCE = 0.25;

const CONSTRUCTION_ORDER: ConstructionClass[] = [
  'FRAME',
  'JOISTED_MASONRY',
  'NON_COMBUSTIBLE',
  'MASONRY_NON_COMBUSTIBLE',
  'MODIFIED_FIRE_RESISTIVE',
  'FIRE_RESISTIVE',
];

export const CONSTRUCTION_LABEL: Record<ConstructionClass, string> = {
  FRAME: 'Frame (ISO 1)',
  JOISTED_MASONRY: 'Joisted masonry (ISO 2)',
  NON_COMBUSTIBLE: 'Non-combustible (ISO 3)',
  MASONRY_NON_COMBUSTIBLE: 'Masonry non-combustible (ISO 4)',
  MODIFIED_FIRE_RESISTIVE: 'Modified fire resistive (ISO 5)',
  FIRE_RESISTIVE: 'Fire resistive (ISO 6)',
};

export const LINE_LABEL: Record<LineOfBusiness, string> = {
  PROPERTY: 'Property',
  COMMERCIAL_PACKAGE: 'Commercial package',
  GENERAL_LIABILITY: 'General liability',
  UMBRELLA: 'Umbrella',
};

const CONSTRUCTION_POINTS: Record<ConstructionClass, number> = {
  FRAME: 18,
  JOISTED_MASONRY: 12,
  NON_COMBUSTIBLE: 6,
  MASONRY_NON_COMBUSTIBLE: 2,
  MODIFIED_FIRE_RESISTIVE: -2,
  FIRE_RESISTIVE: -4,
};

export function money(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('en-US');
}

function meetsMinimum(actual: ConstructionClass, minimum: ConstructionClass | null): boolean {
  return (
    minimum === null || CONSTRUCTION_ORDER.indexOf(actual) >= CONSTRUCTION_ORDER.indexOf(minimum)
  );
}

// ------------------------------------------------------------------ appetite

export function evaluateAppetite(s: SeedSubmission, rules: AppetiteRuleDto[]): AppetiteEvaluation {
  const line = s.lineOfBusiness;
  const state = s.applicant.state;
  const construction = s.property.constructionClass;
  const tiv = s.property.tiv;
  const lineLabel = LINE_LABEL[line];
  const out = (reason: string, excess: number | null): AppetiteEvaluation => ({
    result: { inAppetite: false, reasons: [reason], matchedRuleId: null },
    tivExcessRatio: excess,
  });

  const forLine = rules.filter((r) => r.active && r.lineOfBusiness === line);
  if (forLine.length === 0) return out(`No active appetite rule covers ${lineLabel}.`, null);
  let forState = forLine.filter((r) => r.state === state);
  if (forState.length === 0) forState = forLine.filter((r) => r.state === null);
  if (forState.length === 0) return out(`${lineLabel} is not written in ${state}.`, null);
  const forConstruction = forState.filter((r) => meetsMinimum(construction, r.constructionClass));
  if (forConstruction.length === 0) {
    return out(
      `${CONSTRUCTION_LABEL[construction]} is below the minimum construction class for ${lineLabel} in ${state}.`,
      null,
    );
  }
  const best = [...forConstruction].sort((a, b) => b.maxTiv - a.maxTiv || a.id - b.id)[0];
  if (tiv <= best.maxTiv) {
    return {
      result: {
        inAppetite: true,
        reasons: [
          `Matches rule "${best.name}": TIV ${money(tiv)} is within the ${money(best.maxTiv)} limit.`,
        ],
        matchedRuleId: String(best.id),
      },
      tivExcessRatio: null,
    };
  }
  const excess = Math.round(((tiv - best.maxTiv) / best.maxTiv) * 10000) / 10000;
  return out(
    `TIV ${money(tiv)} exceeds the ${money(best.maxTiv)} limit of rule "${best.name}".`,
    excess,
  );
}

// ------------------------------------------------------------------ signals

function find(docs: SeedDocument[], type: string): SeedDocument | undefined {
  return docs.find((d) => d.type === type);
}

function cite(docs: SeedDocument[], type: string, field: string): Signal['citation'] {
  const d = find(docs, type);
  if (!d) return { documentId: null, documentName: `${type} (not on file)`, field, value: '—' };
  return {
    documentId: d.id,
    documentName: d.fileName,
    field,
    value: d.extractedFields.find((f) => f.key === field)?.value ?? '—',
  };
}

function add(
  out: Signal[],
  code: string,
  label: string,
  points: number,
  explanation: string,
  citation: Signal['citation'],
) {
  if (points === 0) return;
  out.push({
    code,
    label,
    impact: points > 0 ? 'INCREASES_RISK' : 'DECREASES_RISK',
    points,
    explanation,
    citation,
  });
}

function fmtMiles(miles: number): string {
  return String(miles);
}

export function signals(s: SeedSubmission): Signal[] {
  const p = s.property;
  const docs = s.documents;
  const out: Signal[] = [];

  const cPts = CONSTRUCTION_POINTS[p.constructionClass];
  add(
    out,
    'CONSTRUCTION',
    'Construction class',
    cPts,
    CONSTRUCTION_LABEL[p.constructionClass] +
      (cPts > 0 ? ' is combustible-leaning.' : ' is fire-resistive.'),
    cite(docs, 'ACORD_140', 'construction_class'),
  );

  add(
    out,
    'SPRINKLERS',
    p.sprinklered ? 'Fully sprinklered' : 'No sprinkler protection',
    p.sprinklered ? -8 : 10,
    p.sprinklered
      ? 'Automatic sprinklers materially reduce fire severity.'
      : 'No automatic sprinkler system reported.',
    cite(docs, 'ACORD_140', 'sprinklered'),
  );

  const pc = p.protectionClass;
  add(
    out,
    'PROTECTION_CLASS',
    `ISO protection class ${pc}`,
    pc >= 8 ? 10 : pc >= 5 ? 4 : -2,
    pc >= 8
      ? 'Limited public fire protection (PC 8–10).'
      : pc >= 5
        ? 'Average public fire protection.'
        : 'Strong public fire protection (PC 1–4).',
    cite(docs, 'ACORD_140', 'protection_class'),
  );

  const yb = p.yearBuilt;
  const agePts = yb < 1970 ? 10 : yb < 1990 ? 5 : yb >= 2010 ? -3 : 0;
  add(
    out,
    'BUILDING_AGE',
    `Built ${yb}`,
    agePts,
    agePts > 0
      ? 'Older building; wiring, plumbing and roof systems may predate modern codes.'
      : 'Modern construction to current building codes.',
    cite(docs, 'ACORD_140', 'year_built'),
  );

  if (find(docs, 'LOSS_RUNS')) {
    const count = s.losses.length;
    add(
      out,
      'LOSS_FREQUENCY',
      `${count}${count === 1 ? ' loss' : ' losses'} in 5 years`,
      count === 0 ? -6 : count === 1 ? 0 : count <= 3 ? 8 : 15,
      count === 0
        ? 'Loss-free for the last five years.'
        : 'Loss frequency above the class average.',
      cite(docs, 'LOSS_RUNS', 'loss_count_5y'),
    );
    const incurred = s.losses.reduce((sum, l) => sum + l.amountPaid + l.amountReserved, 0);
    if (incurred > 250_000) {
      add(
        out,
        'LOSS_SEVERITY',
        'Large incurred losses',
        8,
        `${money(incurred)} incurred over five years.`,
        cite(docs, 'LOSS_RUNS', 'total_incurred_5y'),
      );
    }
    const open = s.losses.filter((l) => l.status === 'OPEN').length;
    if (open > 0) {
      add(
        out,
        'OPEN_CLAIMS',
        `${open} open ${open === 1 ? 'claim' : 'claims'}`,
        5,
        'Open reserves may still develop adversely.',
        cite(docs, 'LOSS_RUNS', 'open_claims'),
      );
    }
  } else {
    out.push({
      code: 'LOSS_RUNS_MISSING',
      label: 'Loss runs not provided',
      impact: 'INCREASES_RISK',
      points: 5,
      explanation: 'Loss experience cannot be verified without currently valued loss runs.',
      citation: {
        documentId: null,
        documentName: 'Submission package',
        field: 'documents',
        value: 'No LOSS_RUNS document',
      },
    });
  }

  const coast = p.distanceToCoastMiles;
  add(
    out,
    'COASTAL_EXPOSURE',
    `${fmtMiles(coast)} mi to coast`,
    coast < 5 ? 12 : coast < 25 ? 5 : 0,
    coast < 5
      ? 'Within 5 miles of the coast: windstorm and surge exposure.'
      : 'Within 25 miles of the coast: elevated windstorm exposure.',
    cite(docs, 'SOV', 'distance_to_coast_miles'),
  );

  const zone = p.floodZone;
  add(
    out,
    'FLOOD_ZONE',
    `FEMA flood zone ${zone}`,
    zone.startsWith('V') ? 10 : zone.startsWith('A') ? 6 : 0,
    zone.startsWith('V')
      ? 'Coastal high-hazard flood zone.'
      : 'Special flood hazard area (1% annual chance).',
    cite(docs, 'SOV', 'flood_zone'),
  );

  if (find(docs, 'INSPECTION_REPORT')) {
    const roof = p.roofAgeYears;
    if (roof !== null) {
      add(
        out,
        'ROOF_AGE',
        `Roof age ${roof} yrs`,
        roof > 20 ? 8 : roof < 10 ? -3 : 0,
        roof > 20
          ? 'Roof beyond typical service life; wind/hail vulnerability.'
          : 'Recently replaced roof.',
        cite(docs, 'INSPECTION_REPORT', 'roof_age_years'),
      );
    }
    const recs = p.openRecommendations;
    if (recs !== null && recs >= 3) {
      add(
        out,
        'OPEN_RECOMMENDATIONS',
        `${recs} open loss-control recommendations`,
        5,
        'Outstanding recommendations from the last inspection.',
        cite(docs, 'INSPECTION_REPORT', 'open_recommendations'),
      );
    }
  } else {
    out.push({
      code: 'NO_INSPECTION',
      label: 'No inspection report',
      impact: 'INFORMATIONAL',
      points: 0,
      explanation:
        'Roof condition and loss-control status are unverified; consider ordering an inspection.',
      citation: {
        documentId: null,
        documentName: 'Submission package',
        field: 'documents',
        value: 'No INSPECTION_REPORT document',
      },
    });
  }

  const years = s.applicant.yearsInBusiness;
  add(
    out,
    'YEARS_IN_BUSINESS',
    `${years}${years === 1 ? ' year' : ' years'} in business`,
    years < 3 ? 6 : years >= 15 ? -4 : 0,
    years < 3 ? 'Limited operating history.' : 'Established operation with long track record.',
    cite(docs, 'ACORD_125', 'years_in_business'),
  );

  if (p.tiv > 30_000_000) {
    add(
      out,
      'TIV_CONCENTRATION',
      'High single-location TIV',
      6,
      `${money(p.tiv)} concentrated at one location.`,
      cite(docs, 'SOV', 'total_insured_value'),
    );
  }
  return out;
}

// ------------------------------------------------------------------ scoring

export function band(score: number): RiskBand {
  if (score < 30) return 'LOW';
  if (score < 50) return 'MODERATE';
  if (score < 70) return 'ELEVATED';
  return 'HIGH';
}

export function confidence(docs: SeedDocument[]): number {
  let c = 0.6;
  if (find(docs, 'LOSS_RUNS')) c += 0.2;
  if (find(docs, 'INSPECTION_REPORT')) c += 0.12;
  if (find(docs, 'FINANCIAL_STATEMENT')) c += 0.05;
  return Math.round(c * 100) / 100;
}

export function recommend(
  appetite: AppetiteEvaluation,
  hasLossRuns: boolean,
  score: number,
): RecommendedAction {
  if (!appetite.result.inAppetite) {
    const excess = appetite.tivExcessRatio;
    return excess !== null && excess <= REFER_TIV_TOLERANCE ? 'REFER' : 'DECLINE';
  }
  if (!hasLossRuns) return 'REQUEST_INFO';
  if (score >= DECLINE_THRESHOLD) return 'DECLINE';
  if (score >= REFER_THRESHOLD) return 'REFER';
  return 'QUOTE';
}

export function rationale(
  action: RecommendedAction,
  appetite: AppetiteEvaluation,
  score: number,
): string {
  if (!appetite.result.inAppetite) {
    if (action === 'REFER') {
      const pct = Math.round((appetite.tivExcessRatio ?? 0) * 100);
      return `TIV is ${pct}% over the rule limit, within referral tolerance (25%). Refer to a senior underwriter for authority.`;
    }
    return `Outside carrier appetite: ${appetite.result.reasons[0]}`;
  }
  switch (action) {
    case 'REQUEST_INFO':
      return 'In appetite, but loss runs are missing. Request 5-year currently valued loss runs before pricing.';
    case 'DECLINE':
      return `Risk score ${score} is at or above the decline threshold (${DECLINE_THRESHOLD}).`;
    case 'REFER':
      return `Risk score ${score} is in the referral band (${REFER_THRESHOLD}–${DECLINE_THRESHOLD - 1}). Senior review recommended.`;
    case 'QUOTE':
      return `In appetite with risk score ${score}. Proceed to quote at standard terms.`;
  }
}

export function summary(
  s: SeedSubmission,
  score: number,
  riskBand: RiskBand,
  sigs: Signal[],
): string {
  const p = s.property;
  const drivers = sigs
    .filter((x) => x.impact === 'INCREASES_RISK')
    .sort((a, b) => b.points - a.points)
    .slice(0, 2)
    .map((x) => x.label.toLowerCase());
  const driverText = drivers.length === 0 ? 'no material adverse signals' : drivers.join(' and ');
  return `${s.applicant.name}: ${p.occupancy.toLowerCase()} in ${s.applicant.city}, ${s.applicant.state}. ${CONSTRUCTION_LABEL[p.constructionClass]}, built ${p.yearBuilt}, TIV ${money(p.tiv)}. Risk score ${score} (${riskBand.toLowerCase()}), driven mainly by ${driverText}.`;
}

export function assess(s: SeedSubmission, appetite: AppetiteEvaluation): AssessmentDraft {
  const sigs = signals(s);
  const score = Math.max(0, Math.min(100, BASE_SCORE + sigs.reduce((sum, x) => sum + x.points, 0)));
  const b = band(score);
  const action = recommend(appetite, !!find(s.documents, 'LOSS_RUNS'), score);
  return {
    provider: PROVIDER_NAME,
    model: null,
    riskScore: score,
    riskBand: b,
    confidence: confidence(s.documents),
    summary: summary(s, score, b, sigs),
    signals: sigs,
    recommendedAction: action,
    rationale: rationale(action, appetite, score),
  };
}
