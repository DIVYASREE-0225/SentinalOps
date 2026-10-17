export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IncidentStatus =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'EVIDENCE_COLLECTED'
  | 'ROOT_CAUSE_ANALYSIS'
  | 'BUSINESS_IMPACT_ANALYSIS'
  | 'RECOVERY_PLANNING'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'RESOLVED'
  | 'POSTMORTEM_GENERATED'
  | 'REOPENED'
  | 'FAILED';

export interface Service {
  id: string;
  name: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  healthScore: number; // 0 - 100
  latencyP99Ms: number;
  errorRatePercent: number;
  currentVersion: string;
  previousVersion: string;
  lastDeployedAt: string;
  dependencies: string[];
  description: string;
  runtime: string;
}

export interface MetricDataPoint {
  timestamp: string;
  latencyMs: number;
  errorRate: number;
  qps: number;
  cpuPercent: number;
  memoryPercent: number;
  dbPoolUsagePercent: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

export interface DatabaseSlowQuery {
  id: string;
  queryPattern: string;
  executionCount: number;
  avgDurationMs: number;
  maxDurationMs: number;
  callsPerSec: number;
  table: string;
  explainPlan: string;
  indexSuggested?: string;
  lockedByQueryId?: string;
}

export interface DatabaseLockInfo {
  pid: number;
  relation: string;
  mode: string;
  granted: boolean;
  query: string;
  waitingForPid?: number;
  ageSeconds: number;
}

export interface DatabaseState {
  connected: boolean;
  mode: 'POSTGRES_PG_DRIVER' | 'EMBEDDED_RELATIONAL';
  host: string;
  database: string;
  version: string;
  activeConnections: number;
  maxConnections: number;
  poolUtilizationPercent: number;
  transactionCommitRate: number;
  transactionRollbackRate: number;
  deadlocksDetected: number;
  cacheHitRatioPercent: number;
  slowQueries: DatabaseSlowQuery[];
  locks: DatabaseLockInfo[];
  tableStats: {
    tableName: string;
    rowCount: number;
    totalSizeBytes: number;
    sequentialScans: number;
    indexScans: number;
  }[];
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerTier: 'ENTERPRISE' | 'PRO' | 'STANDARD';
  amountCents: number; // stored as integer cents
  currency: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  service: string;
  createdAt: string;
  errorMessage?: string;
}

export interface EvidenceItem {
  id: string;
  incidentId: string;
  type: 'METRIC_SPIKE' | 'LOG_ERROR' | 'DB_SLOW_QUERY' | 'DB_LOCK' | 'DEPLOYMENT' | 'CUSTOMER_FAILURE';
  source: string;
  timestamp: string;
  summary: string;
  details: string;
  relevanceScore: number; // 0 - 1
  isContradictory?: boolean;
}

export interface RootCauseHypothesis {
  id: string;
  incidentId: string;
  rank: number;
  title: string;
  description: string;
  probability: number; // 0 - 1
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  validationCriteria: string;
  isPrimary: boolean;
}

export interface BusinessImpact {
  incidentId: string;
  affectedOrdersCount: number;
  measuredRevenueLossCents: number;
  atRiskRevenueCents: number;
  affectedCustomersCount: number;
  enterpriseCustomersImpacted: number;
  slaBreached: boolean;
  slaUptimePercent: number;
  tierBreakdown: {
    enterprise: number;
    pro: number;
    standard: number;
  };
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RecoveryAction {
  id: string;
  planId: string;
  actionCode: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  preconditions: string[];
  rollbackStrategy: string;
  verificationCriteria: string;
  status: 'PENDING' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED' | 'ROLLED_BACK';
  executionResult?: {
    output: string;
    exitCode: number;
    executedBy: string;
    timestamp: string;
  };
}

export interface RecoveryPlan {
  id: string;
  incidentId: string;
  title: string;
  summary: string;
  riskLevel: RiskLevel;
  actions: RecoveryAction[];
  requiresApproval: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED';
  approvedBy?: string;
  approvedAt?: string;
  decisionRationale?: string;
}

export interface VerificationResult {
  incidentId: string;
  status: 'VERIFIED_HEALTHY' | 'PARTIAL_RECOVERY' | 'VERIFICATION_FAILED';
  verifiedAt: string;
  latencyImprovementPercent: number;
  errorRateDropPercent: number;
  activePoolImprovementPercent: number;
  checks: {
    checkName: string;
    target: string;
    actual: string;
    passed: boolean;
  }[];
  verdictNotes: string;
}

export interface Postmortem {
  id: string;
  incidentId: string;
  title: string;
  generatedAt: string;
  leadInvestigator: string;
  executiveSummary: string;
  timeline: {
    timestamp: string;
    event: string;
    agentOrActor: string;
  }[];
  rootCauseAnalysis: {
    trigger: string;
    contributingFactors: string[];
    fiveWhys: string[];
  };
  impactSummary: string;
  recoverySummary: string;
  lessonsLearned: string[];
  followUpTasks: {
    id: string;
    title: string;
    owner: string;
    priority: 'P0' | 'P1' | 'P2';
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  }[];
}

export type AgentRole =
  | 'DETECTION'
  | 'INVESTIGATION'
  | 'POSTGRES_DB'
  | 'ROOT_CAUSE'
  | 'BUSINESS_IMPACT'
  | 'MEMORY_RAG'
  | 'RECOVERY_PLANNER'
  | 'APPROVAL_GATE'
  | 'VERIFICATION'
  | 'POSTMORTEM';

export interface AgentRun {
  id: string;
  incidentId: string;
  agentRole: AgentRole;
  agentName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  toolCallsCount: number;
  summary: string;
  toolCalls: {
    toolName: string;
    input: any;
    output: any;
    latencyMs: number;
  }[];
  structuredOutput?: any;
}

export interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  primaryServiceId: string;
  affectedServiceIds: string[];
  startedAt: string;
  detectedAt: string;
  resolvedAt?: string;
  scenarioKey?: string;
  description: string;
  baselineLatencyMs: number;
  currentLatencyMs: number;
  baselineErrorRate: number;
  currentErrorRate: number;
  assignedResponder: string;
  evidenceCount: number;
  hypothesesCount: number;
  actionsCount: number;
}

export interface Runbook {
  id: string;
  serviceId: string;
  title: string;
  symptoms: string[];
  diagnosticQueries: string[];
  mitigationSteps: string[];
  rollbackSteps: string[];
  tags: string[];
  lastUpdated: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress: string;
}

export interface SystemOverviewStats {
  systemHealthScore: number;
  activeIncidentsCount: number;
  criticalIncidentsCount: number;
  servicesCount: number;
  databaseStatus: 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED';
  systemErrorRatePercent: number;
  avgP99LatencyMs: number;
  activeAgentRunsCount: number;
  pendingApprovalsCount: number;
  mttdMinutes: number;
  mttrMinutes: number;
  recoverySuccessRatePercent: number;
  totalResolvedCount: number;
  measuredRevenueLossTodayCents: number;
}

export interface ScenarioDefinition {
  key: string;
  title: string;
  category: 'DATABASE' | 'INFRASTRUCTURE' | 'DEPLOYMENT' | 'INTEGRATION' | 'TRAFFIC';
  severity: IncidentSeverity;
  primaryServiceId: string;
  affectedServiceIds: string[];
  description: string;
  expectedRootCause: string;
  suggestedAction: string;
  riskLevel: RiskLevel;
}
