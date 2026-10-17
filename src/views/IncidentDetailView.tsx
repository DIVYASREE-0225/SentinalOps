import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  DollarSign,
  FileText,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  XCircle,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  Incident,
  EvidenceItem,
  RootCauseHypothesis,
  BusinessImpact,
  RecoveryPlan,
  VerificationResult,
  Postmortem,
  AgentRun,
  Service,
} from '../types';

interface IncidentDetailViewProps {
  incident: Incident;
  primaryService?: Service;
  evidence: EvidenceItem[];
  hypotheses: RootCauseHypothesis[];
  impact: BusinessImpact | null;
  recoveryPlan: RecoveryPlan | null;
  verification: VerificationResult | null;
  postmortem: Postmortem | null;
  agentRuns: AgentRun[];
  onBack: () => void;
  onApproveRecovery: (planId: string, rationale: string) => Promise<void>;
  onRejectRecovery: (planId: string, rationale: string) => Promise<void>;
  onVerifyRecovery: () => Promise<void>;
  onGeneratePostmortem: () => Promise<void>;
  onRetriggerInvestigation: () => Promise<void>;
  isDark: boolean;
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  primaryService,
  evidence,
  hypotheses,
  impact,
  recoveryPlan,
  verification,
  postmortem,
  agentRuns,
  onBack,
  onApproveRecovery,
  onRejectRecovery,
  onVerifyRecovery,
  onGeneratePostmortem,
  onRetriggerInvestigation,
  isDark,
}) => {
  const [activeTab, setActiveTab] = useState<
    'timeline' | 'hypotheses' | 'impact' | 'recovery' | 'agents' | 'postmortem'
  >('timeline');
  const [approvalRationale, setApprovalRationale] = useState('Authorized after reviewing evidence and verification criteria.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!recoveryPlan) return;
    setIsSubmitting(true);
    try {
      await onApproveRecovery(recoveryPlan.id, approvalRationale);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!recoveryPlan) return;
    setIsSubmitting(true);
    try {
      await onRejectRecovery(recoveryPlan.id, 'Declined by operator: requires manual engineering validation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                incident.severity === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : incident.severity === 'HIGH'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {incident.severity}
              </span>
              <span className="font-mono text-xs text-slate-400">{incident.id}</span>
              <span aria-hidden="true">·</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {incident.status}
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight mt-1">{incident.title}</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRetriggerInvestigation}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-evaluate</span>
          </button>

          {incident.status === 'AWAITING_APPROVAL' ? (
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Executing...' : 'Authorize Recovery'}</span>
            </button>
          ) : null}

          {incident.status === 'EXECUTING' || incident.status === 'VERIFYING' ? (
            <button
              onClick={onVerifyRecovery}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Telemetry</span>
            </button>
          ) : null}

          {incident.status === 'RESOLVED' && !postmortem ? (
            <button
              onClick={onGeneratePostmortem}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Postmortem</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 10-Step Interactive Incident Response Lifecycle Stepper */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-xs font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Incident Response & Recovery Lifecycle</span>
            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950">
              Autonomous Pipeline
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Current Stage: <strong className="text-indigo-600 dark:text-indigo-400">{incident.status}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 pt-1">
          {[
            { num: 1, key: 'DETECTED', label: 'Detection' },
            { num: 2, key: 'INVESTIGATING', label: 'Investigate' },
            { num: 3, key: 'EVIDENCE_COLLECTED', label: 'Evidence' },
            { num: 4, key: 'ROOT_CAUSE_ANALYSIS', label: 'Root Cause' },
            { num: 5, key: 'BUSINESS_IMPACT_ANALYSIS', label: 'Impact' },
            { num: 6, key: 'RECOVERY_PLANNING', label: 'Plan' },
            { num: 7, key: 'AWAITING_APPROVAL', label: 'Approval Gate' },
            { num: 8, key: 'EXECUTING', label: 'Execution' },
            { num: 9, key: 'VERIFYING', label: 'Verify' },
            { num: 10, key: 'POSTMORTEM_GENERATED', label: 'Postmortem' },
          ].map((st) => {
            const getStepIndex = (s: string) => {
              switch (s) {
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
                default: return 1;
              }
            };
            const currentIdx = getStepIndex(incident.status);
            const isCompleted = currentIdx > st.num || (currentIdx === 10 && st.num === 10);
            const isCurrent = currentIdx === st.num && currentIdx !== 10;

            return (
              <div
                key={st.num}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isCompleted
                    ? isDark
                      ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : isCurrent
                    ? isDark
                      ? 'bg-amber-950/30 border-amber-600 text-amber-200 ring-1 ring-amber-500'
                      : 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                    : isDark
                    ? 'border-slate-800/80 text-slate-500 bg-slate-950/40'
                    : 'border-slate-200/80 text-slate-400 bg-slate-50/60'
                }`}
              >
                <div className="font-mono text-[10px] font-bold">
                  {isCompleted ? '✓' : st.num}
                </div>
                <div className="text-[10px] font-semibold mt-0.5 truncate">{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prominent Action Required Banner for Awaiting Approval */}
      {incident.status === 'AWAITING_APPROVAL' && recoveryPlan && (
        <div className={`p-5 rounded-xl border border-amber-400 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/30 space-y-3 animate-fade-in`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500 text-white font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Step 7: Server-Side Authorization Required
                </div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 mt-0.5">
                  Recovery Plan formulated with {recoveryPlan.riskLevel} Risk policy enforcement
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-bold">
                Server Gate Active
              </span>
            </div>
          </div>

          <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            The Autonomous Recovery Planner formulated <strong>{recoveryPlan.actions.length} remediation actions</strong>. Because the plan contains high-impact actions, execution is held at this gate until an SRE lead explicitly signs off with an audit rationale.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              value={approvalRationale}
              onChange={(e) => setApprovalRationale(e.target.value)}
              placeholder="Enter approval audit comment / verification authorization..."
              className={`flex-1 px-3.5 py-2 text-xs rounded-lg border font-sans ${
                isDark ? 'bg-slate-900 border-amber-800 text-white' : 'bg-white border-amber-300 text-slate-900'
              }`}
            />
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Executing Safe Adapter...' : 'Authorize & Execute Recovery'}</span>
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors whitespace-nowrap"
            >
              <span>Reject Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* Prominent Success Banner if Resolved or Postmortem Published */}
      {(incident.status === 'RESOLVED' || incident.status === 'POSTMORTEM_GENERATED') && (
        <div className="p-4 rounded-xl border border-emerald-400 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Complete Incident Response Lifecycle Executed & Verified
              </div>
              <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                Telemetry verified within SLA: P99 latency dropped to {incident.baselineLatencyMs}ms nominal. Blameless 5-whys postmortem published.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('recovery')}
              className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-xs font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              View Verification
            </button>
            {postmortem && (
              <button
                onClick={() => setActiveTab('postmortem')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Read Postmortem</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Incident Status Banner & Telemetry Comparison */}
      <div className={`p-4 rounded-xl border grid grid-cols-2 md:grid-cols-4 gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="text-[11px] text-slate-400">Primary Impacted Service</div>
          <div className="text-sm font-bold mt-0.5">{incident.primaryServiceId}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {primaryService?.runtime || 'Distributed cluster'}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400">P99 Latency vs Baseline</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {incident.currentLatencyMs}ms
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              (was {incident.baselineLatencyMs}ms)
            </span>
          </div>
          <div className="text-[11px] text-rose-500 mt-0.5">
            +{Math.round(((incident.currentLatencyMs - incident.baselineLatencyMs) / incident.baselineLatencyMs) * 100)}% degradation
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400">5xx Error Rate</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {incident.currentErrorRate}%
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              (baseline {incident.baselineErrorRate}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Threshold: 0.10%</div>
        </div>

        <div>
          <div className="text-[11px] text-slate-400">Investigation Duration</div>
          <div className="text-sm font-bold font-mono mt-0.5 tabular-nums">
            {Math.max(1, Math.round((Date.now() - new Date(incident.detectedAt).getTime()) / 60000))} min active
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Started: {new Date(incident.startedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Incident Sections */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Evidence Timeline ({evidence.length})
        </button>

        <button
          onClick={() => setActiveTab('hypotheses')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'hypotheses'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Root Cause Hypotheses ({hypotheses.length})
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'impact'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Business Impact {impact?.slaBreached ? '· SLA Breached' : ''}
        </button>

        <button
          onClick={() => setActiveTab('recovery')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'recovery'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Recovery Center {recoveryPlan?.approvalStatus === 'PENDING' ? '· Awaiting Approval' : ''}
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'agents'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Agent Execution Runs ({agentRuns.length})
        </button>

        {postmortem && (
          <button
            onClick={() => setActiveTab('postmortem')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'postmortem'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Postmortem Report
          </button>
        )}
      </div>

      {/* Tab 1: Evidence Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Chronological Evidence Ledger</h2>
            <div className="text-xs text-slate-400">
              Correlated from metrics, logs, and PostgreSQL pg_catalog
            </div>
          </div>

          <div className="space-y-3">
            {evidence.map((ev, index) => (
              <div
                key={ev.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">#{index + 1}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {ev.type.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">{ev.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Relevance: {Math.round(ev.relevanceScore * 100)}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="font-semibold text-sm">{ev.summary}</div>
                <div className={`p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap ${
                  isDark ? 'bg-slate-950 text-slate-300 border border-slate-800' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {ev.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Root Cause Hypotheses */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Root-Cause Hypotheses & Diagnostic Reasoning</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Evaluated against collected evidence by Gemini 3.8 / SRE Reasoning Model
              </div>
            </div>
            <div className="text-xs">
              {verification?.status === 'VERIFIED_HEALTHY' ? (
                <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  ✓ VERIFIED ROOT CAUSE CONFIRMED
                </span>
              ) : (
                <span className="font-mono text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  ⚠ SUSPECTED ROOT CAUSE (PRE-RECOVERY HYPOTHESIS)
                </span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400">
            <strong>How SentinelOps diagnoses root causes:</strong> The Root Cause Agent parses anomalies, PostgreSQL slow query logs, and deployment events to weigh competing hypotheses with Bayesian confidence. A hypothesis remains <em>Suspected</em> until recovery actions are executed and post-action verification proves nominal latency has returned.
          </div>

          <div className="space-y-3">
            {hypotheses.map((hypo) => {
              const isVerified = hypo.isPrimary && verification?.status === 'VERIFIED_HEALTHY';
              return (
                <div
                  key={hypo.id}
                  className={`p-5 rounded-xl border text-xs space-y-3 ${
                    hypo.isPrimary
                      ? isDark
                        ? 'bg-indigo-950/20 border-indigo-700/50'
                        : 'bg-indigo-50/40 border-indigo-200'
                      : isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isVerified
                          ? 'bg-emerald-600 text-white'
                          : hypo.isPrimary
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {isVerified
                          ? 'VERIFIED ROOT CAUSE'
                          : hypo.isPrimary
                          ? 'SUSPECTED ROOT CAUSE (PRIMARY)'
                          : `COMPETING HYPOTHESIS #${hypo.rank}`}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{hypo.title}</span>
                    </div>

                    <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {Math.round(hypo.probability * 100)}% Confidence
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {hypo.description}
                  </p>

                  {/* Why the Agent reached this conclusion */}
                  <div className={`p-3 rounded-lg border text-[11px] space-y-1 ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="font-bold text-slate-700 dark:text-slate-300">
                      Why the agent reached this conclusion:
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 leading-normal">
                      Correlated <span className="font-semibold text-indigo-600 dark:text-indigo-400">{hypo.supportingEvidenceIds.length} evidence items</span> matching known degradation signatures. Telemetry timestamps closely align with the onset of elevated 5xx error rates ({incident.currentErrorRate}%) and latency ({incident.currentLatencyMs}ms).
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      <span className="font-semibold">Validation Diagnostic:</span>{' '}
                      <span className="font-mono text-slate-600 dark:text-slate-300">{hypo.validationCriteria}</span>
                    </div>
                    <div className="font-mono">
                      Rank #{hypo.rank}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Business Impact */}
      {activeTab === 'impact' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Persisted SQL Transaction Impact</h2>
            <div className="text-xs text-slate-400">
              Aggregated from real customer order records in database
            </div>
          </div>

          {impact ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[11px] text-slate-400">Failed Customer Orders</div>
                  <div className="text-2xl font-bold font-mono mt-1 text-rose-600 tabular-nums">
                    {impact.affectedOrdersCount}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Captured in orders table</div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[11px] text-slate-400">Measured Revenue Loss</div>
                  <div className="text-2xl font-bold font-mono mt-1 text-rose-600 tabular-nums">
                    ${(impact.measuredRevenueLossCents / 100).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Calculated from failed checkouts</div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[11px] text-slate-400">Enterprise Accounts Hit</div>
                  <div className="text-2xl font-bold font-mono mt-1 tabular-nums">
                    {impact.enterpriseCustomersImpacted}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">High-touch tier accounts</div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[11px] text-slate-400">SLA Contract Status</div>
                  <div className={`text-2xl font-bold mt-1 ${impact.slaBreached ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {impact.slaBreached ? 'BREACHED' : 'NOMINAL'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
                    Uptime: {impact.slaUptimePercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Customer Tier Breakdown */}
              <div className={`p-5 rounded-xl border text-xs space-y-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h3 className="font-bold text-sm">Customer Tier Exposure Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-500">Enterprise Tier</div>
                    <div className="text-lg font-bold mt-1 font-mono">{impact.tierBreakdown.enterprise} accounts</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Dedicated SLA & Account Execs</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-500">Pro Tier</div>
                    <div className="text-lg font-bold mt-1 font-mono">{impact.tierBreakdown.pro} accounts</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Standard 99.9% commitment</div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="font-semibold text-slate-500">Standard Tier</div>
                    <div className="text-lg font-bold mt-1 font-mono">{impact.tierBreakdown.standard} accounts</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Best effort self-service</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Impact calculation running...
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Recovery Center & Approval Gate */}
      {activeTab === 'recovery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Recovery Plan & Approval Gate</h2>
              <div className="text-xs text-slate-400 mt-0.5">
                Risk-based execution policies enforced by server-side authorization
              </div>
            </div>

            {recoveryPlan && (
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                recoveryPlan.approvalStatus === 'APPROVED' || recoveryPlan.approvalStatus === 'AUTO_APPROVED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : recoveryPlan.approvalStatus === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {recoveryPlan.approvalStatus}
              </span>
            )}
          </div>

          {recoveryPlan ? (
            <div className="space-y-4">
              {/* Approval Modal / Action Bar */}
              {recoveryPlan.approvalStatus === 'PENDING' && (
                <div className={`p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/20 text-xs space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        Human SRE Authorization Required ({recoveryPlan.riskLevel} Risk)
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300">
                      Server-side gate active
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Approval Rationale / Audit Comment:
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
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Executing...' : 'Authorize & Execute Recovery'}</span>
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white font-semibold transition-colors"
                    >
                      <span>Reject Plan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action List */}
              <div className="space-y-3">
                {recoveryPlan.actions.map((act, idx) => (
                  <div
                    key={act.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">Step {idx + 1}</span>
                        <span className="font-bold text-sm">{act.title}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          act.riskLevel === 'CRITICAL' || act.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {act.riskLevel}
                        </span>
                      </div>

                      <span className={`font-mono text-[11px] font-semibold ${
                        act.status === 'SUCCEEDED' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {act.status}
                      </span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300">{act.description}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                      <div>
                        <span className="font-semibold">Rollback:</span> {act.rollbackStrategy}
                      </div>
                      <div>
                        <span className="font-semibold">Verification:</span> {act.verificationCriteria}
                      </div>
                    </div>

                    {act.executionResult && (
                      <div className={`p-2.5 rounded font-mono text-[11px] ${
                        isDark ? 'bg-slate-950 text-emerald-400 border border-slate-800' : 'bg-slate-50 text-emerald-800 border border-slate-200'
                      }`}>
                        ✓ {act.executionResult.output} ({act.executionResult.executedBy})
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Verification Results Panel if verified */}
              {verification && (
                <div className={`p-5 rounded-xl border text-xs space-y-3 ${
                  verification.status === 'VERIFIED_HEALTHY'
                    ? isDark ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-emerald-50/50 border-emerald-200'
                    : isDark ? 'bg-rose-950/20 border-rose-800/60' : 'bg-rose-50/50 border-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-sm">Post-Recovery Telemetry Verification</span>
                    </div>
                    <span className="font-mono text-emerald-600 font-bold">
                      {verification.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {verification.checks.map((chk, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800">
                        <span className="text-[11px] font-medium">{chk.checkName}</span>
                        <span className="font-mono font-bold text-emerald-600 text-[11px]">
                          ✓ Passed ({chk.actual})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No recovery plan formulated yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Agent Execution Runs */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Specialized Agent Execution Audit</h2>
            <div className="text-xs text-slate-400">
              Orchestrated pipeline runs with explicit tool call latencies
            </div>
          </div>

          <div className="space-y-3">
            {agentRuns.map((run) => (
              <div
                key={run.id}
                className={`p-4 rounded-xl border text-xs space-y-2 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-bold">{run.agentName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[10px] text-slate-400">{run.agentRole}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {run.durationMs}ms
                    </span>
                    <span className="font-mono text-[11px] text-emerald-600 font-semibold">
                      {run.status}
                    </span>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-300">{run.summary}</p>

                {run.toolCalls.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase text-slate-400">
                      Tool Calls Executed ({run.toolCalls.length}):
                    </div>
                    {run.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded font-mono text-[11px] flex items-center justify-between ${
                          isDark ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-200'
                        }`}
                      >
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          {tc.toolName}()
                        </span>
                        <span className="text-slate-400">{tc.latencyMs}ms</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Postmortem Report */}
      {activeTab === 'postmortem' && postmortem && (
        <div className={`p-6 rounded-xl border space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Blameless Operational Postmortem
            </span>
            <h2 className="text-lg font-bold tracking-tight mt-1">{postmortem.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Lead: {postmortem.leadInvestigator}</span>
              <span aria-hidden="true">·</span>
              <span>Published: {new Date(postmortem.generatedAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Summary</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {postmortem.executiveSummary}
            </p>
          </div>

          {/* 5-Whys */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Five Whys (Root Cause Chain)</h3>
            <div className="space-y-1.5">
              {postmortem.rootCauseAnalysis.fiveWhys.map((why, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg text-xs font-mono flex items-start gap-2.5 ${
                    isDark ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span className="font-bold text-indigo-600 shrink-0">Why #{idx + 1}:</span>
                  <span>{why}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Follow-up Reliability Action Items</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-lg overflow-hidden">
              {postmortem.followUpTasks.map((t) => (
                <div key={t.id} className="p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-600">{t.priority}</span>
                    <span className="font-semibold">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>{t.owner}</span>
                    <span className="font-mono text-emerald-600 font-semibold">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
