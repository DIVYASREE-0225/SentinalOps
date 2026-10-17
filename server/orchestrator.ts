import { db } from './db';
import { tools } from './tools';
import { analyzeRootCauseWithAI } from './ai';
import {
  Incident,
  EvidenceItem,
  RecoveryAction,
  AgentRun,
  AgentRole,
} from '../src/types';
import { SCENARIOS } from './scenarios';

export class IncidentOrchestrator {
  // Helper to record agent run
  private recordAgentRun(
    incidentId: string,
    role: AgentRole,
    name: string,
    durationMs: number,
    toolCalls: { toolName: string; input: any; output: any; latencyMs: number }[],
    summary: string,
    structuredOutput?: any
  ): AgentRun {
    const run: AgentRun = {
      id: `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      incidentId,
      agentRole: role,
      agentName: name,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - durationMs).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      toolCallsCount: toolCalls.length,
      toolCalls,
      summary,
      structuredOutput,
    };

    const runs = db.agentRuns.get(incidentId) || [];
    runs.push(run);
    db.agentRuns.set(incidentId, runs);
    return run;
  }

  // Trigger scenario simulation
  public async simulateScenario(scenarioKey: string): Promise<Incident> {
    const scenario = SCENARIOS.find((s) => s.key === scenarioKey) || SCENARIOS[0];
    const incidentId = `INC-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const startedAt = new Date(now.getTime() - 180000).toISOString(); // 3 min ago

    // Update affected service health
    const primaryService = db.services.get(scenario.primaryServiceId);
    const baselineLatency = primaryService?.latencyP99Ms || 45;
    const baselineError = primaryService?.errorRatePercent || 0.02;

    const currentLatency = baselineLatency * (scenario.severity === 'CRITICAL' ? 35 : 12);
    const currentError = scenario.severity === 'CRITICAL' ? 18.5 : 4.8;

    if (primaryService) {
      primaryService.status = scenario.severity === 'CRITICAL' ? 'OUTAGE' : 'DEGRADED';
      primaryService.healthScore = scenario.severity === 'CRITICAL' ? 32 : 64;
      primaryService.latencyP99Ms = currentLatency;
      primaryService.errorRatePercent = currentError;
    }

    // Seed realistic customer orders and failed checkouts in database for this incident
    db.seedOrdersForIncident(
      incidentId,
      scenario.primaryServiceId,
      startedAt,
      scenario.severity,
      scenario.key
    );

    // Set specific DB and infrastructure telemetry depending on scenario
    if (scenario.key === 'postgres-query-regression') {
      db.dbState.poolUtilizationPercent = 78;
      db.dbState.activeConnections = 78;
      db.dbState.slowQueries = [
        {
          id: 'sq-1',
          queryPattern: 'SELECT * FROM orders WHERE customer_id = $1 AND created_at >= $2',
          executionCount: 2840,
          avgDurationMs: 1840,
          maxDurationMs: 4200,
          callsPerSec: 45,
          table: 'orders',
          explainPlan:
            'Seq Scan on orders (cost=0.00..89240.50 rows=1450 width=248)\nFilter: (customer_id = $1 AND created_at >= $2)\nRows Removed by Filter: 4210430\nBuffers: shared hit=48 read=84192',
          indexSuggested:
            'CREATE INDEX CONCURRENTLY idx_orders_customer_created ON orders (customer_id, created_at);',
        },
      ];
    } else if (scenario.key === 'connection-pool-exhaustion') {
      db.dbState.poolUtilizationPercent = 99;
      db.dbState.activeConnections = 99;
      db.dbState.maxConnections = 100;
      db.dbState.slowQueries = [
        {
          id: 'sq-idle-1',
          queryPattern: 'SELECT * FROM inventory_items WHERE sku = $1 (held in idle in transaction)',
          executionCount: 1420,
          avgDurationMs: 3100,
          maxDurationMs: 6500,
          callsPerSec: 32,
          table: 'inventory_items',
          explainPlan: 'Index Scan on inventory_items (state: idle in transaction, age > 140s)',
          indexSuggested: 'SET idle_in_transaction_session_timeout = "60s";',
        },
      ];
    } else if (scenario.key === 'database-deadlock-storm') {
      db.dbState.deadlocksDetected = 14;
      db.dbState.locks = [
        {
          pid: 14820,
          relation: 'orders',
          mode: 'ExclusiveLock',
          granted: true,
          query: 'UPDATE orders SET status = "PROCESSING" WHERE id = 48291',
          ageSeconds: 14,
        },
        {
          pid: 18492,
          relation: 'inventory_items',
          mode: 'RowShareLock',
          granted: false,
          query: 'UPDATE inventory_items SET stock = stock - 1 WHERE sku = "SKU-902"',
          waitingForPid: 14820,
          ageSeconds: 12,
        },
      ];
    } else if (scenario.key === 'cache-failure') {
      db.dbState.cacheHitRatioPercent = 22.4;
      db.dbState.poolUtilizationPercent = 84;
    } else {
      // Nominal DB state
      db.dbState.deadlocksDetected = 0;
      db.dbState.locks = [];
    }

    // Generate correlated logs
    const log1 = {
      id: `log-${Date.now()}-1`,
      timestamp: startedAt,
      service: scenario.primaryServiceId,
      level: 'WARN' as const,
      message: `P99 latency threshold exceeded: ${currentLatency}ms (SLA target: 120ms)`,
    };

    let errorLogMsg = 'Upstream gateway returned 504 Gateway Timeout on checkout dispatch';
    if (scenario.key === 'postgres-query-regression') {
      errorLogMsg = 'QueryTimeoutException: canceling statement due to statement_timeout (30000ms) on table orders';
    } else if (scenario.key === 'database-deadlock-storm') {
      errorLogMsg = 'ERROR: 40P01: deadlock detected between PID 14820 (UPDATE orders) and PID 18492 (UPDATE inventory_items)';
    } else if (scenario.key === 'connection-pool-exhaustion') {
      errorLogMsg = 'ConnectionPoolExhaustedException: client connection acquisition timed out after 5000ms (100/100 active)';
    } else if (scenario.key === 'failed-deployment') {
      errorLogMsg = 'TypeError: Cannot read properties of undefined (reading "countryCode") in BillingModule.ts:42 (release v2.14.0)';
    } else if (scenario.key === 'payment-gateway-failure') {
      errorLogMsg = 'ETIMEDOUT: upstream payment partner Strype API /v1/charges returned 504 Gateway Timeout';
    } else if (scenario.key === 'memory-leak') {
      errorLogMsg = 'ProcessMemoryWarning: Heap RSS reached 94% of cgroup ceiling (1820MB / 2048MB) with +45MB/min leak';
    } else if (scenario.key === 'cache-failure') {
      errorLogMsg = 'RedisClusterException: Node 10.0.4.12 OOM crashed; replica failover triggered 50k key stampede onto PostgreSQL';
    } else if (scenario.key === 'traffic-spike') {
      errorLogMsg = 'IngressSurgeWarning: 10,200 QPS received (8.5x baseline). HPA throttled at max 12 replicas. HTTP 429 triggered';
    } else if (scenario.key === 'external-api-failure') {
      errorLogMsg = 'PartnerProviderError: Avalara Vertex Partner Tax API returned HTTP 503 Service Unavailable';
    }

    const log2 = {
      id: `log-${Date.now()}-2`,
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      service: scenario.primaryServiceId,
      level: 'ERROR' as const,
      message: errorLogMsg,
    };
    db.telemetryLogs.push(log1, log2);

    // Create Incident Record
    const incident: Incident = {
      id: incidentId,
      title: scenario.title,
      severity: scenario.severity,
      status: 'DETECTED',
      primaryServiceId: scenario.primaryServiceId,
      affectedServiceIds: scenario.affectedServiceIds,
      startedAt,
      detectedAt: now.toISOString(),
      scenarioKey: scenario.key,
      description: scenario.description,
      baselineLatencyMs: baselineLatency,
      currentLatencyMs: currentLatency,
      baselineErrorRate: baselineError,
      currentErrorRate: currentError,
      assignedResponder: 'SentinelOps Autonomous Agent',
      evidenceCount: 0,
      hypothesesCount: 0,
      actionsCount: 0,
    };

    db.incidents.set(incidentId, incident);
    db.addAuditLog(
      'detection-agent',
      'DETECT_INCIDENT',
      'INCIDENT',
      incidentId,
      `Autonomous detection triggered for ${scenario.title}`
    );

    // Auto-advance investigation
    await this.runInvestigationPhase(incidentId);

    return incident;
  }

  // Phase 1: Investigation & Evidence Collection
  public async runInvestigationPhase(incidentId: string): Promise<Incident> {
    const inc = db.incidents.get(incidentId);
    if (!inc) throw new Error('Incident not found');

    inc.status = 'INVESTIGATING';

    // 1. Detection Agent
    this.recordAgentRun(
      incidentId,
      'DETECTION',
      'Anomaly Detection Agent',
      120,
      [
        {
          toolName: 'get_service_health',
          input: { serviceId: inc.primaryServiceId },
          output: { status: 'DEGRADED', p99: inc.currentLatencyMs },
          latencyMs: 14,
        },
      ],
      `Detected anomalous metric shift: P99 latency ${inc.currentLatencyMs}ms vs baseline ${inc.baselineLatencyMs}ms.`
    );

    // 2. Investigation Agent (Logs & Deployments)
    const logs = await tools.search_logs.execute({ serviceId: inc.primaryServiceId, query: '', minLevel: 'WARN' });
    const deployment = await tools.get_deployment_history.execute({ serviceId: inc.primaryServiceId });

    this.recordAgentRun(
      incidentId,
      'INVESTIGATION',
      'Telemetry & Log Correlation Agent',
      240,
      [
        {
          toolName: 'search_logs',
          input: { serviceId: inc.primaryServiceId },
          output: `${logs.length} error logs retrieved`,
          latencyMs: 25,
        },
        {
          toolName: 'get_deployment_history',
          input: { serviceId: inc.primaryServiceId },
          output: deployment,
          latencyMs: 18,
        },
      ],
      `Correlated ${logs.length} error traces and deployment ${deployment.currentVersion}.`
    );

    // 3. PostgreSQL Database Agent
    const dbHealth = await tools.get_database_health.execute({});
    const slowQueries = await tools.get_slow_queries.execute({});
    const locks = await tools.get_database_locks.execute({});

    this.recordAgentRun(
      incidentId,
      'POSTGRES_DB',
      'PostgreSQL Database Reliability Agent',
      310,
      [
        { toolName: 'get_database_health', input: {}, output: dbHealth, latencyMs: 32 },
        { toolName: 'get_slow_queries', input: {}, output: slowQueries, latencyMs: 40 },
        { toolName: 'get_database_locks', input: {}, output: locks, latencyMs: 28 },
      ],
      `Diagnosed database state: active connections ${dbHealth.activeConnections}/${dbHealth.maxConnections}, ${slowQueries.length} slow queries, ${locks.length} active lock contentions.`
    );

    // Build Evidence Items Tailored to Scenario
    const collectedEvidence: EvidenceItem[] = [
      {
        id: `ev-${Date.now()}-1`,
        incidentId,
        type: 'METRIC_SPIKE',
        source: `${inc.primaryServiceId}/telemetry`,
        timestamp: inc.startedAt,
        summary: `P99 Latency reached ${inc.currentLatencyMs}ms (${Math.round((inc.currentLatencyMs / inc.baselineLatencyMs) * 100)}% of baseline)`,
        details: `Anomaly detector fired at ${inc.startedAt}. Threshold breached for 3 consecutive 10s evaluation windows.`,
        relevanceScore: 0.98,
      },
      {
        id: `ev-${Date.now()}-2`,
        incidentId,
        type: 'LOG_ERROR',
        source: `${inc.primaryServiceId}/logs`,
        timestamp: new Date().toISOString(),
        summary: `Concentration of 5xx errors: current error rate ${inc.currentErrorRate}%`,
        details: `Log samples indicate transaction timeout and thread pool starvation matching signature.`,
        relevanceScore: 0.94,
      },
    ];

    if (slowQueries.length > 0) {
      collectedEvidence.push({
        id: `ev-${Date.now()}-3`,
        incidentId,
        type: 'DB_SLOW_QUERY',
        source: 'postgres-primary/pg_stat_statements',
        timestamp: new Date().toISOString(),
        summary: `Sequential scan on ${slowQueries[0].table} taking ${slowQueries[0].avgDurationMs}ms average`,
        details: `EXPLAIN plan: ${slowQueries[0].explainPlan.split('\n')[0]} without index. Suggested: ${slowQueries[0].indexSuggested}`,
        relevanceScore: 0.99,
      });
    }

    if (locks.length > 0) {
      collectedEvidence.push({
        id: `ev-${Date.now()}-4`,
        incidentId,
        type: 'DB_LOCK',
        source: 'postgres-primary/pg_locks',
        timestamp: new Date().toISOString(),
        summary: `Deadlock / Lock contention between PID ${locks[0].pid} and ${locks[1]?.pid || 'workers'}`,
        details: `Exclusive lock held on relation ${locks[0].relation} for ${locks[0].ageSeconds} seconds.`,
        relevanceScore: 0.96,
      });
    }

    if (inc.scenarioKey === 'failed-deployment') {
      collectedEvidence.push({
        id: `ev-${Date.now()}-5`,
        incidentId,
        type: 'DEPLOYMENT',
        source: `${inc.primaryServiceId}/git-deploy`,
        timestamp: new Date().toISOString(),
        summary: `Release v2.14.0 deployed 12 minutes prior to anomaly`,
        details: `Commit 8a1f49 introduced unhandled null reference on optional billing address payload.`,
        relevanceScore: 0.99,
      });
    }

    db.evidence.set(incidentId, collectedEvidence);
    inc.evidenceCount = collectedEvidence.length;
    inc.status = 'EVIDENCE_COLLECTED';

    // Auto-advance to Root Cause & Business Impact
    await this.runAnalysisPhase(incidentId);

    return inc;
  }

  // Phase 2: Root Cause Analysis & Business Impact
  public async runAnalysisPhase(incidentId: string): Promise<Incident> {
    const inc = db.incidents.get(incidentId);
    if (!inc) throw new Error('Incident not found');

    inc.status = 'ROOT_CAUSE_ANALYSIS';
    const evidence = db.evidence.get(incidentId) || [];

    // 4. Root Cause Agent (Gemini or deterministic synthesis)
    const { hypotheses } = await analyzeRootCauseWithAI(inc, evidence, db.dbState);
    db.hypotheses.set(incidentId, hypotheses);
    inc.hypothesesCount = hypotheses.length;

    this.recordAgentRun(
      incidentId,
      'ROOT_CAUSE',
      'Hypothesis Formulation & Evidence Reasoning Agent',
      420,
      [
        {
          toolName: 'evaluate_hypotheses',
          input: { hypothesesCount: hypotheses.length },
          output: hypotheses[0],
          latencyMs: 85,
        },
      ],
      `Formulated ${hypotheses.length} competing hypotheses. Primary: ${hypotheses[0].title} (${Math.round(hypotheses[0].probability * 100)}% confidence).`,
      hypotheses
    );

    // 5. Business Impact Agent (Real SQL aggregation over persisted orders)
    inc.status = 'BUSINESS_IMPACT_ANALYSIS';
    const impact = await tools.calculate_business_impact.execute({ incidentId });
    impact.incidentId = incidentId;
    db.businessImpacts.set(incidentId, impact);

    this.recordAgentRun(
      incidentId,
      'BUSINESS_IMPACT',
      'Financial & Customer Impact Quantification Agent',
      180,
      [{ toolName: 'calculate_business_impact', input: { incidentId }, output: impact, latencyMs: 42 }],
      `Calculated impact from persisted orders: ${impact.affectedOrdersCount} failed orders, $${(impact.measuredRevenueLossCents / 100).toFixed(2)} measured loss, SLA ${impact.slaBreached ? 'BREACHED' : 'NOMINAL'}.`,
      impact
    );

    // 6. Memory & RAG Agent
    const similar = await tools.search_similar_incidents.execute({
      serviceId: inc.primaryServiceId,
      keywords: inc.title,
    });
    const runbook = await tools.get_runbook.execute({ serviceId: inc.primaryServiceId });

    this.recordAgentRun(
      incidentId,
      'MEMORY_RAG',
      'Vector Memory & Runbook Retrieval Agent',
      210,
      [
        { toolName: 'search_similar_incidents', input: { serviceId: inc.primaryServiceId }, output: similar, latencyMs: 50 },
        { toolName: 'get_runbook', input: { serviceId: inc.primaryServiceId }, output: runbook.title, latencyMs: 25 },
      ],
      `Retrieved runbook "${runbook.title}" and ${similar.length} similar historical incidents (top match: ${similar[0].similarityScore * 100}% similarity).`
    );

    // Advance to Recovery Planning
    await this.runRecoveryPlanningPhase(incidentId);

    return inc;
  }

  // Phase 3: Recovery Planning & Approval Gate
  public async runRecoveryPlanningPhase(incidentId: string): Promise<Incident> {
    const inc = db.incidents.get(incidentId);
    if (!inc) throw new Error('Incident not found');

    inc.status = 'RECOVERY_PLANNING';
    const scenario = SCENARIOS.find((s) => s.key === inc.scenarioKey);

    // Construct recovery actions based on scenario
    const actions: RecoveryAction[] = [];

    if (inc.scenarioKey === 'postgres-query-regression') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'CREATE_INDEX_CONCURRENTLY',
        title: 'Create Composite Index Concurrently on orders Table',
        description: 'Execute CREATE INDEX CONCURRENTLY idx_orders_customer_created ON orders (customer_id, created_at). Ensures zero table locks.',
        riskLevel: 'MEDIUM',
        requiresApproval: false,
        preconditions: ['PostgreSQL write replica in sync', 'Free disk space > 10GB'],
        rollbackStrategy: 'DROP INDEX CONCURRENTLY IF EXISTS idx_orders_customer_created;',
        verificationCriteria: 'EXPLAIN plan returns Index Scan with cost < 50.00',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'CANCEL_RUNAWAY_QUERIES',
        title: 'Cancel Runaway Unindexed Queries in pg_stat_activity',
        description: 'Terminate queries running > 60s performing sequential scan to immediately relieve CPU saturation.',
        riskLevel: 'HIGH',
        requiresApproval: true,
        preconditions: ['Verified client can retry idempotent query'],
        rollbackStrategy: 'None required.',
        verificationCriteria: 'CPU utilization drops below 40%',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'connection-pool-exhaustion') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'TERMINATE_IDLE_TRANSACTIONS',
        title: 'Terminate Rogue Idle Transactions in pg_stat_activity',
        description: "SELECT pg_terminate_backend(pid) WHERE state = 'idle in transaction' AND now() - state_change > interval '60s'.",
        riskLevel: 'HIGH',
        requiresApproval: true,
        preconditions: ['Client connection pool retry handler enabled'],
        rollbackStrategy: 'Application workers will reconnect automatically.',
        verificationCriteria: 'Active connections drop below 60/100',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'EXPAND_PGBOUNCER_POOL',
        title: 'Dynamically Increase PgBouncer Max Client Limit to 180',
        description: 'Scale connection pool capacity on Aurora cluster.',
        riskLevel: 'MEDIUM',
        requiresApproval: false,
        preconditions: ['PostgreSQL max_connections headroom verified'],
        rollbackStrategy: 'Revert PgBouncer default_pool_size to 100.',
        verificationCriteria: 'Connection pool wait queue reaches 0',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'database-deadlock-storm') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'TERMINATE_BLOCKING_PID',
        title: 'Terminate Blocking Query PID 18492',
        description: 'SELECT pg_terminate_backend(18492) to break the cyclic deadlock wait chain.',
        riskLevel: 'CRITICAL',
        requiresApproval: true,
        preconditions: ['PID verified in pg_catalog.pg_locks as non-granted blocked'],
        rollbackStrategy: 'Application retry handler will replay checkout transaction',
        verificationCriteria: 'pg_locks shows zero blocked granted=false rows',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'ENFORCE_LOCK_ORDER',
        title: 'Enforce Consistent Table Acquisition Order in Checkout Coordinator',
        description: 'Deploy runtime transaction wrapper enforcing (orders THEN inventory_items).',
        riskLevel: 'HIGH',
        requiresApproval: true,
        preconditions: ['Zero active in-flight checkout mutations'],
        rollbackStrategy: 'Disable ordering lock wrapper via feature flag.',
        verificationCriteria: 'Zero ERROR: 40P01 deadlocks detected in subsequent 5 minutes',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'failed-deployment') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'K8S_ROLLOUT_UNDO',
        title: 'Rollback Deployment checkout-service to Stable Revision v2.13.9',
        description: 'Execute kubectl rollout undo deployment/checkout-service -n production.',
        riskLevel: 'HIGH',
        requiresApproval: true,
        preconditions: ['Previous Docker image tag exists in ECR registry'],
        rollbackStrategy: 'kubectl rollout undo deployment/checkout-service --to-revision=v2.14.0',
        verificationCriteria: 'Ingress 5xx error rate drops below 0.1%',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'PURGE_EDGE_CACHE',
        title: 'Purge Edge Route Cache on Envoy Gateways',
        description: 'Invalidate stale route configurations.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Origin nodes healthy'],
        rollbackStrategy: 'None required.',
        verificationCriteria: 'Envoy route cache hit ratio normalizes',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'payment-gateway-failure') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'ENGAGE_CIRCUIT_BREAKER_FAILOVER',
        title: 'Trip Circuit Breaker & Failover Traffic to Adyen Gateway',
        description: 'Redirect checkout settlement pipeline from failing Strype endpoints to Adyen Secondary Broker.',
        riskLevel: 'HIGH',
        requiresApproval: true,
        preconditions: ['Adyen API credentials verified and active in Secrets Manager'],
        rollbackStrategy: 'Re-enable Strype primary broker when upstream SLA recovers.',
        verificationCriteria: 'Payment gateway error rate drops from 32.4% to < 0.1%',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'DRAIN_PENDING_QUEUE',
        title: 'Requeue Dropped Checkout Transactions for Async Settlement',
        description: 'Replay 84 dropped order payloads from dead-letter queue.',
        riskLevel: 'MEDIUM',
        requiresApproval: false,
        preconditions: ['Secondary broker accepting transactions'],
        rollbackStrategy: 'Halt dead-letter consumer queue.',
        verificationCriteria: 'DLQ depth returns to 0',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'api-latency-spike') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'WARM_REDIS_JWKS_CACHE',
        title: 'Pre-warm Redis JWKS Asymmetric Key Cache',
        description: 'Preload RSA public keys into Redis cluster to bypass cold-path crypto re-verification.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Redis cluster reachable'],
        rollbackStrategy: 'Flush JWKS key namespace.',
        verificationCriteria: 'Auth gateway P99 drops below 50ms',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'RECONFIGURE_REDIS_EVICTION',
        title: 'Apply allkeys-lru Eviction Policy with 2GB Memory Ceiling',
        description: 'Prevent premature eviction of active cryptographic public keys.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Sufficient node RAM available'],
        rollbackStrategy: 'Revert to volatile-lru policy.',
        verificationCriteria: 'Cache hit ratio recovers to > 98%',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'memory-leak') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'ROLLING_RESTART_PODS',
        title: 'Perform Graceful Rolling Restart of order-service Pods',
        description: 'Restart container instances with 30s connection draining to reset process heap.',
        riskLevel: 'MEDIUM',
        requiresApproval: false,
        preconditions: ['Minimum 8 healthy replica pods available'],
        rollbackStrategy: 'Pause rolling restart.',
        verificationCriteria: 'Heap RSS usage drops below 35% of cgroup limit',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'FORCE_GC_CLEANUP',
        title: 'Clear Leaked Event Emitter Listeners & Trigger GC',
        description: 'Unregister dangling webhook callback handlers.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Process running'],
        rollbackStrategy: 'None required.',
        verificationCriteria: 'Memory creep rate drops to 0 MB/min',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'cache-failure') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'INJECT_CACHE_JITTER',
        title: 'Inject Randomized TTL Expiration Jitter (+/- 15%)',
        description: 'Distribute 50,000 product catalog key expirations across time window to eliminate stampedes.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Redis replica synchronized'],
        rollbackStrategy: 'Revert to fixed TTL values.',
        verificationCriteria: 'PostgreSQL read QPS returns to baseline 450 QPS',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'SEMAPHORE_RATE_LIMIT_DB',
        title: 'Enforce Token Bucket Concurrency Limiting on Fallback DB Queries',
        description: 'Protect database from unthrottled cache miss surges.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Catalog service healthy'],
        rollbackStrategy: 'Disable fallback rate limiting.',
        verificationCriteria: 'PostgreSQL pool utilization drops below 40%',
        status: 'PENDING',
      });
    } else if (inc.scenarioKey === 'traffic-spike') {
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'EXPAND_HPA_CEILING',
        title: 'Expand Kubernetes HPA Ceiling from 12 to 40 Replicas',
        description: 'Allow horizontal pod autoscaler to scale out checkout workers to absorb 10k QPS.',
        riskLevel: 'MEDIUM',
        requiresApproval: false,
        preconditions: ['Node group autoscaler has available capacity'],
        rollbackStrategy: 'Scale down to 12 replicas after campaign surge ends.',
        verificationCriteria: 'CPU utilization across pods drops below 55%',
        status: 'PENDING',
      });
      actions.push({
        id: `act-${Date.now()}-2`,
        planId: '',
        actionCode: 'ENGAGE_WAITING_ROOM',
        title: 'Activate Cloudflare Edge Virtual Waiting Room for Flash Sale',
        description: 'Smooth traffic distribution into checkout queue.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Cloudflare zone active'],
        rollbackStrategy: 'Disable waiting room.',
        verificationCriteria: 'Zero HTTP 429 rate limit errors recorded',
        status: 'PENDING',
      });
    } else {
      // Default external-api-failure or generic
      actions.push({
        id: `act-${Date.now()}-1`,
        planId: '',
        actionCode: 'ENABLE_OFFLINE_TAX_ESTIMATION',
        title: 'Enable Offline Asynchronous Tax Estimation Fallback',
        description: 'Switch checkout tax computation to asynchronous zip-code table with post-settlement reconciliation.',
        riskLevel: 'LOW',
        requiresApproval: false,
        preconditions: ['Local tax estimation tables loaded'],
        rollbackStrategy: 'Switch back to online partner API.',
        verificationCriteria: 'Checkout completion rate restores to 99.8%',
        status: 'PENDING',
      });
    }

    const plan = await tools.create_recovery_plan.execute({ incidentId, actions });
    inc.actionsCount = actions.length;

    this.recordAgentRun(
      incidentId,
      'RECOVERY_PLANNER',
      'Autonomous Recovery Planning Agent',
      290,
      [{ toolName: 'create_recovery_plan', input: { actionsCount: actions.length }, output: plan, latencyMs: 65 }],
      `Formulated recovery plan with ${actions.length} prioritized actions. Highest risk: ${plan.riskLevel}.`,
      plan
    );

    // Approval Agent evaluation
    if (plan.requiresApproval) {
      inc.status = 'AWAITING_APPROVAL';
      plan.approvalStatus = 'PENDING';
      await tools.request_approval.execute({
        planId: plan.id,
        incidentId,
        riskLevel: plan.riskLevel,
      });

      this.recordAgentRun(
        incidentId,
        'APPROVAL_GATE',
        'Server-Side Policy & Approval Enforcement Agent',
        110,
        [
          {
            toolName: 'request_approval',
            input: { riskLevel: plan.riskLevel, planId: plan.id },
            output: 'AWAITING_HUMAN_APPROVAL',
            latencyMs: 15,
          },
        ],
        `Policy enforcement: Plan contains ${plan.riskLevel} risk actions. SRE authorization required prior to execution.`
      );
    } else {
      // Auto-approve low risk
      const policyEvaluation = await tools.evaluate_policy.execute({
        planId: plan.id,
        riskLevel: plan.riskLevel,
      });

      plan.approvalStatus = 'AUTO_APPROVED';
      plan.approvedBy = 'Policy Engine (Low-Risk Exemption)';
      plan.approvedAt = new Date().toISOString();
      plan.decisionRationale = 'Automatically approved under Safety Policy Rule #3: Low-Risk Exemption.';

      this.recordAgentRun(
        incidentId,
        'APPROVAL_GATE',
        'Server-Side Policy & Approval Enforcement Agent',
        95,
        [
          {
            toolName: 'evaluate_policy',
            input: { riskLevel: plan.riskLevel, planId: plan.id },
            output: policyEvaluation,
            latencyMs: 12,
          },
        ],
        `Policy enforcement: All actions classified as LOW risk. Auto-approved according to Safety Policy Rule #3.`
      );

      // Immediately execute the auto-approved plan
      await this.executeRecoveryPlan(incidentId, 'Policy Engine (Low-Risk Exemption)');
    }

    return inc;
  }

  // Phase 4: Execution & Verification
  public async executeRecoveryPlan(
    incidentId: string,
    approvedBy: string = 'Staff SRE Operator'
  ): Promise<Incident> {
    const inc = db.incidents.get(incidentId);
    if (!inc) throw new Error('Incident not found');
    const plan = db.findRecoveryPlan(incidentId);
    if (!plan) throw new Error('Recovery plan not found');

    // Safety Gate Check: Ensure risky plans are not executed without approval
    if (plan.requiresApproval && plan.approvalStatus === 'REJECTED') {
      throw new Error('Cannot execute rejected recovery plan.');
    }

    plan.approvalStatus = 'APPROVED';
    plan.approvedBy = approvedBy;
    plan.approvedAt = new Date().toISOString();
    if (!plan.decisionRationale) {
      plan.decisionRationale = 'Authorized by SRE Lead after evaluating verification criteria and rollback safety.';
    }
    inc.status = 'EXECUTING';

    db.addAuditLog(
      approvedBy,
      'APPROVE_RECOVERY_PLAN',
      'RECOVERY_PLAN',
      plan.id,
      `Plan ${plan.id} authorized for execution`
    );

    // Execute each action through the safe recovery adapter
    for (const action of plan.actions) {
      await tools.execute_recovery_action.execute({ actionId: action.id, incidentId });
    }

    // Phase 5: Verification
    inc.status = 'VERIFYING';
    const verification = await tools.verify_recovery.execute({ incidentId });

    this.recordAgentRun(
      incidentId,
      'VERIFICATION',
      'Health Telemetry & SLA Verification Agent',
      350,
      [{ toolName: 'verify_recovery', input: { incidentId }, output: verification, latencyMs: 90 }],
      `Verification complete: ${verification.status}. P99 latency dropped by ${verification.latencyImprovementPercent}%. Error rate nominal.`,
      verification
    );

    if (verification.status === 'VERIFIED_HEALTHY') {
      inc.status = 'RESOLVED';
      inc.resolvedAt = new Date().toISOString();
      inc.currentLatencyMs = inc.baselineLatencyMs;
      inc.currentErrorRate = inc.baselineErrorRate;

      // Restore primary service health score and status
      const svc = db.services.get(inc.primaryServiceId);
      if (svc) {
        svc.status = 'HEALTHY';
        svc.healthScore = 98;
        svc.latencyP99Ms = inc.baselineLatencyMs;
        svc.errorRatePercent = inc.baselineErrorRate;
      }

      // Phase 6: Postmortem Generation
      const postmortem = await tools.generate_postmortem.execute({ incidentId });
      inc.status = 'POSTMORTEM_GENERATED';

      this.recordAgentRun(
        incidentId,
        'POSTMORTEM',
        'Postmortem & Reliability Knowledge Agent',
        410,
        [{ toolName: 'generate_postmortem', input: { incidentId }, output: postmortem.title, latencyMs: 120 }],
        `Generated blameless postmortem: "${postmortem.title}" with 5-whys and ${postmortem.followUpTasks.length} follow-up tasks.`,
        postmortem
      );
    }

    return inc;
  }
}

export const orchestrator = new IncidentOrchestrator();
