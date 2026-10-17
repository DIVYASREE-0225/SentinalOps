import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Database,
  FileCode,
  CheckCircle2,
  Tag,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../utils/api';
import { Runbook, Postmortem } from '../types';

interface KnowledgeViewProps {
  isDark: boolean;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({ isDark }) => {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [postmortems, setPostmortems] = useState<Postmortem[]>([]);
  const [activeTab, setActiveTab] = useState<'runbooks' | 'postmortems'>('runbooks');
  const [search, setSearch] = useState('');
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);

  useEffect(() => {
    Promise.all([api.getRunbooks(), api.getPostmortems()]).then(([r, p]) => {
      setRunbooks(r);
      setPostmortems(p);
      if (r.length > 0) setSelectedRunbook(r[0]);
    });
  }, []);

  const filteredRunbooks = runbooks.filter((rb) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      rb.title.toLowerCase().includes(q) ||
      rb.serviceId.toLowerCase().includes(q) ||
      rb.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>Operational Runbooks & RAG Memory</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Reliability Knowledge Base & Vector Memory Archive
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            SOP diagnostic procedures, database remediation queries, and historical incident postmortems vectorized for contextual retrieval during autonomous investigations.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className={`flex items-center gap-1 p-1 rounded-lg border text-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('runbooks')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'runbooks'
                ? isDark ? 'bg-slate-800 text-white shadow-xs font-semibold' : 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Runbooks Library ({runbooks.length})
          </button>
          <button
            onClick={() => setActiveTab('postmortems')}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
              activeTab === 'postmortems'
                ? isDark ? 'bg-slate-800 text-white shadow-xs font-semibold' : 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Postmortem Archive ({postmortems.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search runbooks, tags, SQL queries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* Runbooks View */}
      {activeTab === 'runbooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Runbook List */}
          <div className={`rounded-xl border p-5 space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Runbook Catalog</h2>
              <div className="text-xs text-slate-400 mt-0.5">Categorized by service and symptom</div>
            </div>

            <div className="space-y-2">
              {filteredRunbooks.map((rb) => {
                const isSelected = selectedRunbook?.id === rb.id;
                return (
                  <div
                    key={rb.id}
                    onClick={() => setSelectedRunbook(rb)}
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
                    <div className="font-semibold">{rb.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Service: {rb.serviceId}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rb.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Runbook Inspector */}
          <div className={`lg:col-span-2 rounded-xl border p-6 space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {selectedRunbook ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase">
                      Runbook SOP: {selectedRunbook.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Last Updated: {new Date(selectedRunbook.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-base font-bold tracking-tight mt-1">{selectedRunbook.title}</h2>
                </div>

                {/* Symptoms */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Trigger Symptoms</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedRunbook.symptoms.map((s, i) => (
                      <span key={i} className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                        • {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Diagnostic Queries */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnostic SQL Commands</div>
                  <div className="space-y-2">
                    {selectedRunbook.diagnosticQueries.map((q, i) => (
                      <pre
                        key={i}
                        className={`p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap overflow-x-auto ${
                          isDark ? 'bg-slate-950 text-indigo-300 border border-slate-800' : 'bg-slate-50 text-indigo-900 border border-slate-200'
                        }`}
                      >
                        {q}
                      </pre>
                    ))}
                  </div>
                </div>

                {/* Mitigation Steps */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Step-by-Step Mitigation</div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedRunbook.mitigationSteps.map((m, i) => (
                      <div key={i} className="p-2 rounded border border-slate-100 dark:border-slate-800">
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                Select a runbook on the left to view mitigation steps and diagnostic queries.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Postmortems Archive View */}
      {activeTab === 'postmortems' && (
        <div className={`rounded-xl border p-5 space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {postmortems.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No historical postmortems published yet. Resolve an incident to auto-generate a postmortem.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {postmortems.map((pm) => (
                <div key={pm.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{pm.title}</span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(pm.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {pm.executiveSummary}
                  </p>
                  <div className="text-[11px] text-slate-400">
                    Lead: {pm.leadInvestigator} · Action Items: {pm.followUpTasks.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
