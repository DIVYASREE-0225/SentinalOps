import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Search, Filter, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';
import { AuditLogEntry } from '../types';

interface AuditLogViewProps {
  isDark: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ isDark }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      l.resourceId.toLowerCase().includes(q)
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
            <span>Security & Compliance Record</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Immutable Operations & Authorization Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Cryptographically timestamped record of every autonomous agent action, tool invocation, human SRE authorization, and recovery execution.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by action, actor, resource ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        />
      </div>

      {/* Audit Log Table */}
      <div className={`rounded-xl border overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-semibold text-slate-400 uppercase ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 font-mono text-[11px]">
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                    {log.actor}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-semibold">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap text-slate-400">
                    {log.resourceType}:{log.resourceId}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 font-sans max-w-md truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
