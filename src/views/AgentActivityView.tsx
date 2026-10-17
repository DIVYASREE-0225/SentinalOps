import React, { useState } from 'react';
import {
  Cpu,
  Activity,
  CheckCircle2,
  Clock,
  Terminal,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Database,
  ShieldCheck,
  Brain,
  FileText,
} from 'lucide-react';
import { AgentRun, AgentRole } from '../types';

interface AgentActivityViewProps {
  agentRuns: AgentRun[];
  isDark: boolean;
}

export const AgentActivityView: React.FC<AgentActivityViewProps> = ({ agentRuns, isDark }) => {
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(agentRuns[0] || null);

  const roles = [
    { id: 'ALL', label: 'All Agents' },
    { id: 'DETECTION', label: 'Detection Agent' },
    { id: 'INVESTIGATION', label: 'Investigation Agent' },
    { id: 'POSTGRES_DB', label: 'PostgreSQL DB Agent' },
    { id: 'ROOT_CAUSE', label: 'Root Cause Agent' },
    { id: 'BUSINESS_IMPACT', label: 'Business Impact Agent' },
    { id: 'MEMORY_RAG', label: 'Memory & RAG Agent' },
    { id: 'RECOVERY_PLANNER', label: 'Recovery Planner' },
    { id: 'APPROVAL_GATE', label: 'Approval Gate' },
    { id: 'VERIFICATION', label: 'Verification Agent' },
    { id: 'POSTMORTEM', label: 'Postmortem Agent' },
  ];

  const filteredRuns = agentRuns.filter((r) => {
    if (selectedRole !== 'ALL' && r.agentRole !== selectedRole) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>Autonomous Intelligence Fabric</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Specialized AI Agent Operations & Tool Execution Audit
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Inspect real-time agent runs, typed tool calls, execution durations, and structured decision outputs across the 8 specialized agents.
          </p>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedRole === r.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Runs List & Tool Call Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runs List */}
        <div className={`rounded-xl border p-5 space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Agent Runs ({filteredRuns.length})</h2>
            <div className="text-xs text-slate-400 mt-0.5">Chronological execution history</div>
          </div>

          {filteredRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No agent runs match the selected filter.
            </div>
          ) : (
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filteredRuns.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                return (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-950/40 border-indigo-600'
                          : 'bg-indigo-50/70 border-indigo-400'
                        : isDark
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {run.agentName}
                      </span>
                      <span className="font-mono text-[10px] text-emerald-600 font-semibold">
                        {run.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1">{run.summary}</div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>Tools called: {run.toolCallsCount}</span>
                      <span>Latency: {run.durationMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Run Deep Inspector */}
        <div className={`lg:col-span-2 rounded-xl border p-5 flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {selectedRun ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {selectedRun.agentRole}
                    </span>
                    <h2 className="text-base font-bold tracking-tight">{selectedRun.agentName}</h2>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Duration: {selectedRun.durationMs}ms
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {selectedRun.summary}
                </p>
              </div>

              {/* Tool Calls Executed */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Executed Tool Calls ({selectedRun.toolCalls.length})
                </div>

                <div className="space-y-2">
                  {selectedRun.toolCalls.map((tc, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs font-mono space-y-2 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                        <span>{tc.toolName}()</span>
                        <span className="text-slate-400 font-normal">{tc.latencyMs}ms</span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Input:</span>{' '}
                        {JSON.stringify(tc.input)}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Output:</span>{' '}
                        {typeof tc.output === 'object' ? JSON.stringify(tc.output, null, 2) : String(tc.output)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Structured Model Output */}
              {selectedRun.structuredOutput && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Structured Output Payload
                  </div>
                  <pre className={`p-4 rounded-lg text-[11px] font-mono overflow-x-auto ${
                    isDark ? 'bg-slate-950 text-slate-300 border border-slate-800' : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {JSON.stringify(selectedRun.structuredOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select an agent run to view its tool execution breakdown.
            </div>
          )}

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
            Security policy: Agent execution boundaries are enforced server-side with strict tool call allowlists.
          </div>
        </div>
      </div>
    </div>
  );
};
