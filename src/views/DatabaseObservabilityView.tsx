import React, { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  FileCode,
  Terminal,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { api } from '../utils/api';
import { DatabaseSlowQuery, DatabaseLockInfo } from '../types';

interface DatabaseObservabilityViewProps {
  isDark: boolean;
}

export const DatabaseObservabilityView: React.FC<DatabaseObservabilityViewProps> = ({ isDark }) => {
  const [loading, setLoading] = useState(true);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [queriesData, setQueriesData] = useState<{
    slowQueries: DatabaseSlowQuery[];
    locks: DatabaseLockInfo[];
    tableStats: any[];
    activeConnections: number;
    maxConnections: number;
    poolUtilization: number;
  } | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<DatabaseSlowQuery | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [h, q] = await Promise.all([api.getDatabaseHealth(), api.getDatabaseQueries()]);
      setDbHealth(h);
      setQueriesData(q);
      if (q.slowQueries && q.slowQueries.length > 0) {
        setSelectedQuery(q.slowQueries[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>First-Class PostgreSQL Engine Observability</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            PostgreSQL Cluster Reliability & Lock Inspector
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time inspection of pg_stat_activity, pg_locks, sequential scan regressions, and explain plan diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Database KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] text-slate-400">Connection Pool Utilization</div>
          <div className="text-2xl font-bold mt-1 font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {queriesData?.poolUtilization ?? 34}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {queriesData?.activeConnections ?? 34} / {queriesData?.maxConnections ?? 100} active
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] text-slate-400">Cache Hit Ratio</div>
          <div className="text-2xl font-bold mt-1 font-mono tabular-nums text-emerald-600">
            {dbHealth?.cacheHitRatioPercent ?? 99.2}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Shared buffer hits</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] text-slate-400">Active Deadlocks</div>
          <div className={`text-2xl font-bold mt-1 font-mono tabular-nums ${
            (dbHealth?.deadlocksDetected ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
          }`}>
            {dbHealth?.deadlocksDetected ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">pg_stat_database aborts</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] text-slate-400">Active Lock Contentions</div>
          <div className="text-2xl font-bold mt-1 font-mono tabular-nums">
            {queriesData?.locks.length ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Exclusive / RowShare</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] text-slate-400">Engine Mode</div>
          <div className="text-sm font-bold mt-1 font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {dbHealth?.mode ?? 'EMBEDDED'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {dbHealth?.version?.split(' ')[0]} {dbHealth?.version?.split(' ')[1]}
          </div>
        </div>
      </div>

      {/* Main Grid: Slow Queries & EXPLAIN Plan Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slow Queries Table */}
        <div className={`rounded-xl border p-5 space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Slow Queries (pg_stat_statements)</h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Statements exceeding 500ms execution latency
            </div>
          </div>

          {!queriesData?.slowQueries || queriesData.slowQueries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No slow queries currently executing. Cluster operating within SLA.
            </div>
          ) : (
            <div className="space-y-2">
              {queriesData.slowQueries.map((sq) => {
                const isSelected = selectedQuery?.id === sq.id;
                return (
                  <div
                    key={sq.id}
                    onClick={() => setSelectedQuery(sq)}
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
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        Table: {sq.table}
                      </span>
                      <span className="font-mono text-rose-600 font-bold tabular-nums">
                        Avg: {sq.avgDurationMs}ms
                      </span>
                    </div>

                    <div className="font-mono text-[11px] truncate text-slate-700 dark:text-slate-300">
                      {sq.queryPattern}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>Executions: {sq.executionCount}</span>
                      <span>Max Latency: {sq.maxDurationMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EXPLAIN Plan Viewer */}
        <div className={`rounded-xl border p-5 space-y-3 flex flex-col justify-between ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold tracking-tight">EXPLAIN (BUFFERS) Query Plan</h2>
              <span className="text-[11px] font-mono text-slate-400">
                Cost & Sequential Scan Analysis
              </span>
            </div>

            {selectedQuery ? (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg font-mono text-xs whitespace-pre-wrap overflow-x-auto ${
                  isDark ? 'bg-slate-950 text-slate-300 border border-slate-800' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {selectedQuery.explainPlan}
                </div>

                {selectedQuery.indexSuggested && (
                  <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                    isDark ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-emerald-50/60 border-emerald-200'
                  }`}>
                    <div className="font-bold text-emerald-700 dark:text-emerald-300 text-[11px] uppercase">
                      Recommended Remediation Index:
                    </div>
                    <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all">
                      {selectedQuery.indexSuggested}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Select a slow query on the left to inspect its execution plan.
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Note: Diagnostic query planner executes EXPLAIN without ANALYZE to prevent execution timeouts on production replicas.
          </div>
        </div>
      </div>

      {/* Relational Table Statistics (pg_stat_user_tables) */}
      <div className={`rounded-xl border p-5 space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight">PostgreSQL Table Statistics & Scan Ratio</h2>
            <div className="text-xs text-slate-400 mt-0.5">pg_stat_user_tables scan distribution</div>
          </div>
          <span className="text-xs font-mono text-slate-400">Total Tables: {queriesData?.tableStats?.length ?? 6}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="grid grid-cols-5 text-[11px] font-semibold text-slate-400 uppercase py-2">
            <span>Table Name</span>
            <span className="text-right">Estimated Rows</span>
            <span className="text-right">Total Size</span>
            <span className="text-right">Index Scans</span>
            <span className="text-right">Seq Scans</span>
          </div>

          {queriesData?.tableStats?.map((tbl, i) => (
            <div key={i} className="grid grid-cols-5 text-xs py-2.5 font-mono items-center">
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans">
                {tbl.tableName}
              </span>
              <span className="text-right tabular-nums">{tbl.rowCount.toLocaleString()}</span>
              <span className="text-right tabular-nums">{(tbl.totalSizeBytes / 1000000).toFixed(1)} MB</span>
              <span className="text-right text-emerald-600 tabular-nums">{tbl.indexScans.toLocaleString()}</span>
              <span className={`text-right tabular-nums ${tbl.sequentialScans > 500 ? 'text-amber-600 font-bold' : ''}`}>
                {tbl.sequentialScans.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
