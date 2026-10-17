import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Server,
  AlertTriangle,
  Database,
  FileText,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Incident, Service, EvidenceItem, RecoveryPlan, BusinessImpact } from '../types';
import { api } from '../utils/api';

interface EvidenceExplorerViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  isDark: boolean;
}

interface GraphNode {
  id: string;
  type: 'INCIDENT' | 'SERVICE' | 'EVIDENCE' | 'IMPACT' | 'RECOVERY' | 'VERIFICATION';
  label: string;
  sublabel: string;
  severity?: string;
  details: string;
  source?: string;
  timestamp?: string;
}

interface GraphLink {
  from: string;
  to: string;
  relation: string;
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({
  incidents,
  onSelectIncident,
  isDark,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(incidents[0]?.id || '');
  const [detail, setDetail] = useState<{
    incident: Incident;
    primaryService?: Service;
    evidence: EvidenceItem[];
    impact: BusinessImpact | null;
    recoveryPlan: RecoveryPlan | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const fetchDetail = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getIncidentDetails(id);
      setDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIncidentId) {
      fetchDetail(selectedIncidentId);
    }
  }, [selectedIncidentId]);

  useEffect(() => {
    if (!selectedIncidentId && incidents.length > 0) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents]);

  // Construct dynamic nodes and links from actual incident data
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  if (detail) {
    const inc = detail.incident;

    // Node 1: Incident
    nodes.push({
      id: 'node-inc',
      type: 'INCIDENT',
      label: inc.title,
      sublabel: `Status: ${inc.status}`,
      severity: inc.severity,
      details: inc.description || 'Primary incident coordinating multi-agent response.',
      timestamp: inc.startedAt,
    });

    // Node 2: Service
    nodes.push({
      id: 'node-svc',
      type: 'SERVICE',
      label: detail.primaryService?.name || inc.primaryServiceId,
      sublabel: `${detail.primaryService?.tier || 'Tier 1'} · P99: ${inc.currentLatencyMs}ms (was ${inc.baselineLatencyMs}ms)`,
      details: `Runtime: ${detail.primaryService?.runtime || 'Distributed cluster'}. Error rate: ${inc.currentErrorRate}%.`,
    });
    links.push({ from: 'node-inc', to: 'node-svc', relation: 'affects service' });

    // Node 3+: Evidence items
    detail.evidence.forEach((ev, idx) => {
      const evId = `node-ev-${idx}`;
      nodes.push({
        id: evId,
        type: 'EVIDENCE',
        label: ev.summary,
        sublabel: `Type: ${ev.type} · Relevance: ${Math.round(ev.relevanceScore * 100)}%`,
        details: ev.details,
        source: ev.source,
        timestamp: ev.timestamp,
      });
      links.push({ from: 'node-svc', to: evId, relation: 'emits evidence' });
    });

    // Node: Business Impact
    if (detail.impact) {
      nodes.push({
        id: 'node-impact',
        type: 'IMPACT',
        label: `${detail.impact.affectedOrdersCount} Failed Customer Checkouts`,
        sublabel: `$${(detail.impact.measuredRevenueLossCents / 100).toFixed(2)} measured loss · SLA: ${detail.impact.slaBreached ? 'BREACHED' : 'NOMINAL'}`,
        details: `Calculated from persistent orders table. Enterprise accounts hit: ${detail.impact.enterpriseCustomersImpacted}.`,
      });
      links.push({ from: 'node-svc', to: 'node-impact', relation: 'causes transaction loss' });
    }

    // Node: Recovery Actions
    if (detail.recoveryPlan && detail.recoveryPlan.actions.length > 0) {
      detail.recoveryPlan.actions.forEach((act, idx) => {
        const actId = `node-act-${idx}`;
        nodes.push({
          id: actId,
          type: 'RECOVERY',
          label: act.title,
          sublabel: `Risk: ${act.riskLevel} · Status: ${act.status}`,
          details: `${act.description}\nRollback: ${act.rollbackStrategy}\nVerification: ${act.verificationCriteria}`,
        });
        links.push({ from: 'node-inc', to: actId, relation: 'mitigated by' });
      });
    }
  }

  // Set default selected node
  useEffect(() => {
    if (nodes.length > 0 && (!selectedNode || !nodes.find((n) => n.id === selectedNode.id))) {
      setSelectedNode(nodes[0]);
    }
  }, [detail]);

  return (
    <div className="space-y-6">
      {/* Header with Incident Selector */}
      <div className={`p-5 sm:p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Relational Causal Graph
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-1">
            Dynamic Cross-Stack Evidence Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every node and link is dynamically derived from actual persisted incident records, telemetry evidence, PostgreSQL slow queries, and customer order transactions.
          </p>
        </div>

        {/* Incident Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Select Incident:</label>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className={`px-3 py-1.5 text-xs rounded-lg border font-mono ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.id} — {inc.title.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-indigo-600 font-mono flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Building relational evidence graph from database...</span>
        </div>
      ) : nodes.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No incident data available. Trigger an incident simulation to explore evidence relationships.
        </div>
      ) : (
        /* Main Visualizer Canvas & Detail Inspector */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graph Canvas */}
          <div className={`lg:col-span-2 rounded-xl border p-5 flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold tracking-tight">Connected Evidence Topology ({nodes.length} Nodes)</h2>
                <span className="text-[11px] text-slate-400">Click any node to inspect evidence</span>
              </div>

              {/* Visual Node Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                {nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                            : 'bg-indigo-50/90 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                          : isDark
                          ? 'border-slate-800 hover:border-slate-700 bg-slate-800/30'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          {node.type}
                        </span>
                        {node.severity && (
                          <span className="text-[10px] font-bold text-rose-600 font-mono">
                            {node.severity}
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {node.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {node.sublabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Links Summary */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-[11px] text-slate-400 flex flex-wrap gap-2">
              <span className="font-semibold text-slate-500">Evidence Causal Links:</span>
              {links.map((link, i) => (
                <span key={i} className="flex items-center gap-1 font-mono text-[10px]">
                  <span>{link.from.replace('node-', '')}</span>
                  <span className="text-indigo-600">--[{link.relation}]--&gt;</span>
                  <span>{link.to.replace('node-', '')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Node Inspector Drawer */}
          <div className={`rounded-xl border p-5 flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold tracking-tight">Evidence Inspector</h2>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                    {selectedNode.type}
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Entity Summary</label>
                  <div className="text-sm font-bold mt-0.5 text-slate-900 dark:text-white">{selectedNode.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">{selectedNode.sublabel}</div>
                </div>

                {selectedNode.source && (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Telemetry Source</label>
                    <div className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-0.5">{selectedNode.source}</div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Ground Truth Diagnostics</label>
                  <div className={`p-3 rounded-lg text-xs font-mono mt-1 leading-relaxed whitespace-pre-wrap ${
                    isDark ? 'bg-slate-950 text-slate-300 border border-slate-800' : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {selectedNode.details}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Causal Graph Relationships</label>
                  <div className="space-y-1 mt-1 text-xs">
                    {links
                      .filter((l) => l.from === selectedNode.id || l.to === selectedNode.id)
                      .map((l, idx) => (
                        <div key={idx} className="p-2 rounded border border-slate-100 dark:border-slate-800 flex items-center justify-between font-mono text-[10px]">
                          <span>{l.from === selectedNode.id ? `Downstream: ${l.to}` : `Upstream: ${l.from}`}</span>
                          <span className="text-indigo-600 font-semibold">[{l.relation}]</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Select a node to inspect its details.
              </div>
            )}

            {detail && (
              <button
                onClick={() => onSelectIncident(detail.incident.id)}
                className="mt-6 w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Open Incident Full Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
