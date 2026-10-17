# SentinelOps — Autonomous AI Incident Investigation, Root-Cause Analysis & Recovery Platform

> **Detect. Investigate. Understand. Recover.**

SentinelOps is a production-style, autonomous AI incident response platform architected for modern cloud systems and relational PostgreSQL databases. It correlates real-time telemetry, coordinates specialized AI agents, evaluates competing root-cause hypotheses, quantifies direct financial and customer SLA exposure from persistent order ledgers, and safely executes risk-governed recovery plans with automated verification.

---

## 1. Problem Statement & Architecture

Modern cloud microservices experience cascading outages:
- Unindexed PostgreSQL sequential scans saturating CPU and connection pools.
- Concurrent lock inversions causing row-level deadlock storms.
- Canary deployment regressions emitting unhandled null pointer exceptions.
- Connection starvation from idle transactions held without timeout.
- Third-party payment gateway SSL handshake degradation.

Traditional incident response requires engineers to manually jump across Datadog, AWS CloudWatch, pg_stat_activity, GitHub commits, and order databases. This delay increases MTTR and costs thousands of dollars per minute in lost revenue.

SentinelOps solves this by automating the end-to-end incident lifecycle:

```
[ DETECTED ] ──> [ INVESTIGATING ] ──> [ EVIDENCE_COLLECTED ]
                         │
                         ▼
             [ ROOT_CAUSE_ANALYSIS ]
                         │
                         ▼
          [ BUSINESS_IMPACT_ANALYSIS ] (Real SQL Order Ledger Aggregations)
                         │
                         ▼
               [ RECOVERY_PLANNING ]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 (Low Risk Policy)               (High/Critical Risk)
[ AUTO_APPROVED ]              [ AWAITING_APPROVAL ]
        │                                 │
        └────────────────┬────────────────┘
                         ▼
                   [ EXECUTING ] (Idempotent Recovery Adapter)
                         │
                         ▼
                   [ VERIFYING ] (Post-action SLA Telemetry Check)
                         │
                         ▼
                   [ RESOLVED ]
                         │
                         ▼
             [ POSTMORTEM_GENERATED ] (Blameless 5-Whys & Action Items)
```

---

## 2. Specialized Multi-Agent Intelligence Fabric

SentinelOps deploys 8 specialized agents with typed tool call contracts and explicit execution boundaries:

1. **Anomaly Detection Agent**: Evaluates metric baselines, P99 latency spikes, and 5xx error thresholds.
2. **Investigation & Correlation Agent**: Ingests operational logs, deployment git revisions, and pod container traces.
3. **PostgreSQL Database Agent**: Inspects `pg_stat_activity`, `pg_locks`, query latency, pool utilization, and executes `EXPLAIN` (without ANALYZE) for safe diagnostics.
4. **Root-Cause Analysis Agent**: Powered by Gemini 3.8 (`@google/genai`), formulates competing hypotheses with confidence probabilities and links supporting vs. contradictory evidence.
5. **Business Impact Agent**: Runs SQL queries over persisted customer orders to calculate failed checkouts, lost revenue, enterprise customer impact, and SLA breaches.
6. **Memory & RAG Agent**: Vector and keyword retrieval over past incident postmortems and operational runbooks.
7. **Recovery Planning & Approval Gate**: Synthesizes prioritized recovery actions with risk classification (Low, Medium, High, Critical), rollback plans, and server-side human authorization enforcement.
8. **Verification & Postmortem Agent**: Probes post-action health telemetry against baseline SLA and compiles blameless 5-whys postmortems.

---

## 3. PostgreSQL Database Architecture (First-Class Component)

The database schema is fully relational, normalized, and indexed:

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│    services     │<──────│    incidents    │──────>│     evidence     │
└─────────────────┘       └─────────────────┘       └──────────────────┘
         ▲                         │                          │
         │                         ▼                          ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  deployments    │       │ recovery_plans  │       │    hypotheses    │
└─────────────────┘       └─────────────────┘       └──────────────────┘
                                   │                          │
                                   ▼                          ▼
                          ┌─────────────────┐       ┌──────────────────┐
                          │recovery_actions │       │   postmortems    │
                          └─────────────────┘       └──────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│    customers    │<──────│     orders      │       │    audit_logs    │
└─────────────────┘       └─────────────────┘       └──────────────────┘
```

### Relational Entities:
- **`services`**: Microservice catalog, SLA latency targets, error rates, dependencies, versions.
- **`incidents`**: Incident records, severity, lifecycle status, primary and affected services.
- **`evidence`**: Ground-truth evidence points (metric spikes, log exceptions, slow queries, locks).
- **`hypotheses`**: Competing root-cause hypotheses with rank, probability, and evidence citations.
- **`orders`**: Customer orders with customer ID, customer tier (Enterprise, Pro, Standard), amount in integer cents, currency, status, and error messages.
- **`recovery_plans` & `recovery_actions`**: Risk levels, approval states, idempotency guards, rollback strategies, verification criteria.
- **`postmortems`**: Executive summaries, 5-whys causality chains, timeline events, and assigned follow-up action items.
- **`audit_logs`**: Immutable security audit trail of every agent run, tool invocation, and human approval.

### Dual Operating Modes:
1. **Embedded Relational Storage Engine (Default)**: In-process normalized relational engine with real tables, foreign keys, deterministic queries, and order ledger calculations.
2. **PostgreSQL Driver Mode (`DATABASE_URL`)**: Connects using official `pg.Pool`, runs DDL migrations, executes live queries, and verifies persistence.

---

## 4. 10 Deterministic Simulation Scenarios

SentinelOps includes 10 reproducible production failure scenarios:
1. **PostgreSQL Unindexed Query Regression**: Sequential scan on 4.2M orders table.
2. **Database Connection Pool Exhaustion**: Rogue transactions held in `idle_in_transaction`.
3. **Authentication Gateway P99 Latency Spike**: Cold-path RSA signature verification stampede.
4. **Memory Leak in Order Processor**: Resident set size growing at 45MB/min toward OOM kill.
5. **Canary Deployment Regression**: Null pointer exception in billing address module.
6. **Payment Gateway SSL Handshake Degradation**: Upstream payment partner gateway packet drops.
7. **Redis Shared Cache Eviction & Stampede**: Simultaneous TTL expiration of 50,000 SKU keys.
8. **Sudden Flash Sale Ingress Surge**: 8.5x traffic surge saturating HPA replica limits.
9. **PostgreSQL Deadlock Storm**: Inverted lock acquisition between checkout and restocking workers.
10. **External Tax Engine Outage**: Partner API 503 fallback to offline estimation.

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Motion.
- **Backend**: Node.js, Express, TypeScript (`tsx`), REST APIs with input validation.
- **AI Integration**: `@google/genai` TypeScript SDK with model `gemini-3.8-flash` and transparent fallback reasoning.
- **Database**: PostgreSQL 16 driver (`pg`), parameterized SQL, indexed queries, and relational aggregations.

---

## 6. Getting Started & Local Development

### Prerequisites:
- Node.js 20+
- npm or pnpm
- (Optional) PostgreSQL 15+ or Docker

### Installation:
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and DATABASE_URL if desired.

# 3. Start development server (Full-stack Express + Vite)
npm run dev
```

Visit `http://localhost:3000` to access SentinelOps.

---

## 7. Security Model

- **Least Privilege Execution**: AI agents cannot run raw arbitrary destructive SQL; all recovery operations route through allowlisted adapters (`CREATE INDEX CONCURRENTLY`, `ROLLOUT_UNDO`, `TERMINATE_IDLE_BACKEND`).
- **Server-Side Policy Gates**: High and Critical risk recovery plans strictly block on human SRE authorization even if client-side code is bypassed.
- **Secrets Isolation**: API keys and database credentials reside exclusively in server environment variables and are never bundled into client assets.
- **Cryptographic Audit Trail**: Every tool invocation and approval decision is logged to the immutable audit log table.
