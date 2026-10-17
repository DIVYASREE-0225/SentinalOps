import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Layers,
} from 'lucide-react';
import { api } from '../utils/api';
import { Postmortem } from '../types';

interface PostmortemsViewProps {
  isDark: boolean;
}

export const PostmortemsView: React.FC<PostmortemsViewProps> = ({ isDark }) => {
  const [postmortems, setPostmortems] = useState<Postmortem[]>([]);
  const [selectedPostmortem, setSelectedPostmortem] = useState<Postmortem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPostmortems().then((res) => {
      setPostmortems(res);
      if (res.length > 0) setSelectedPostmortem(res[0]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Blameless Reliability Archive
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Incident Postmortems & Follow-up Action Items
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Published reports with full timelines, 5-whys root cause analysis, customer business impact summaries, and engineering follow-up tasks.
          </p>
        </div>
      </div>

      {/* Main Grid: Postmortem List & Full Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Postmortems List */}
        <div className={`rounded-xl border p-5 space-y-3 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Published Reports ({postmortems.length})</h2>
            <div className="text-xs text-slate-400 mt-0.5">Chronological archive</div>
          </div>

          {postmortems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No postmortems generated yet. Resolve an incident to auto-generate a report.
            </div>
          ) : (
            <div className="space-y-2">
              {postmortems.map((pm) => {
                const isSelected = selectedPostmortem?.id === pm.id;
                return (
                  <div
                    key={pm.id}
                    onClick={() => setSelectedPostmortem(pm)}
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
                    <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{pm.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pm.executiveSummary}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>{new Date(pm.generatedAt).toLocaleDateString()}</span>
                      <span>Tasks: {pm.followUpTasks.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Postmortem Reader */}
        <div className={`lg:col-span-2 rounded-xl border p-6 space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {selectedPostmortem ? (
            <div className="space-y-5 text-xs">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                  Report ID: {selectedPostmortem.id}
                </span>
                <h2 className="text-lg font-bold tracking-tight mt-1">{selectedPostmortem.title}</h2>
                <div className="text-slate-400 mt-1">
                  Lead Investigator: {selectedPostmortem.leadInvestigator} · Published: {new Date(selectedPostmortem.generatedAt).toLocaleString()}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Summary</div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedPostmortem.executiveSummary}
                </p>
              </div>

              {/* 5-Whys */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Five Whys Root Cause Chain</div>
                <div className="space-y-1.5">
                  {selectedPostmortem.rootCauseAnalysis.fiveWhys.map((why, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg font-mono text-[11px] flex items-start gap-2 ${
                        isDark ? 'bg-slate-950 border border-slate-800' : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <span className="font-bold text-indigo-600 shrink-0">Why #{i + 1}:</span>
                      <span>{why}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Tasks */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Engineering Action Items ({selectedPostmortem.followUpTasks.length})
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-lg overflow-hidden">
                  {selectedPostmortem.followUpTasks.map((t) => (
                    <div key={t.id} className="p-3 flex items-center justify-between">
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
          ) : (
            <div className="p-12 text-center text-xs text-slate-400">
              Select a postmortem on the left to read the full report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
