export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type AppetiteResult = {
  __typename?: 'AppetiteResult';
  inAppetite: Scalars['Boolean']['output'];
  matchedRuleId: Maybe<Scalars['ID']['output']>;
  reasons: Array<Scalars['String']['output']>;
};

export type Applicant = {
  __typename?: 'Applicant';
  annualRevenue: Scalars['Float']['output'];
  city: Scalars['String']['output'];
  industry: Scalars['String']['output'];
  name: Scalars['String']['output'];
  state: Scalars['String']['output'];
  street: Scalars['String']['output'];
  yearsInBusiness: Scalars['Int']['output'];
  zip: Scalars['String']['output'];
};

export type Assessment = {
  __typename?: 'Assessment';
  appetite: AppetiteResult;
  confidence: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  model: Maybe<Scalars['String']['output']>;
  provider: Scalars['String']['output'];
  rationale: Scalars['String']['output'];
  recommendedAction: RecommendedAction;
  riskBand: RiskBand;
  riskScore: Scalars['Int']['output'];
  signals: Array<RiskSignal>;
  submissionId: Scalars['ID']['output'];
  summary: Scalars['String']['output'];
};

export type AuditEntry = {
  __typename?: 'AuditEntry';
  action: Scalars['String']['output'];
  actor: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  details: Scalars['String']['output'];
  entityId: Scalars['String']['output'];
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
};

export type Broker = {
  __typename?: 'Broker';
  agency: Scalars['String']['output'];
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** Where a signal's evidence comes from: a document and the extracted field. */
export type Citation = {
  __typename?: 'Citation';
  documentId: Maybe<Scalars['ID']['output']>;
  documentName: Scalars['String']['output'];
  field: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ConstructionClass =
  | 'FIRE_RESISTIVE'
  | 'FRAME'
  | 'JOISTED_MASONRY'
  | 'MASONRY_NON_COMBUSTIBLE'
  | 'MODIFIED_FIRE_RESISTIVE'
  | 'NON_COMBUSTIBLE';

export type Dashboard = {
  __typename?: 'Dashboard';
  aiAcceptanceRate: Maybe<Scalars['Float']['output']>;
  /** Average hours from receipt to a quote/decline decision. */
  avgHoursToDecision: Scalars['Float']['output'];
  byLine: Array<LineStat>;
  byStatus: Array<StatusCount>;
  decisionsRecorded: Scalars['Int']['output'];
  /** Bound / (Quoted + Bound). */
  quoteToBindRatio: Scalars['Float']['output'];
  totalSubmissions: Scalars['Int']['output'];
};

export type Decision = {
  __typename?: 'Decision';
  assessmentId: Maybe<Scalars['ID']['output']>;
  decidedAt: Scalars['String']['output'];
  finalAction: RecommendedAction;
  id: Scalars['ID']['output'];
  outcome: DecisionOutcome;
  reason: Maybe<Scalars['String']['output']>;
  recommendedAction: Maybe<RecommendedAction>;
  submissionId: Scalars['ID']['output'];
  underwriter: Scalars['String']['output'];
};

export type DecisionInput = {
  assessmentId: Scalars['ID']['input'];
  finalAction: RecommendedAction;
  /** Required when finalAction differs from the recommendation. */
  reason: InputMaybe<Scalars['String']['input']>;
  submissionId: Scalars['ID']['input'];
  underwriter: Scalars['String']['input'];
};

export type DecisionOutcome =
  /** Underwriter followed the AI recommendation. */
  | 'ACCEPTED'
  /** Decision made without an AI recommendation (e.g. historical). */
  | 'MANUAL'
  /** Underwriter chose a different action; a reason is mandatory. */
  | 'OVERRIDDEN';

export type Document = {
  __typename?: 'Document';
  extractedFields: Array<ExtractedField>;
  fileName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  pageCount: Scalars['Int']['output'];
  sizeBytes: Scalars['Int']['output'];
  type: Scalars['String']['output'];
  uploadedAt: Scalars['String']['output'];
};

export type ExtractedField = {
  __typename?: 'ExtractedField';
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type LineOfBusiness = 'COMMERCIAL_PACKAGE' | 'GENERAL_LIABILITY' | 'PROPERTY' | 'UMBRELLA';

export type LineStat = {
  __typename?: 'LineStat';
  count: Scalars['Int']['output'];
  lineOfBusiness: LineOfBusiness;
  premium: Scalars['Float']['output'];
};

export type Loss = {
  __typename?: 'Loss';
  amountPaid: Scalars['Float']['output'];
  amountReserved: Scalars['Float']['output'];
  cause: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lossDate: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Underwriter accepts or overrides the AI recommendation. Always written to the audit log. */
  recordDecision: Decision;
  /** Runs the configured AssessmentProvider. The result is a recommendation only. */
  runAssessment: Assessment;
};

export type MutationRecordDecisionArgs = {
  input: DecisionInput;
};

export type MutationRunAssessmentArgs = {
  submissionId: Scalars['ID']['input'];
};

export type PropertyDetails = {
  __typename?: 'PropertyDetails';
  constructionClass: ConstructionClass;
  distanceToCoastMiles: Scalars['Float']['output'];
  floodZone: Scalars['String']['output'];
  occupancy: Scalars['String']['output'];
  openRecommendations: Maybe<Scalars['Int']['output']>;
  protectionClass: Scalars['Int']['output'];
  roofAgeYears: Maybe<Scalars['Int']['output']>;
  sprinklered: Scalars['Boolean']['output'];
  squareFeet: Scalars['Int']['output'];
  stories: Scalars['Int']['output'];
  tiv: Scalars['Float']['output'];
  yearBuilt: Scalars['Int']['output'];
};

/**
 * RiskPilot GraphQL API.
 * Dates/times are ISO-8601 strings (UTC). Money amounts are USD as Float.
 */
export type Query = {
  __typename?: 'Query';
  /** Most recent audit entries, optionally scoped to one submission. */
  auditLog: Array<AuditEntry>;
  dashboard: Dashboard;
  submission: Maybe<Submission>;
  /** Paginated, filterable submissions inbox. */
  submissions: SubmissionPage;
};

/**
 * RiskPilot GraphQL API.
 * Dates/times are ISO-8601 strings (UTC). Money amounts are USD as Float.
 */
export type QueryAuditLogArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  submissionId: InputMaybe<Scalars['ID']['input']>;
};

/**
 * RiskPilot GraphQL API.
 * Dates/times are ISO-8601 strings (UTC). Money amounts are USD as Float.
 */
export type QuerySubmissionArgs = {
  id: Scalars['ID']['input'];
};

/**
 * RiskPilot GraphQL API.
 * Dates/times are ISO-8601 strings (UTC). Money amounts are USD as Float.
 */
export type QuerySubmissionsArgs = {
  filter: InputMaybe<SubmissionFilter>;
  page?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
};

export type RecommendedAction = 'DECLINE' | 'QUOTE' | 'REFER' | 'REQUEST_INFO';

export type RiskBand = 'ELEVATED' | 'HIGH' | 'LOW' | 'MODERATE';

export type RiskSignal = {
  __typename?: 'RiskSignal';
  citation: Citation;
  code: Scalars['String']['output'];
  explanation: Scalars['String']['output'];
  impact: SignalImpact;
  label: Scalars['String']['output'];
  /** Points contributed to the risk score (negative lowers risk). */
  points: Scalars['Int']['output'];
};

export type SignalImpact = 'DECREASES_RISK' | 'INCREASES_RISK' | 'INFORMATIONAL';

export type StatusCount = {
  __typename?: 'StatusCount';
  count: Scalars['Int']['output'];
  status: SubmissionStatus;
};

export type Submission = {
  __typename?: 'Submission';
  applicant: Applicant;
  broker: Broker;
  decidedAt: Maybe<Scalars['String']['output']>;
  decisions: Array<Decision>;
  documents: Array<Document>;
  id: Scalars['ID']['output'];
  latestAssessment: Maybe<Assessment>;
  lineOfBusiness: LineOfBusiness;
  losses: Array<Loss>;
  premium: Scalars['Float']['output'];
  property: PropertyDetails;
  receivedAt: Scalars['String']['output'];
  reference: Scalars['String']['output'];
  status: SubmissionStatus;
};

export type SubmissionFilter = {
  lines: InputMaybe<Array<LineOfBusiness>>;
  /** Matches applicant name, reference, broker name/agency or city (case-insensitive). */
  search: InputMaybe<Scalars['String']['input']>;
  statuses: InputMaybe<Array<SubmissionStatus>>;
};

export type SubmissionPage = {
  __typename?: 'SubmissionPage';
  items: Array<Submission>;
  page: Scalars['Int']['output'];
  size: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type SubmissionStatus = 'BOUND' | 'DECLINED' | 'IN_REVIEW' | 'NEW' | 'QUOTED';
