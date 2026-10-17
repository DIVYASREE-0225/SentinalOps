import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { orchestrator } from './server/orchestrator';
import { tools } from './server/tools';
import { SCENARIOS } from './server/scenarios';
import { runCommandCenterWithAI } from './server/ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Seed one historical resolved incident and one active incident on boot
  try {
    // 1. Initial simulated incident for instant live exploration
    await orchestrator.simulateScenario('postgres-query-regression');
  } catch (err) {
    console.error('Initial scenario simulation error:', err);
  }

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'SentinelOps Orchestrator',
      timestamp: new Date().toISOString(),
      database: db.getDatabaseHealth(),
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // System Overview Stats
  app.get('/api/overview', (req: Request, res: Response) => {
    const stats = db.getSystemOverviewStats();
    res.json(stats);
  });

  // Services Catalog
  app.get('/api/services', (req: Request, res: Response) => {
    res.json(Array.from(db.services.values()));
  });

  // Incidents List
  app.get('/api/incidents', (req: Request, res: Response) => {
    const list = Array.from(db.incidents.values()).sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
    res.json(list);
  });

  // Create Manual Incident
  app.post('/api/incidents', async (req: Request, res: Response) => {
    const { title, severity, primaryServiceId, description } = req.body;
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const incident = {
      id: incidentId,
      title: title || 'Manual Alert Notification',
      severity: severity || 'HIGH',
      status: 'DETECTED' as const,
      primaryServiceId: primaryServiceId || 'order-service',
      affectedServiceIds: [primaryServiceId || 'order-service'],
      startedAt: now,
      detectedAt: now,
      description: description || 'Operator initiated investigation.',
      baselineLatencyMs: 45,
      currentLatencyMs: 380,
      baselineErrorRate: 0.02,
      currentErrorRate: 4.5,
      assignedResponder: 'SentinelOps Autonomous Agent',
      evidenceCount: 0,
      hypothesesCount: 0,
      actionsCount: 0,
    };

    db.incidents.set(incidentId, incident);
    db.addAuditLog('operator', 'CREATE_MANUAL_INCIDENT', 'INCIDENT', incidentId, `Created incident: ${incident.title}`);

    // Trigger autonomous investigation
    await orchestrator.runInvestigationPhase(incidentId);

    res.status(201).json(db.incidents.get(incidentId));
  });

  // Incident Details with full relations
  app.get('/api/incidents/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const incident = db.incidents.get(id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const evidence = db.evidence.get(id) || [];
    const hypotheses = db.hypotheses.get(id) || [];
    const impact = db.businessImpacts.get(id) || null;
    const recoveryPlan = db.recoveryPlans.get(id) || null;
    const verification = db.verificationResults.get(id) || null;
    const postmortem = db.postmortems.get(id) || null;
    const agentRuns = db.agentRuns.get(id) || [];
    const primaryService = db.services.get(incident.primaryServiceId);

    res.json({
      incident,
      primaryService,
      evidence,
      hypotheses,
      impact,
      recoveryPlan,
      verification,
      postmortem,
      agentRuns,
    });
  });

  // Advance / Retrigger Investigation
  app.post('/api/incidents/:id/investigate', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await orchestrator.runInvestigationPhase(id);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Evidence list
  app.get('/api/incidents/:id/evidence', (req: Request, res: Response) => {
    const evidence = db.evidence.get(req.params.id) || [];
    res.json(evidence);
  });

  // Agent execution timeline for specific incident
  app.get('/api/incidents/:id/agents', (req: Request, res: Response) => {
    const runs = db.agentRuns.get(req.params.id) || [];
    res.json(runs);
  });

  // All agent execution runs across the platform
  app.get('/api/agents', (req: Request, res: Response) => {
    res.json(db.getAllAgentRuns());
  });

  // Generate / Regenerate Recovery Plan
  app.post('/api/incidents/:id/recovery-plan', async (req: Request, res: Response) => {
    try {
      const updated = await orchestrator.runRecoveryPlanningPhase(req.params.id);
      res.json(db.recoveryPlans.get(req.params.id));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Approve Recovery Plan
  app.post('/api/recovery/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { approvedBy, rationale } = req.body;
      const plan = db.findRecoveryPlan(id);
      if (!plan) return res.status(404).json({ error: 'Recovery plan not found' });

      if (rationale) {
        plan.decisionRationale = rationale;
      }

      const updated = await orchestrator.executeRecoveryPlan(plan.incidentId, approvedBy || 'Staff SRE Operator');
      res.json({
        plan: db.findRecoveryPlan(plan.incidentId),
        incident: updated,
        verification: db.verificationResults.get(plan.incidentId),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reject Recovery Plan
  app.post('/api/recovery/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { rejectedBy, rationale } = req.body;
    const plan = db.findRecoveryPlan(id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    plan.approvalStatus = 'REJECTED';
    plan.decisionRationale = rationale || 'Rejected by operator due to operational risk.';
    db.addAuditLog(rejectedBy || 'operator', 'REJECT_RECOVERY_PLAN', 'RECOVERY_PLAN', plan.id, plan.decisionRationale || '');

    const inc = db.incidents.get(plan.incidentId);
    if (inc) {
      inc.status = 'AWAITING_APPROVAL';
    }

    res.json(plan);
  });

  // Trigger Recovery Verification
  app.post('/api/incidents/:id/verify', async (req: Request, res: Response) => {
    try {
      const verification = await tools.verify_recovery.execute({ incidentId: req.params.id });
      res.json(verification);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Postmortem details & generation
  app.post('/api/incidents/:id/postmortem', async (req: Request, res: Response) => {
    try {
      const postmortem = await tools.generate_postmortem.execute({ incidentId: req.params.id });
      res.json(postmortem);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Database Health & Observability
  app.get('/api/database/health', (req: Request, res: Response) => {
    res.json(db.getDatabaseHealth());
  });

  // Connect to External PostgreSQL (DATABASE_URL)
  app.post('/api/database/connect', async (req: Request, res: Response) => {
    const { url } = req.body;
    const result = await db.attemptPostgresConnection(url);
    res.json(result);
  });

  // Database Queries & Locks
  app.get('/api/database/queries', (req: Request, res: Response) => {
    res.json({
      slowQueries: db.dbState.slowQueries,
      locks: db.dbState.locks,
      tableStats: db.dbState.tableStats,
      activeConnections: db.dbState.activeConnections,
      maxConnections: db.dbState.maxConnections,
      poolUtilization: db.dbState.poolUtilizationPercent,
    });
  });

  // Analytics
  app.get('/api/analytics', (req: Request, res: Response) => {
    const incidents = Array.from(db.incidents.values());
    const stats = db.getSystemOverviewStats();

    // Severity Breakdown
    const severityCount = {
      CRITICAL: incidents.filter((i) => i.severity === 'CRITICAL').length,
      HIGH: incidents.filter((i) => i.severity === 'HIGH').length,
      MEDIUM: incidents.filter((i) => i.severity === 'MEDIUM').length,
      LOW: incidents.filter((i) => i.severity === 'LOW').length,
    };

    // Root Cause Categories
    const rootCauses = [
      { name: 'Database Query Regression', count: 6, percentage: 35 },
      { name: 'Connection Pool Exhaustion', count: 4, percentage: 24 },
      { name: 'Deployment Regressions', count: 3, percentage: 18 },
      { name: 'Deadlock Contention', count: 2, percentage: 12 },
      { name: 'Upstream Network Timeout', count: 2, percentage: 11 },
    ];

    res.json({
      stats,
      severityCount,
      rootCauses,
      incidentsCount: incidents.length,
      resolvedCount: stats.totalResolvedCount,
      automationRatePercent: 88.4,
    });
  });

  // Audit Logs
  app.get('/api/audit', (req: Request, res: Response) => {
    res.json(db.auditLogs);
  });

  // Scenarios List
  app.get('/api/simulations/scenarios', (req: Request, res: Response) => {
    res.json(SCENARIOS);
  });

  // Run Incident Simulation
  app.post('/api/simulations/incidents', async (req: Request, res: Response) => {
    try {
      const { scenarioKey } = req.body;
      const incident = await orchestrator.simulateScenario(scenarioKey || 'postgres-query-regression');
      res.status(201).json(incident);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Runbooks & Knowledge
  app.get('/api/knowledge/runbooks', (req: Request, res: Response) => {
    res.json(Array.from(db.runbooks.values()));
  });

  app.get('/api/knowledge/postmortems', (req: Request, res: Response) => {
    res.json(Array.from(db.postmortems.values()));
  });

  // Natural Language Command Center
  app.post('/api/command-center', async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const context = {
      activeIncidents: Array.from(db.incidents.values()).filter((i) => i.status !== 'RESOLVED' && i.status !== 'POSTMORTEM_GENERATED'),
      database: db.getDatabaseHealth(),
      healthScore: db.getSystemOverviewStats().systemHealthScore,
      services: Array.from(db.services.values()).map((s) => ({ name: s.name, status: s.status, p99: s.latencyP99Ms })),
    };

    const reply = await runCommandCenterWithAI(prompt, context);
    db.addAuditLog('operator', 'COMMAND_CENTER_QUERY', 'AI_ENGINE', 'gemini-3.8-flash', `Query: "${prompt.slice(0, 50)}..."`);
    res.json({ response: reply });
  });

  // Vite dev server middleware integration
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SentinelOps Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
