import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Incident, Service } from '../types';

interface IncidentsViewProps {
  incidents: Incident[];
  services: Service[];
  onSelectIncident: (id: string) => void;
  onCreateIncident: (data: {
    title: string;
    severity: string;
    primaryServiceId: string;
    description: string;
  }) => Promise<void>;
  isDark: boolean;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  services,
  onSelectIncident,
  onCreateIncident,
  isDark,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'RESOLVED'>('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newService, setNewService] = useState('order-service');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = incidents.filter((inc) => {
    if (filter === 'ACTIVE' && (inc.status === 'RESOLVED' || inc.status === 'POSTMORTEM_GENERATED')) return false;
    if (filter === 'CRITICAL' && inc.severity !== 'CRITICAL') return false;
    if (filter === 'RESOLVED' && inc.status !== 'RESOLVED' && inc.status !== 'POSTMORTEM_GENERATED') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inc.title.toLowerCase().includes(q) && !inc.id.toLowerCase().includes(q) && !inc.primaryServiceId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setIsSubmitting(true);
    try {
      await onCreateIncident({
        title: newTitle,
        severity: newSeverity,
        primaryServiceId: newService,
        description: newDescription || 'Manual operational incident triggered by SRE operator.',
      });
      setShowModal(false);
      setNewTitle('');
      setNewDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Operational Incident Ledger
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Incidents Management & Response Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Track, filter, and drill into incidents actively undergoing autonomous investigation, root-cause evaluation, and recovery execution.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Interactive Segmented Filter Tabs */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border text-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {(['ALL', 'ACTIVE', 'CRITICAL', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                filter === tab
                  ? isDark
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, ID, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
            }`}
          />
        </div>
      </div>

      {/* Incidents Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No incidents found matching current filter or search criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((inc) => (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <div className="space-y-1.5">
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
                    <span className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600">
                      {inc.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Service: <strong className="text-slate-600 dark:text-slate-300">{inc.primaryServiceId}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>P99: <strong className="font-mono tabular-nums text-slate-600 dark:text-slate-300">{inc.currentLatencyMs}ms</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>5xx Error: <strong className="font-mono tabular-nums text-slate-600 dark:text-slate-300">{inc.currentErrorRate}%</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Started: {new Date(inc.startedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {inc.status}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Evidence: {inc.evidenceCount} items
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Declare Manual Incident */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md p-6 rounded-xl border shadow-xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-base font-bold tracking-tight mb-4">Declare Operational Incident</h2>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database Connection Timeouts during Checkout"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="CRITICAL">CRITICAL (P0)</option>
                    <option value="HIGH">HIGH (P1)</option>
                    <option value="MEDIUM">MEDIUM (P2)</option>
                    <option value="LOW">LOW (P3)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Impacted Service</label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                    }`}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description / Observed Symptoms</label>
                <textarea
                  rows={3}
                  placeholder="Describe observed errors, alerts, or customer reports..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  {isSubmitting ? 'Triggering...' : 'Trigger Investigation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
