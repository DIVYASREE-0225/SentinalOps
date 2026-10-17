import React from 'react';
import {
  Activity,
  AlertTriangle,
  PlayCircle,
  Cpu,
  Server,
  Database,
  GitBranch,
  ShieldCheck,
  BookOpen,
  BarChart3,
  FileText,
  Clock,
  Terminal,
  Settings,
  Sun,
  Moon,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';
import avatarImg from '../assets/images/sre_operator_avatar_1792232547715.jpg';

export type NavTab =
  | 'overview'
  | 'incidents'
  | 'live-operations'
  | 'agent-activity'
  | 'services'
  | 'database'
  | 'evidence-explorer'
  | 'recovery-center'
  | 'knowledge'
  | 'analytics'
  | 'postmortems'
  | 'audit-log'
  | 'command-center'
  | 'settings';

export interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  description: string;
}

export const NAV_ITEMS = (
  activeIncidentsCount: number,
  pendingApprovalsCount: number
): NavItemConfig[] => [
  { id: 'overview', label: 'Overview', icon: Activity, description: 'Executive operational posture & active alert response' },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle, count: activeIncidentsCount, description: 'Live & historical incident response ledger' },
  { id: 'live-operations', label: 'Live Operations', icon: PlayCircle, description: 'Autonomous 10-scenario failure simulation suite' },
  { id: 'agent-activity', label: 'Agent Activity', icon: Cpu, description: 'Audit trail of the 8 specialized AI operational agents' },
  { id: 'services', label: 'Services Catalog', icon: Server, description: 'Microservices tiering, P99 SLA baselines & dependencies' },
  { id: 'database', label: 'Database Observability', icon: Database, description: 'PostgreSQL pool utilization, locks & EXPLAIN diagnostics' },
  { id: 'evidence-explorer', label: 'Evidence Explorer', icon: GitBranch, description: 'Causal relationship graph connecting telemetry to root cause' },
  { id: 'recovery-center', label: 'Recovery Center', icon: ShieldCheck, count: pendingApprovalsCount, description: 'Risk-governed mitigation plans & human approval gates' },
  { id: 'knowledge', label: 'Knowledge & RAG', icon: BookOpen, description: 'Operational runbooks, SOP queries & vectorized postmortems' },
  { id: 'analytics', label: 'Analytics & Impact', icon: BarChart3, description: 'MTTD, MTTR, root cause distribution & business loss metrics' },
  { id: 'postmortems', label: 'Postmortems', icon: FileText, description: 'Blameless 5-whys postmortem archive & follow-up tasks' },
  { id: 'audit-log', label: 'Audit Log', icon: Clock, description: 'Cryptographic compliance record of all actions & tool calls' },
  { id: 'command-center', label: 'Command Center', icon: Terminal, description: 'Natural language SRE Copilot powered by Gemini 3.8' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'PostgreSQL DATABASE_URL connection & policy configuration' },
];

interface TopHeaderProps {
  currentTab: NavTab;
  selectedIncidentId?: string | null;
  onClearIncident?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onQuickSimulate: () => void;
  isSimulating: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  selectedIncidentId,
  onClearIncident,
  isDark,
  onToggleTheme,
  onQuickSimulate,
  isSimulating,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <header className={`h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b transition-colors z-30 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Zone 1: Mobile toggle & Single Brand text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs tracking-wider">
            SO
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap">
            SentinelOps
          </span>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-medium border-l border-slate-200 dark:border-slate-800 pl-2.5">
            <span>Autonomous Incident Recovery</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Contextual single-line breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap overflow-hidden">
        <span>PostgreSQL Primary</span>
        <span aria-hidden="true">·</span>
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          {currentTab.replace('-', ' ').toUpperCase()}
        </span>
        {selectedIncidentId && (
          <>
            <span aria-hidden="true">/</span>
            <button
              onClick={onClearIncident}
              className="text-amber-600 font-mono font-semibold hover:underline"
              title="Click to return to full list"
            >
              {selectedIncidentId}
            </button>
          </>
        )}
      </div>

      {/* Zone 3: 1 Primary CTA + Theme toggle + Operator Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Simulation CTA */}
        <button
          onClick={onQuickSimulate}
          disabled={isSimulating}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            isSimulating
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Simulating...' : 'Simulate Incident'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle Theme"
          className={`p-1.5 rounded-lg border transition-colors ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* SRE Operator Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600">
            <img
              src={avatarImg}
              alt="Sarah Jenkins SRE"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold leading-tight">Sarah J.</div>
            <div className="text-[10px] text-slate-400 leading-tight">Staff SRE Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeIncidentsCount: number;
  pendingApprovalsCount: number;
  isDark: boolean;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeIncidentsCount,
  pendingApprovalsCount,
  isDark,
  mobileMenuOpen,
  onCloseMobileMenu,
}) => {
  const items = NAV_ITEMS(activeIncidentsCount, pendingApprovalsCount);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={onCloseMobileMenu}
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar container: fixed on mobile, flex child on desktop */}
      <aside className={`
        w-64 shrink-0 border-r flex flex-col justify-between overflow-y-auto transition-colors z-40
        ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}
        ${mobileMenuOpen ? 'fixed inset-y-0 left-0 top-14 shadow-2xl md:relative md:top-0 md:shadow-none' : 'hidden md:flex'}
      `}>
        <div className="p-3 space-y-0.5">
          <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Operations Console
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobileMenu();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap text-left ${
                  isActive
                    ? isDark
                      ? 'bg-indigo-950/80 text-indigo-300 font-semibold'
                      : 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : isDark
                    ? 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                }`}
                title={item.description}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded text-white ml-2 shrink-0 ${
                    item.id === 'incidents' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Platform Status Card */}
        <div className={`p-3.5 m-3 rounded-lg border text-xs space-y-2 shrink-0 ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between font-medium">
            <span className="text-slate-500 dark:text-slate-400">Autonomous Core</span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Operational</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Database Engine</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">PostgreSQL 16</span>
            </div>
            <div className="flex justify-between">
              <span>Active Agents</span>
              <span className="font-mono">8 Specialized</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// Unified export for backward compatibility
interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeIncidentsCount: number;
  pendingApprovalsCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onQuickSimulate: () => void;
  isSimulating: boolean;
  selectedIncidentId?: string | null;
  onClearIncident?: () => void;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onCloseMobileMenu?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeIncidentsCount,
  pendingApprovalsCount,
  isDark,
  onToggleTheme,
  onQuickSimulate,
  isSimulating,
  selectedIncidentId,
  onClearIncident,
  mobileMenuOpen = false,
  onToggleMobileMenu = () => {},
  onCloseMobileMenu = () => {},
}) => {
  return (
    <>
      <TopHeader
        currentTab={currentTab}
        selectedIncidentId={selectedIncidentId}
        onClearIncident={onClearIncident}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onQuickSimulate={onQuickSimulate}
        isSimulating={isSimulating}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={onToggleMobileMenu}
      />
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        activeIncidentsCount={activeIncidentsCount}
        pendingApprovalsCount={pendingApprovalsCount}
        isDark={isDark}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={onCloseMobileMenu}
      />
    </>
  );
};
