import type {
  ConstructionClass,
  LineOfBusiness,
  RecommendedAction,
  RiskBand,
  SubmissionStatus,
} from '../graphql/schema-types.generated';

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  NEW: 'New',
  IN_REVIEW: 'In review',
  QUOTED: 'Quoted',
  DECLINED: 'Declined',
  BOUND: 'Bound',
};
export const STATUSES = Object.keys(STATUS_LABEL) as SubmissionStatus[];

export const LINE_LABEL: Record<LineOfBusiness, string> = {
  PROPERTY: 'Property',
  COMMERCIAL_PACKAGE: 'Commercial package',
  GENERAL_LIABILITY: 'General liability',
  UMBRELLA: 'Umbrella',
};
export const LINES = Object.keys(LINE_LABEL) as LineOfBusiness[];

export const CONSTRUCTION_LABEL: Record<ConstructionClass, string> = {
  FRAME: 'Frame (ISO 1)',
  JOISTED_MASONRY: 'Joisted masonry (ISO 2)',
  NON_COMBUSTIBLE: 'Non-combustible (ISO 3)',
  MASONRY_NON_COMBUSTIBLE: 'Masonry non-combustible (ISO 4)',
  MODIFIED_FIRE_RESISTIVE: 'Modified fire resistive (ISO 5)',
  FIRE_RESISTIVE: 'Fire resistive (ISO 6)',
};
export const CONSTRUCTION_CLASSES = Object.keys(CONSTRUCTION_LABEL) as ConstructionClass[];

export const ACTION_LABEL: Record<RecommendedAction, string> = {
  QUOTE: 'Quote',
  REFER: 'Refer',
  REQUEST_INFO: 'Request info',
  DECLINE: 'Decline',
};
export const ACTIONS = Object.keys(ACTION_LABEL) as RecommendedAction[];

export const ACTION_HINT: Record<RecommendedAction, string> = {
  QUOTE: 'Proceed to pricing',
  REFER: 'Escalate to senior authority',
  REQUEST_INFO: 'Ask broker for missing documents',
  DECLINE: 'Send declination to broker',
};

export const BAND_LABEL: Record<RiskBand, string> = {
  LOW: 'Low risk',
  MODERATE: 'Moderate risk',
  ELEVATED: 'Elevated risk',
  HIGH: 'High risk',
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  ACORD_125: 'ACORD 125 – Applicant',
  ACORD_140: 'ACORD 140 – Property',
  SOV: 'Statement of values',
  LOSS_RUNS: 'Loss runs',
  INSPECTION_REPORT: 'Inspection report',
  FINANCIAL_STATEMENT: 'Financial statement',
  OTHER: 'Other',
};

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const usd = (n: number) => usd0.format(n);
export const usdCompact = (n: number) => '$' + compact.format(n);
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
export const fileSize = (bytes: number) =>
  bytes > 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1000))} KB`;
