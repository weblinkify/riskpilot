/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ConstructionClass =
  | 'FIRE_RESISTIVE'
  | 'FRAME'
  | 'JOISTED_MASONRY'
  | 'MASONRY_NON_COMBUSTIBLE'
  | 'MODIFIED_FIRE_RESISTIVE'
  | 'NON_COMBUSTIBLE';

export type DecisionInput = {
  assessmentId: string;
  finalAction: RecommendedAction;
  /** Required when finalAction differs from the recommendation. */
  reason?: string | null | undefined;
  submissionId: string;
  underwriter: string;
};

export type DecisionOutcome =
  /** Underwriter followed the AI recommendation. */
  | 'ACCEPTED'
  /** Decision made without an AI recommendation (e.g. historical). */
  | 'MANUAL'
  /** Underwriter chose a different action; a reason is mandatory. */
  | 'OVERRIDDEN';

export type LineOfBusiness = 'COMMERCIAL_PACKAGE' | 'GENERAL_LIABILITY' | 'PROPERTY' | 'UMBRELLA';

export type RecommendedAction = 'DECLINE' | 'QUOTE' | 'REFER' | 'REQUEST_INFO';

export type RiskBand = 'ELEVATED' | 'HIGH' | 'LOW' | 'MODERATE';

export type SignalImpact = 'DECREASES_RISK' | 'INCREASES_RISK' | 'INFORMATIONAL';

export type SubmissionFilter = {
  lines?: Array<LineOfBusiness> | null | undefined;
  /** Matches applicant name, reference, broker name/agency or city (case-insensitive). */
  search?: string | null | undefined;
  statuses?: Array<SubmissionStatus> | null | undefined;
};

export type SubmissionStatus = 'BOUND' | 'DECLINED' | 'IN_REVIEW' | 'NEW' | 'QUOTED';

export type SubmissionRowFragment = {
  id: string;
  reference: string;
  status: SubmissionStatus;
  lineOfBusiness: LineOfBusiness;
  premium: number;
  receivedAt: string;
  applicant: { name: string; city: string; state: string };
  broker: { name: string; agency: string };
  property: { tiv: number };
};

export type AssessmentFieldsFragment = {
  id: string;
  submissionId: string;
  provider: string;
  model: string | null;
  riskScore: number;
  riskBand: RiskBand;
  confidence: number;
  summary: string;
  recommendedAction: RecommendedAction;
  rationale: string;
  createdAt: string;
  signals: Array<{
    code: string;
    label: string;
    impact: SignalImpact;
    points: number;
    explanation: string;
    citation: { documentId: string | null; documentName: string; field: string; value: string };
  }>;
  appetite: { inAppetite: boolean; reasons: Array<string>; matchedRuleId: string | null };
};

export type DecisionFieldsFragment = {
  id: string;
  submissionId: string;
  assessmentId: string | null;
  recommendedAction: RecommendedAction | null;
  finalAction: RecommendedAction;
  outcome: DecisionOutcome;
  reason: string | null;
  underwriter: string;
  decidedAt: string;
};

export type AuditFieldsFragment = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  details: string;
  createdAt: string;
};

export type SubmissionsQueryVariables = Exact<{
  filter?: SubmissionFilter | null | undefined;
  page?: number | null | undefined;
  size?: number | null | undefined;
}>;

export type SubmissionsQuery = {
  submissions: {
    total: number;
    page: number;
    size: number;
    items: Array<{
      id: string;
      reference: string;
      status: SubmissionStatus;
      lineOfBusiness: LineOfBusiness;
      premium: number;
      receivedAt: string;
      applicant: { name: string; city: string; state: string };
      broker: { name: string; agency: string };
      property: { tiv: number };
    }>;
  };
};

export type SubmissionDetailQueryVariables = Exact<{
  id: string;
}>;

export type SubmissionDetailQuery = {
  submission: {
    decidedAt: string | null;
    id: string;
    reference: string;
    status: SubmissionStatus;
    lineOfBusiness: LineOfBusiness;
    premium: number;
    receivedAt: string;
    applicant: {
      name: string;
      industry: string;
      yearsInBusiness: number;
      annualRevenue: number;
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    broker: { name: string; agency: string; email: string };
    property: {
      constructionClass: ConstructionClass;
      occupancy: string;
      yearBuilt: number;
      stories: number;
      squareFeet: number;
      sprinklered: boolean;
      protectionClass: number;
      tiv: number;
      floodZone: string;
      distanceToCoastMiles: number;
      roofAgeYears: number | null;
      openRecommendations: number | null;
    };
    losses: Array<{
      id: string;
      lossDate: string;
      cause: string;
      description: string;
      amountPaid: number;
      amountReserved: number;
      status: string;
    }>;
    documents: Array<{
      id: string;
      fileName: string;
      type: string;
      sizeBytes: number;
      pageCount: number;
      uploadedAt: string;
      extractedFields: Array<{ key: string; label: string; value: string }>;
    }>;
    latestAssessment: {
      id: string;
      submissionId: string;
      provider: string;
      model: string | null;
      riskScore: number;
      riskBand: RiskBand;
      confidence: number;
      summary: string;
      recommendedAction: RecommendedAction;
      rationale: string;
      createdAt: string;
      signals: Array<{
        code: string;
        label: string;
        impact: SignalImpact;
        points: number;
        explanation: string;
        citation: { documentId: string | null; documentName: string; field: string; value: string };
      }>;
      appetite: { inAppetite: boolean; reasons: Array<string>; matchedRuleId: string | null };
    } | null;
    decisions: Array<{
      id: string;
      submissionId: string;
      assessmentId: string | null;
      recommendedAction: RecommendedAction | null;
      finalAction: RecommendedAction;
      outcome: DecisionOutcome;
      reason: string | null;
      underwriter: string;
      decidedAt: string;
    }>;
  } | null;
  auditLog: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    actor: string;
    details: string;
    createdAt: string;
  }>;
};

export type RunAssessmentMutationVariables = Exact<{
  submissionId: string;
}>;

export type RunAssessmentMutation = {
  runAssessment: {
    id: string;
    submissionId: string;
    provider: string;
    model: string | null;
    riskScore: number;
    riskBand: RiskBand;
    confidence: number;
    summary: string;
    recommendedAction: RecommendedAction;
    rationale: string;
    createdAt: string;
    signals: Array<{
      code: string;
      label: string;
      impact: SignalImpact;
      points: number;
      explanation: string;
      citation: { documentId: string | null; documentName: string; field: string; value: string };
    }>;
    appetite: { inAppetite: boolean; reasons: Array<string>; matchedRuleId: string | null };
  };
};

export type RecordDecisionMutationVariables = Exact<{
  input: DecisionInput;
}>;

export type RecordDecisionMutation = {
  recordDecision: {
    id: string;
    submissionId: string;
    assessmentId: string | null;
    recommendedAction: RecommendedAction | null;
    finalAction: RecommendedAction;
    outcome: DecisionOutcome;
    reason: string | null;
    underwriter: string;
    decidedAt: string;
  };
};

export type DashboardQueryVariables = Exact<{ [key: string]: never }>;

export type DashboardQuery = {
  dashboard: {
    totalSubmissions: number;
    avgHoursToDecision: number;
    quoteToBindRatio: number;
    aiAcceptanceRate: number | null;
    decisionsRecorded: number;
    byStatus: Array<{ status: SubmissionStatus; count: number }>;
    byLine: Array<{ lineOfBusiness: LineOfBusiness; count: number; premium: number }>;
  };
};

export type AuditLogQueryVariables = Exact<{
  limit?: number | null | undefined;
}>;

export type AuditLogQuery = {
  auditLog: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    actor: string;
    details: string;
    createdAt: string;
  }>;
};

export const SubmissionRowFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SubmissionRow' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Submission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reference' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lineOfBusiness' } },
          { kind: 'Field', name: { kind: 'Name', value: 'premium' } },
          { kind: 'Field', name: { kind: 'Name', value: 'receivedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'applicant' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'city' } },
                { kind: 'Field', name: { kind: 'Name', value: 'state' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'broker' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'agency' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'property' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'tiv' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SubmissionRowFragment, unknown>;
export const AssessmentFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AssessmentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Assessment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'submissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'provider' } },
          { kind: 'Field', name: { kind: 'Name', value: 'model' } },
          { kind: 'Field', name: { kind: 'Name', value: 'riskScore' } },
          { kind: 'Field', name: { kind: 'Name', value: 'riskBand' } },
          { kind: 'Field', name: { kind: 'Name', value: 'confidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'signals' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                { kind: 'Field', name: { kind: 'Name', value: 'impact' } },
                { kind: 'Field', name: { kind: 'Name', value: 'points' } },
                { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'citation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'documentId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'documentName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'appetite' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'inAppetite' } },
                { kind: 'Field', name: { kind: 'Name', value: 'reasons' } },
                { kind: 'Field', name: { kind: 'Name', value: 'matchedRuleId' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'recommendedAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'rationale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AssessmentFieldsFragment, unknown>;
export const DecisionFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DecisionFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Decision' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'submissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'assessmentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'recommendedAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'finalAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'outcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'underwriter' } },
          { kind: 'Field', name: { kind: 'Name', value: 'decidedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DecisionFieldsFragment, unknown>;
export const AuditFieldsFragmentDoc = {
  kind: 'Document',
  definitions: [
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AuditFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AuditEntry' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'entityType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'action' } },
          { kind: 'Field', name: { kind: 'Name', value: 'actor' } },
          { kind: 'Field', name: { kind: 'Name', value: 'details' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AuditFieldsFragment, unknown>;
export const SubmissionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Submissions' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'filter' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'SubmissionFilter' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'size' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'submissions' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'filter' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'filter' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'size' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'size' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
                { kind: 'Field', name: { kind: 'Name', value: 'page' } },
                { kind: 'Field', name: { kind: 'Name', value: 'size' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'items' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'SubmissionRow' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SubmissionRow' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Submission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reference' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lineOfBusiness' } },
          { kind: 'Field', name: { kind: 'Name', value: 'premium' } },
          { kind: 'Field', name: { kind: 'Name', value: 'receivedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'applicant' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'city' } },
                { kind: 'Field', name: { kind: 'Name', value: 'state' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'broker' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'agency' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'property' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'tiv' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SubmissionsQuery, SubmissionsQueryVariables>;
export const SubmissionDetailDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'SubmissionDetail' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'submission' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'SubmissionRow' } },
                { kind: 'Field', name: { kind: 'Name', value: 'decidedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'applicant' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'industry' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'yearsInBusiness' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'annualRevenue' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'street' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'city' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'state' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'zip' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'broker' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'agency' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'property' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'constructionClass' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'occupancy' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'yearBuilt' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'stories' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'squareFeet' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sprinklered' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'protectionClass' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'tiv' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'floodZone' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'distanceToCoastMiles' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'roofAgeYears' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'openRecommendations' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'losses' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'lossDate' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'cause' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'amountPaid' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'amountReserved' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'documents' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'fileName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'sizeBytes' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'pageCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'uploadedAt' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'extractedFields' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'latestAssessment' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AssessmentFields' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'decisions' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'FragmentSpread', name: { kind: 'Name', value: 'DecisionFields' } },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'auditLog' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'submissionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'IntValue', value: '25' },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AuditFields' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'SubmissionRow' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Submission' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reference' } },
          { kind: 'Field', name: { kind: 'Name', value: 'status' } },
          { kind: 'Field', name: { kind: 'Name', value: 'lineOfBusiness' } },
          { kind: 'Field', name: { kind: 'Name', value: 'premium' } },
          { kind: 'Field', name: { kind: 'Name', value: 'receivedAt' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'applicant' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'city' } },
                { kind: 'Field', name: { kind: 'Name', value: 'state' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'broker' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'agency' } },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'property' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'tiv' } }],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AssessmentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Assessment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'submissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'provider' } },
          { kind: 'Field', name: { kind: 'Name', value: 'model' } },
          { kind: 'Field', name: { kind: 'Name', value: 'riskScore' } },
          { kind: 'Field', name: { kind: 'Name', value: 'riskBand' } },
          { kind: 'Field', name: { kind: 'Name', value: 'confidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'signals' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                { kind: 'Field', name: { kind: 'Name', value: 'impact' } },
                { kind: 'Field', name: { kind: 'Name', value: 'points' } },
                { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'citation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'documentId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'documentName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'appetite' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'inAppetite' } },
                { kind: 'Field', name: { kind: 'Name', value: 'reasons' } },
                { kind: 'Field', name: { kind: 'Name', value: 'matchedRuleId' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'recommendedAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'rationale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DecisionFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Decision' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'submissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'assessmentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'recommendedAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'finalAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'outcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'underwriter' } },
          { kind: 'Field', name: { kind: 'Name', value: 'decidedAt' } },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AuditFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AuditEntry' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'entityType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'action' } },
          { kind: 'Field', name: { kind: 'Name', value: 'actor' } },
          { kind: 'Field', name: { kind: 'Name', value: 'details' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SubmissionDetailQuery, SubmissionDetailQueryVariables>;
export const RunAssessmentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RunAssessment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'submissionId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'runAssessment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'submissionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'submissionId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AssessmentFields' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AssessmentFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Assessment' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'submissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'provider' } },
          { kind: 'Field', name: { kind: 'Name', value: 'model' } },
          { kind: 'Field', name: { kind: 'Name', value: 'riskScore' } },
          { kind: 'Field', name: { kind: 'Name', value: 'riskBand' } },
          { kind: 'Field', name: { kind: 'Name', value: 'confidence' } },
          { kind: 'Field', name: { kind: 'Name', value: 'summary' } },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'signals' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'code' } },
                { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                { kind: 'Field', name: { kind: 'Name', value: 'impact' } },
                { kind: 'Field', name: { kind: 'Name', value: 'points' } },
                { kind: 'Field', name: { kind: 'Name', value: 'explanation' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'citation' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'documentId' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'documentName' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'field' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'value' } },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'appetite' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'inAppetite' } },
                { kind: 'Field', name: { kind: 'Name', value: 'reasons' } },
                { kind: 'Field', name: { kind: 'Name', value: 'matchedRuleId' } },
              ],
            },
          },
          { kind: 'Field', name: { kind: 'Name', value: 'recommendedAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'rationale' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RunAssessmentMutation, RunAssessmentMutationVariables>;
export const RecordDecisionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RecordDecision' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'DecisionInput' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'recordDecision' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'DecisionFields' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'DecisionFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Decision' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'submissionId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'assessmentId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'recommendedAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'finalAction' } },
          { kind: 'Field', name: { kind: 'Name', value: 'outcome' } },
          { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
          { kind: 'Field', name: { kind: 'Name', value: 'underwriter' } },
          { kind: 'Field', name: { kind: 'Name', value: 'decidedAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RecordDecisionMutation, RecordDecisionMutationVariables>;
export const DashboardDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Dashboard' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'dashboard' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'totalSubmissions' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'byStatus' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'count' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'byLine' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'lineOfBusiness' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'count' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'premium' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'avgHoursToDecision' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quoteToBindRatio' } },
                { kind: 'Field', name: { kind: 'Name', value: 'aiAcceptanceRate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'decisionsRecorded' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DashboardQuery, DashboardQueryVariables>;
export const AuditLogDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AuditLog' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'auditLog' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'limit' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'FragmentSpread', name: { kind: 'Name', value: 'AuditFields' } },
              ],
            },
          },
        ],
      },
    },
    {
      kind: 'FragmentDefinition',
      name: { kind: 'Name', value: 'AuditFields' },
      typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AuditEntry' } },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          { kind: 'Field', name: { kind: 'Name', value: 'id' } },
          { kind: 'Field', name: { kind: 'Name', value: 'entityType' } },
          { kind: 'Field', name: { kind: 'Name', value: 'entityId' } },
          { kind: 'Field', name: { kind: 'Name', value: 'action' } },
          { kind: 'Field', name: { kind: 'Name', value: 'actor' } },
          { kind: 'Field', name: { kind: 'Name', value: 'details' } },
          { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AuditLogQuery, AuditLogQueryVariables>;
