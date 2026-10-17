import React, { useState, useEffect, useRef } from 'react';
import { TopHeader, Sidebar, NavTab } from './components/Navigation';
import { OverviewView } from './views/OverviewView';
import { IncidentsView } from './views/IncidentsView';
import { IncidentDetailView } from './views/IncidentDetailView';
import { LiveOperationsView } from './views/LiveOperationsView';
import { AgentActivityView } from './views/AgentActivityView';
import { ServicesView } from './views/ServicesView';
import { DatabaseObservabilityView } from './views/DatabaseObservabilityView';
import { EvidenceExplorerView } from './views/EvidenceExplorerView';
import { RecoveryCenterView } from './views/RecoveryCenterView';
import { KnowledgeView } from './views/KnowledgeView';
import { AnalyticsView } from './views/AnalyticsView';
import { PostmortemsView } from './views/PostmortemsView';
import { AuditLogView } from './views/AuditLogView';
import { CommandCenterView } from './views/CommandCenterView';
import { SettingsView } from './views/SettingsView';
import { api } from './utils/api';
import {
  Incident,
  Service,
  SystemOverviewStats,
  ScenarioDefinition,
  EvidenceItem,
  RootCauseHypothesis,
  BusinessImpact,
  RecoveryPlan,
  VerificationResult,
  Postmortem,
  AgentRun,
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('sentinelops_theme') === 'dark';
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('sentinelops_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Reset scroll on navigation changes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentTab, selectedIncidentId]);

  // Global Datasets
  const [stats, setStats] = useState<SystemOverviewStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Selected Incident Details
  const [incidentDetail, setIncidentDetail] = useState<{
    incident: Incident;
    primaryService?: Service;
    evidence: EvidenceItem[];
    hypotheses: RootCauseHypothesis[];
    impact: BusinessImpact | null;
    recoveryPlan: RecoveryPlan | null;
    verification: VerificationResult | null;
    postmortem: Postmortem | null;
    agentRuns: AgentRun[];
  } | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadGlobalData = async () => {
    try {
      const [overviewData, svcData, incData, scenData, agentsData] = await Promise.all([
        api.getOverview(),
        api.getServices(),
        api.getIncidents(),
        api.getScenarios(),
        api.getAllAgents().catch(() => []),
      ]);
      setStats(overviewData);
      setServices(svcData);
      setIncidents(incData);
      setScenarios(scenData);
      setAgentRuns(agentsData);
    } catch (e) {
      console.error('Error loading global data:', e);
    }
  };

  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(loadGlobalData, 4500);
    return () => clearInterval(interval);
  }, []);

  // When selected incident changes, load detail
  const loadIncidentDetail = async (id: string) => {
    try {
      const detail = await api.getIncidentDetails(id);
      setIncidentDetail(detail);
      setSelectedIncidentId(id);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedIncidentId) {
      loadIncidentDetail(selectedIncidentId);
    } else {
      setIncidentDetail(null);
    }
  }, [selectedIncidentId]);

  // Actions
  const handleQuickSimulate = async () => {
    setIsSimulating(true);
    showToast('Autonomous Incident Simulation initiated...');
    try {
      const inc = await api.simulateIncident('postgres-query-regression');
      await loadGlobalData();
      await loadIncidentDetail(inc.id);
      showToast(`Incident ${inc.id} detected & investigated.`);
    } catch (e: any) {
      showToast(`Simulation error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateScenario = async (scenarioKey: string): Promise<Incident> => {
    setIsSimulating(true);
    showToast(`Simulating scenario: ${scenarioKey}...`);
    try {
      const inc = await api.simulateIncident(scenarioKey);
      await loadGlobalData();
      await loadIncidentDetail(inc.id);
      showToast(`Simulation started for ${inc.id}`);
      return inc;
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCreateIncident = async (data: {
    title: string;
    severity: string;
    primaryServiceId: string;
    description: string;
  }) => {
    const inc = await api.createIncident(data);
    await loadGlobalData();
    await loadIncidentDetail(inc.id);
    showToast(`Declared incident ${inc.id}. Autonomous investigation underway.`);
  };

  const handleApproveRecovery = async (planId: string, rationale: string) => {
    if (!selectedIncidentId) return;
    showToast('Authorizing recovery action through server-side gate...');
    await api.approveRecovery(selectedIncidentId, 'Staff SRE Lead', rationale);
    await loadIncidentDetail(selectedIncidentId);
    await loadGlobalData();
    showToast('Recovery executed. System verified healthy.');
  };

  const handleRejectRecovery = async (planId: string, rationale: string) => {
    if (!selectedIncidentId) return;
    await api.rejectRecovery(selectedIncidentId, 'Staff SRE Lead', rationale);
    await loadIncidentDetail(selectedIncidentId);
    await loadGlobalData();
    showToast('Recovery plan rejected. SRE notified.');
  };

  const handleVerifyRecovery = async () => {
    if (!selectedIncidentId) return;
    showToast('Running post-recovery health telemetry verification...');
    await api.verifyRecovery(selectedIncidentId);
    await loadIncidentDetail(selectedIncidentId);
    await loadGlobalData();
    showToast('Verification passed. Telemetry within SLA.');
  };

  const handleGeneratePostmortem = async () => {
    if (!selectedIncidentId) return;
    showToast('Synthesizing postmortem with Gemini 3.8...');
    await api.generatePostmortem(selectedIncidentId);
    await loadIncidentDetail(selectedIncidentId);
    await loadGlobalData();
    showToast('Postmortem published to knowledge base.');
  };

  const handleRetriggerInvestigation = async () => {
    if (!selectedIncidentId) return;
    showToast('Re-running autonomous investigation phase...');
    await api.investigateIncident(selectedIncidentId);
    await loadIncidentDetail(selectedIncidentId);
    showToast('Investigation updated with fresh evidence.');
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      {/* Top Header */}
      <TopHeader
        currentTab={currentTab}
        selectedIncidentId={selectedIncidentId}
        onClearIncident={() => setSelectedIncidentId(null)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onQuickSimulate={handleQuickSimulate}
        isSimulating={isSimulating}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      {/* Body: Sidebar on the left + Main Content on the right */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setSelectedIncidentId(null);
            setCurrentTab(tab);
          }}
          activeIncidentsCount={stats?.activeIncidentsCount || 0}
          pendingApprovalsCount={stats?.pendingApprovalsCount || 0}
          isDark={isDark}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Dynamic Main Viewport */}
        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 w-full min-w-0"
        >
          {selectedIncidentId && incidentDetail ? (
            <IncidentDetailView
              incident={incidentDetail.incident}
              primaryService={incidentDetail.primaryService}
              evidence={incidentDetail.evidence}
              hypotheses={incidentDetail.hypotheses}
              impact={incidentDetail.impact}
              recoveryPlan={incidentDetail.recoveryPlan}
              verification={incidentDetail.verification}
              postmortem={incidentDetail.postmortem}
              agentRuns={incidentDetail.agentRuns}
              onBack={() => setSelectedIncidentId(null)}
              onApproveRecovery={handleApproveRecovery}
              onRejectRecovery={handleRejectRecovery}
              onVerifyRecovery={handleVerifyRecovery}
              onGeneratePostmortem={handleGeneratePostmortem}
              onRetriggerInvestigation={handleRetriggerInvestigation}
              isDark={isDark}
            />
          ) : currentTab === 'overview' ? (
            <OverviewView
              stats={stats}
              incidents={incidents}
              services={services}
              scenarios={scenarios}
              agentRuns={agentRuns}
              onSelectIncident={(id) => loadIncidentDetail(id)}
              onQuickSimulate={handleQuickSimulate}
              onRunScenario={handleSimulateScenario}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
              isDark={isDark}
              isSimulating={isSimulating}
            />
          ) : currentTab === 'incidents' ? (
            <IncidentsView
              incidents={incidents}
              services={services}
              onSelectIncident={(id) => loadIncidentDetail(id)}
              onCreateIncident={handleCreateIncident}
              isDark={isDark}
            />
          ) : currentTab === 'live-operations' ? (
            <LiveOperationsView
              scenarios={scenarios}
              onSimulateScenario={handleSimulateScenario}
              onSelectIncident={(id) => loadIncidentDetail(id)}
              isDark={isDark}
            />
          ) : currentTab === 'agent-activity' ? (
            <AgentActivityView agentRuns={agentRuns} isDark={isDark} />
          ) : currentTab === 'services' ? (
            <ServicesView services={services} isDark={isDark} />
          ) : currentTab === 'database' ? (
            <DatabaseObservabilityView isDark={isDark} />
          ) : currentTab === 'evidence-explorer' ? (
            <EvidenceExplorerView
              incidents={incidents}
              onSelectIncident={(id) => loadIncidentDetail(id)}
              isDark={isDark}
            />
          ) : currentTab === 'recovery-center' ? (
            <RecoveryCenterView
              incidents={incidents}
              onSelectIncident={(id) => loadIncidentDetail(id)}
              onApproveRecovery={handleApproveRecovery}
              isDark={isDark}
            />
          ) : currentTab === 'knowledge' ? (
            <KnowledgeView isDark={isDark} />
          ) : currentTab === 'analytics' ? (
            <AnalyticsView isDark={isDark} />
          ) : currentTab === 'postmortems' ? (
            <PostmortemsView isDark={isDark} />
          ) : currentTab === 'audit-log' ? (
            <AuditLogView isDark={isDark} />
          ) : currentTab === 'command-center' ? (
            <CommandCenterView isDark={isDark} />
          ) : currentTab === 'settings' ? (
            <SettingsView isDark={isDark} onToggleTheme={toggleTheme} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
