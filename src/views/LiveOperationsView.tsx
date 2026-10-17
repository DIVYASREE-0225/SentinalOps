import React, { useState } from 'react';
import {
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Cpu,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { ScenarioDefinition, Incident, RecoveryPlan } from '../types';
import { api } from '../utils/api';

interface LiveOperationsViewProps {
  scenarios: ScenarioDefinition[];
  onSimulateScenario: (scenarioKey: string) => Promise<Incident>;
  onSelectIncident: (id: string) => void;
  isDark: boolean;
}

export const LiveOperationsView: React.FC<LiveOperationsViewProps> = ({
  scenarios,
  onSimulateScenario,
  onSelectIncident,
  isDark,
}) => {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>(scenarios[0]?.key || 'postgres-query-regression');
  const [isRunning, setIsRunning] = useState(false);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [activePlan, setActivePlan] = useState<RecoveryPlan | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalRationale, setApprovalRationale] = useState('Authorized by SRE Lead after evaluating verification criteria.');

  const workflowSteps = [
    { num: 1, key: 'DETECTED', label: 'Detection', agent: 'Detection Agent', desc: 'Anomaly identified against metric baseline' },
    { num: 2, key: 'INVESTIGATING', label: 'Investigation', agent: 'Investigation & DB Agent', desc: 'Querying logs, traces, pg_stat_activity, and locks' },
    { num: 3, key: 'EVIDENCE_COLLECTED', label: 'Evidence Correlated', agent: 'Telemetry Engine', desc: 'Structured evidence ledger compiled' },
    { num: 4, key: 'ROOT_CAUSE_ANALYSIS', label: 'Root Cause Analysis', agent: 'Root Cause Agent (Gemini 3.8)', desc: 'Weighing competing hypotheses with probability' },
    { num: 5, key: 'BUSINESS_IMPACT_ANALYSIS', label: 'Business Impact', agent: 'SQL Impact Agent', desc: 'Aggregating failed orders and revenue at risk' },
    { num: 6, key: 'RECOVERY_PLANNING', label: 'Recovery Planning', agent: 'Recovery Planner', desc: 'Formulating risk-ranked mitigation actions' },
    { num: 7, key: 'AWAITING_APPROVAL', label: 'Approval Gate', agent: 'Policy Enforcement', desc: 'Server-side human authorization check' },
    { num: 8, key: 'EXECUTING', label: 'Safe Execution', agent: 'Recovery Adapter', desc: 'Executing idempotently with rollback guard' },
    { num: 9, key: 'VERIFYING', label: 'Verification', agent: 'Verification Agent', desc: 'Validating post-recovery P99 latency and 5xx' },
    { num: 10, key: 'POSTMORTEM_GENERATED', label: 'Postmortem', agent: 'Postmortem Agent', desc: 'Publishing blameless RCA & 5-whys' },
  ];

  const getStepNumber = (status?: string): number => {
    switch (status) {
      case 'DETECTED': return 1;
      case 'INVESTIGATING': return 2;
      case 'EVIDENCE_COLLECTED': return 3;
      case 'ROOT_CAUSE_ANALYSIS': return 4;
      case 'BUSINESS_IMPACT_ANALYSIS': return 5;
      case 'RECOVERY_PLANNING': return 6;
      case 'AWAITING_APPROVAL': return 7;
      case 'EXECUTING': return 8;
      case 'VERIFYING': return 9;
      case 'RESOLVED':
      case 'POSTMORTEM_GENERATED': return 10;
      default: return 0;
    }
  };

  const currentStep = getStepNumber(activeIncident?.status);

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setActivePlan(null);

    try {
      const inc = await onSimulateScenario(selectedScenarioKey);
      setActiveIncident(inc);

      // Fetch the plan for this incident
      const details = await api.getIncidentDetails(inc.id);
      setActivePlan(details.recoveryPlan);
      setActiveIncident(details.incident);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApproveRecovery = async () => {
    if (!activeIncident) return;
    setIsApproving(true);
    try {
      const res = await api.approveRecovery(activeIncident.id, 'Staff SRE Operator', approvalRationale);
      setActiveIncident(res.incident);
      setActivePlan(res.plan);
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectRecovery = async () => {
    if (!activeIncident) return;
    setIsApproving(true);
    try {
      const plan = await api.rejectRecovery(activeIncident.id, 'Staff SRE Operator', 'Rejected during simulation review.');
      setActivePlan(plan);
      const details = await api.getIncidentDetails(activeIncident.id);
      setActiveIncident(details.incident);
    } catch (e) {
      console.error(e);
    } finally {
      setIsApproving(false);
    }
  };

  const selectedScenario = scenarios.find((s) => s.key === selectedScenarioKey) || scenarios[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-5 sm:p-6 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Interactive Incident Simulation Engine
            </div>
            <h1 className="text-xl font-bold tracking-tight mt-1">
              End-to-End Autonomous Incident Lifecycle Runner
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Inject deterministic production failures to watch SentinelOps autonomously detect anomalies, correlate telemetry, query PostgreSQL, calculate real financial losses, formulate recovery plans, enforce approvals, and verify system recovery.
            </p>
          </div>

          <button
            onClick={handleStartSimulation}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0 ${
              isRunning ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isRunning ? 'Running Simulation...' : 'Launch Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Scenario Selector & Live Lifecycle Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 10 Scenario Catalog */}
        <div className={`rounded-xl border p-5 space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Select Scenario ({scenarios.length})</h2>
            <div className="text-xs text-slate-400 mt-0.5">Deterministic failure topologies</div>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {scenarios.map((sc, i) => {
              const isSelected = sc.key === selectedScenarioKey;
              return (
                <div
                  key={sc.key}
                  onClick={() => setSelectedScenarioKey(sc.key)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-indigo-950/40 border-indigo-600 text-white'
                        : 'bg-indigo-50/70 border-indigo-500 text-slate-900 shadow-xs'
                      : isDark
                      ? 'border-slate-800 hover:border-slate-700 text-slate-300'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      0{i + 1}. {sc.category}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      sc.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {sc.severity}
                    </span>
                  </div>
                  <div className="font-semibold line-clamp-1">{sc.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                    {sc.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Simulation Lifecycle Visualizer */}
        <div className={`lg:col-span-2 rounded-xl border p-5 flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold tracking-tight">Active Lifecycle State Machine</h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Target: <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedScenario?.title}</span>
                </div>
              </div>

              {activeIncident && (
                <button
                  onClick={() => onSelectIncident(activeIncident.id)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1.5 hover:underline"
                >
                  <span>Open Full Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-2 mt-4">
              {workflowSteps.map((step) => {
                const isPassed = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const isResolved = currentStep === 10 && step.num === 10;

                return (
                  <div
                    key={step.num}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
                      isPassed || isResolved
                        ? isDark
                          ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-200'
                          : 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                        : isCurrent
                        ? isDark
                          ? 'bg-amber-950/30 border-amber-600 text-amber-200'
                          : 'bg-amber-50/70 border-amber-400 text-amber-900'
                        : isDark
                        ? 'border-slate-800 text-slate-500'
                        : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                        isPassed || isResolved
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {isPassed || isResolved ? '✓' : step.num}
                      </div>

                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{step.label}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[11px] font-normal opacity-80">{step.agent}</span>
                        </div>
                        <div className="text-[11px] opacity-75">{step.desc}</div>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono font-semibold">
                      {isPassed || isResolved
                        ? 'COMPLETED'
                        : isCurrent
                        ? step.num === 7 ? 'WAITING APPROVAL' : 'RUNNING'
                        : 'PENDING'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 7 Approval Gate Active Card */}
            {activeIncident?.status === 'AWAITING_APPROVAL' && activePlan && (
              <div className="mt-4 p-4 rounded-xl border border-amber-400 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 text-xs space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      Step 7: SRE Authorization Required ({activePlan.riskLevel} Risk)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300">
                    Server Gate Enforced
                  </span>
                </div>

                <div className="text-slate-600 dark:text-slate-300">
                  <p>The Recovery Planning Agent proposed the following remediation:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    {activePlan.actions.map((act) => (
                      <li key={act.id}>
                        <strong>{act.title}</strong> — <span className="text-slate-500">{act.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approval Audit Rationale:
                  </label>
                  <input
                    type="text"
                    value={approvalRationale}
                    onChange={(e) => setApprovalRationale(e.target.value)}
                    className={`w-full px-3 py-1.5 text-xs rounded border ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleApproveRecovery}
                    disabled={isApproving}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isApproving ? 'Executing...' : 'Authorize Recovery & Continue Pipeline'}</span>
                  </button>
                  <button
                    onClick={handleRejectRecovery}
                    disabled={isApproving}
                    className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white font-semibold text-xs transition-colors"
                  >
                    <span>Reject Plan</span>
                  </button>
                </div>
              </div>
            )}

            {/* Resolved Notification Banner */}
            {(activeIncident?.status === 'RESOLVED' || activeIncident?.status === 'POSTMORTEM_GENERATED') && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-400 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 text-xs space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      Lifecycle Completed: Incident {activeIncident.id} Resolved & Verified
                    </span>
                  </div>
                  <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                    Latency: {activeIncident.baselineLatencyMs}ms (Nominal)
                  </span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 text-[11px]">
                  All recovery verification health checks passed. The blameless 5-whys postmortem has been published to the knowledge base.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => onSelectIncident(activeIncident.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-600"
                  >
                    View Postmortem Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scenario Overview Details */}
          <div className={`mt-5 p-4 rounded-lg border text-xs space-y-2 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Expected Root Cause Signature:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">Deterministic Scenario</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">{selectedScenario?.expectedRootCause}</p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              <span className="font-semibold">Suggested Remediation:</span> {selectedScenario?.suggestedAction}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
