import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  PlayCircle,
  Server,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Cpu,
  Layers,
  FileText,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Incident, Service, SystemOverviewStats, ScenarioDefinition, AgentRun } from '../types';

interface OverviewViewProps {
  stats: SystemOverviewStats | null;
  incidents: Incident[];
  services: Service[];
  scenarios: ScenarioDefinition[];
  agentRuns: AgentRun[];
  onSelectIncident: (id: string) => void;
  onQuickSimulate: () => void;
  onRunScenario: (scenarioKey: string) => void;
  onNavigateToTab: (tab: any) => void;
  isDark: boolean;
  isSimulating: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stats,
  incidents,
  services,
  scenarios,
  agentRuns,
  onSelectIncident,
  onQuickSimulate,
  onRunScenario,
  onNavigateToTab,
  isDark,
  isSimulating,
}) => {
  const activeIncidents = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'POSTMORTEM_GENERATED'
  );

  const pipelineStages = [
    {
      num: '01',
      name: 'Detect',
      actor: 'Detection Agent',
      desc: 'Monitors real-time API latency & error anomalies against historical baselines',
    },
    {
      num: '02',
      name: 'Investigate',
      actor: 'Investigation Agent',
      desc: 'Correlates logs, trace spans, and recent deployment commits',
    },
    {
      num: '03',
      name: 'Diagnose',
      actor: 'PostgreSQL DB & RCA Agent',
      desc: 'Analyzes pg_stat_activity, ungranted locks, and EXPLAIN plans with Gemini 3.8',
    },
    {
      num: '04',
      name: 'Assess Impact',
      actor: 'SQL Impact Agent',
      desc: 'Queries actual persistent order ledgers for failed revenue & customer SLA breaches',
    },
    {
      num: '05',
      name: 'Approve Recovery',
      actor: 'Policy Gate & Human SRE',
      desc: 'Enforces risk-governed approvals before running potentially disruptive remediations',
    },
    {
      num: '06',
      name: 'Verify & Learn',
      actor: 'Verification Agent',
      desc: 'Validates post-action health recovery and synthesizes blameless 5-whys postmortems',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Page heading, short explanation and clearly visible Simulate Incident action */}
      <div className={`p-5 sm:p-6 rounded-xl border transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
              <span>Autonomous SRE Operations Platform</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[10px] text-slate-400">eks-prod-us-east-1</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Incident Investigation & Recovery Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              SentinelOps autonomously correlates signals across PostgreSQL, microservices, and customer transactions to detect regressions, diagnose root causes, quantify real financial impact, and execute safe verified recoveries.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onQuickSimulate}
              disabled={isSimulating}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg text-white transition-all shadow-sm flex items-center gap-2 whitespace-nowrap ${
                isSimulating
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isSimulating ? 'Simulating Anomaly...' : 'Simulate Incident'}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('live-operations')}
              className={`px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              10 Scenarios
            </button>
          </div>
        </div>

        {/* Demo Telemetry Indicator Banner */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px] bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/80">
              DEMO DATA & SIMULATION MODE
            </span>
            <span className="hidden sm:inline">Telemetry & orders generated by deterministic scenario engine; calculations query persisted records.</span>
          </div>
          <span className="font-mono text-slate-500">PostgreSQL Aurora 16.2</span>
        </div>
      </div>

      {/* Active Incident Approval Alert if Awaiting SRE Authorization */}
      {(() => {
        const awaitingInc = incidents.find((i) => i.status === 'AWAITING_APPROVAL');
        if (!awaitingInc) return null;
        return (
          <div className="p-4 rounded-xl border border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    STAGE 07 · APPROVAL GATE ACTIVE
                  </span>
                  <span className="font-mono text-xs text-slate-500">{awaitingInc.id}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5">
                  {awaitingInc.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Autonomous investigation complete. High-risk mitigation plan formulated. Server-side policy requires human SRE authorization.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onSelectIncident(awaitingInc.id)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <span>Authorize & Recover</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* 2. Key Metrics: active incidents, system health, API latency, database health and recovery status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Active Incidents */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Incidents</div>
          <div className={`text-2xl font-bold font-mono mt-1 tabular-nums ${activeIncidents.length > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {activeIncidents.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats?.criticalIncidentsCount ?? 0} Critical P0 · {incidents.length} Total
          </div>
        </div>

        {/* System Health */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">System Health</div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats?.systemHealthScore ?? 98}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Target SLA 99.9% uptime</div>
        </div>

        {/* API Latency */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">P99 API Latency</div>
          <div className="text-2xl font-bold font-mono mt-1 text-indigo-600 dark:text-indigo-400 tabular-nums">
            {stats?.avgP99LatencyMs ?? 48}ms
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cluster baseline: 45ms</div>
        </div>

        {/* Database Health */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Database Pool</div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats?.databaseStatus === 'HEALTHY' ? 'Nominal' : 'Elevated'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Connections & locks OK</div>
        </div>

        {/* Recovery Status */}
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Autonomous MTTR</div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats?.mttrMinutes ?? 12}m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">MTTD: {stats?.mttdMinutes ?? 2}m auto-detected</div>
        </div>
      </div>

      {/* 3. Active Incidents with severity, affected service, current stage and a View Details action */}
      <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Active Operational Incidents</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Live investigations handled by autonomous multi-agent pipeline
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('incidents')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All Incidents ({incidents.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active incidents. Click "Simulate Incident" above to trigger an autonomous investigation.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {incidents.slice(0, 3).map((inc) => (
              <div
                key={inc.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors rounded-lg px-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : inc.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{inc.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 cursor-pointer" onClick={() => onSelectIncident(inc.id)}>
                      {inc.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span>Impacted Service: <strong className="text-slate-600 dark:text-slate-300">{inc.primaryServiceId}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>P99 Latency: <strong className="font-mono tabular-nums text-rose-600">{inc.currentLatencyMs}ms</strong> (baseline {inc.baselineLatencyMs}ms)</span>
                    <span aria-hidden="true">·</span>
                    <span>Started: <strong className="font-mono">{new Date(inc.startedAt).toLocaleTimeString()}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {inc.status}
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {inc.evidenceCount} evidence items
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectIncident(inc.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-indigo-600 transition-colors shadow-xs"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Incident-Response Pipeline: Detect → Investigate → Diagnose → Assess Impact → Approve Recovery → Verify */}
      <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Incident Response & Recovery Pipeline
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              The end-to-end autonomous workflow coordinating 8 specialized agents
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('live-operations')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Live Runner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 mt-4">
          {pipelineStages.map((stage, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between ${
                isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    STAGE {stage.num}
                  </span>
                  <span className="text-[10px] text-slate-400">→</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">{stage.name}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium mt-0.5">{stage.actor}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                  {stage.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: 5. Agent Activity & 6. Service Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Agent Activity with latest actual agent actions and evidence */}
        <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Latest Agent Actions & Evidence</h2>
              <div className="text-xs text-slate-400 mt-0.5">Executed tool calls and structured findings</div>
            </div>
            <button
              onClick={() => onNavigateToTab('agent-activity')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Full Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {agentRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent agent executions. Trigger an incident simulation above to see live agent activity.
            </div>
          ) : (
            <div className="space-y-2.5">
              {agentRuns.slice(-3).reverse().map((run) => (
                <div
                  key={run.id}
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-slate-900 dark:text-white">{run.agentName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-600 font-semibold">{run.durationMs}ms</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{run.summary}</p>
                  {run.toolCalls.length > 0 && (
                    <div className="text-[10px] font-mono text-slate-400">
                      Tool called: <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{run.toolCalls[0].toolName}()</span> ({run.toolCalls[0].latencyMs}ms)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Service Health and recent operational events */}
        <div className={`rounded-xl border p-5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Service Health Matrix</h2>
              <div className="text-xs text-slate-400 mt-0.5">Tier 1 & Tier 2 microservices posture</div>
            </div>
            <button
              onClick={() => onNavigateToTab('services')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {services.slice(0, 4).map((svc) => (
              <div
                key={svc.id}
                className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{svc.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({svc.tier})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    P99: <span className="font-mono text-slate-700 dark:text-slate-300">{svc.latencyP99Ms}ms</span> · Error: <span className="font-mono text-slate-700 dark:text-slate-300">{svc.errorRatePercent}%</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-bold font-mono ${
                    svc.status === 'HEALTHY'
                      ? 'text-emerald-600'
                      : svc.status === 'DEGRADED'
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}>
                    {svc.status}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400">
                    Health: {svc.healthScore}/100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
