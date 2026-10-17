import React, { useState } from 'react';
import {
  Settings,
  Database,
  ShieldCheck,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../utils/api';

interface SettingsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isDark, onToggleTheme }) => {
  const [dbUrl, setDbUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; mode: string } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.connectDatabase(dbUrl);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: `Connection error: ${e.message}`,
        mode: 'EMBEDDED_RELATIONAL',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Platform Configuration & Infrastructure
        </div>
        <h1 className="text-xl font-bold tracking-tight mt-1">
          Settings & PostgreSQL Integration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure real PostgreSQL connection endpoints, risk-based execution gates, and interface appearance.
        </p>
      </div>

      {/* PostgreSQL Connection Section */}
      <div className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold tracking-tight">PostgreSQL Database Connection (DATABASE_URL)</h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          SentinelOps features a first-class normalized relational PostgreSQL architecture. When a connection string is provided, the platform tests live connectivity using the official <code className="font-mono">pg.Pool</code> driver, runs relational DDL migrations, and executes live queries over orders, customers, and incidents. If omitted, it operates in the embedded relational storage engine.
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-semibold">PostgreSQL Connection String</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="postgresql://user:password@localhost:5432/sentinelops_production"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              className={`flex-1 px-3 py-2 text-xs rounded-lg border font-mono ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test & Connect'}</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 font-mono ${
            testResult.success
              ? isDark ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : isDark ? 'bg-rose-950/20 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <div>
              <div className="font-bold">{testResult.message}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Active Mode: {testResult.mode}</div>
            </div>
          </div>
        )}
      </div>

      {/* Risk Approval Policies Section */}
      <div className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold tracking-tight">Server-Side Authorization & Safety Gates</h2>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-semibold">Low-Risk Actions Exemption</div>
              <div className="text-slate-400">Allow auto-approval for non-disruptive actions (cache warming, metric resets)</div>
            </div>
            <span className="font-mono text-emerald-600 font-bold">Enabled</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-semibold">High & Critical Risk Gate</div>
              <div className="text-slate-400">Enforce human SRE signoff for rollbacks, index drops, or connection drops</div>
            </div>
            <span className="font-mono text-rose-600 font-bold">Enforced (Strict)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-semibold">Idempotency Token Controls</div>
              <div className="text-slate-400">Prevent duplicate execution of identical recovery commands</div>
            </div>
            <span className="font-mono text-emerald-600 font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* Visual Design System & Theme */}
      <div className={`p-6 rounded-xl border space-y-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h2 className="text-sm font-bold tracking-tight">Visual Theme & Appearance</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          SentinelOps features a clean light-first design standard with full optical compensation in dark mode.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${
              !isDark
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light Theme (Default)</span>
          </button>

          <button
            onClick={onToggleTheme}
            className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-colors ${
              isDark
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark Theme</span>
          </button>
        </div>
      </div>
    </div>
  );
};
