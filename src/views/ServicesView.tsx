import React from 'react';
import { Server, Activity, ArrowRight, ShieldCheck, Clock, Layers } from 'lucide-react';
import { Service } from '../types';

interface ServicesViewProps {
  services: Service[];
  isDark: boolean;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ services, isDark }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Microservices & Topology Catalog
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Production Services & Infrastructure Dependencies
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Service health scores, P99 latency SLA baselines, container runtimes, deployment versions, and cross-service dependency graphs.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc) => (
          <div
            key={svc.id}
            className={`p-5 rounded-xl border text-xs space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  svc.status === 'HEALTHY'
                    ? 'bg-emerald-500'
                    : svc.status === 'DEGRADED'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`} />
                <span className="font-bold text-sm text-slate-900 dark:text-white">{svc.name}</span>
                <span className="text-[10px] font-mono text-slate-400">({svc.tier})</span>
              </div>

              <div className="text-right">
                <span className={`font-mono text-xs font-bold ${
                  svc.status === 'HEALTHY' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {svc.status}
                </span>
                <div className="text-[10px] text-slate-400 font-mono">
                  Health: {svc.healthScore}/100
                </div>
              </div>
            </div>

            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {svc.description}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400">P99 Latency:</span>{' '}
                <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-200">{svc.latencyP99Ms}ms</strong>
              </div>
              <div>
                <span className="text-slate-400">5xx Error:</span>{' '}
                <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-200">{svc.errorRatePercent}%</strong>
              </div>
              <div>
                <span className="text-slate-400">Release:</span>{' '}
                <strong className="font-mono text-slate-700 dark:text-slate-200">{svc.currentVersion}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="truncate max-w-[280px]">
                <span>Runtime: </span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{svc.runtime}</span>
              </div>
              <div>
                <span>Dependencies: </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {svc.dependencies.length > 0 ? svc.dependencies.join(', ') : 'None (Anchor)'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
