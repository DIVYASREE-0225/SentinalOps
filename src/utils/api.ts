import {
  Incident,
  Service,
  SystemOverviewStats,
  ScenarioDefinition,
  EvidenceItem,
  RootCauseHypothesis,
  BusinessImpact,
  RecoveryPlan,
  VerificationResult,
  Postmortem,
  AgentRun,
  Runbook,
  AuditLogEntry,
  DatabaseState,
} from '../types';

export const api = {
  getOverview: async (): Promise<SystemOverviewStats> => {
    const res = await fetch('/api/overview');
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
  },

  getServices: async (): Promise<Service[]> => {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  getIncidents: async (): Promise<Incident[]> => {
    const res = await fetch('/api/incidents');
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  getIncidentDetails: async (id: string): Promise<{
    incident: Incident;
    primaryService?: Service;
    evidence: EvidenceItem[];
    hypotheses: RootCauseHypothesis[];
    impact: BusinessImpact | null;
    recoveryPlan: RecoveryPlan | null;
    verification: VerificationResult | null;
    postmortem: Postmortem | null;
    agentRuns: AgentRun[];
  }> => {
    const res = await fetch(`/api/incidents/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
    return res.json();
  },

  createIncident: async (data: {
    title: string;
    severity: string;
    primaryServiceId: string;
    description: string;
  }): Promise<Incident> => {
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create incident');
    return res.json();
  },

  investigateIncident: async (id: string): Promise<Incident> => {
    const res = await fetch(`/api/incidents/${id}/investigate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run investigation');
    return res.json();
  },

  approveRecovery: async (planId: string, approvedBy: string, rationale?: string) => {
    const res = await fetch(`/api/recovery/${planId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy, rationale }),
    });
    if (!res.ok) throw new Error('Failed to approve recovery');
    return res.json();
  },

  rejectRecovery: async (planId: string, rejectedBy: string, rationale?: string) => {
    const res = await fetch(`/api/recovery/${planId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectedBy, rationale }),
    });
    if (!res.ok) throw new Error('Failed to reject recovery');
    return res.json();
  },

  verifyRecovery: async (incidentId: string): Promise<VerificationResult> => {
    const res = await fetch(`/api/incidents/${incidentId}/verify`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to verify recovery');
    return res.json();
  },

  generatePostmortem: async (incidentId: string): Promise<Postmortem> => {
    const res = await fetch(`/api/incidents/${incidentId}/postmortem`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate postmortem');
    return res.json();
  },

  getDatabaseHealth: async () => {
    const res = await fetch('/api/database/health');
    if (!res.ok) throw new Error('Failed to fetch database health');
    return res.json();
  },

  connectDatabase: async (url: string) => {
    const res = await fetch('/api/database/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  },

  getDatabaseQueries: async () => {
    const res = await fetch('/api/database/queries');
    if (!res.ok) throw new Error('Failed to fetch database queries');
    return res.json();
  },

  getAnalytics: async () => {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  getAuditLogs: async (): Promise<AuditLogEntry[]> => {
    const res = await fetch('/api/audit');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getAllAgents: async (): Promise<AgentRun[]> => {
    const res = await fetch('/api/agents');
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },

  getScenarios: async (): Promise<ScenarioDefinition[]> => {
    const res = await fetch('/api/simulations/scenarios');
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  simulateIncident: async (scenarioKey: string): Promise<Incident> => {
    const res = await fetch('/api/simulations/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioKey }),
    });
    if (!res.ok) throw new Error('Failed to simulate incident');
    return res.json();
  },

  getRunbooks: async (): Promise<Runbook[]> => {
    const res = await fetch('/api/knowledge/runbooks');
    if (!res.ok) throw new Error('Failed to fetch runbooks');
    return res.json();
  },

  getPostmortems: async (): Promise<Postmortem[]> => {
    const res = await fetch('/api/knowledge/postmortems');
    if (!res.ok) throw new Error('Failed to fetch postmortems');
    return res.json();
  },

  queryCommandCenter: async (prompt: string): Promise<string> => {
    const res = await fetch('/api/command-center', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error('Failed to query command center');
    const data = await res.json();
    return data.response;
  },
};
