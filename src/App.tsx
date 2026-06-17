import React, { useState, useEffect } from 'react';
import { defaultRawCSV } from './utils/defaultData';
import { parseFullCSV, convertCSVRowsToContracts, deriveClassification } from './utils/csvParser';
import { Contract, DashboardFilters } from './types';
import SheetsSync from './components/SheetsSync';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ContractsTable from './components/ContractsTable';
import ContractDetails from './components/ContractDetails';
import BillingMatrix from './components/BillingMatrix';
import ControlMatrix from './components/ControlMatrix';

import {
  FileCheck2, SlidersHorizontal, Table, LineChart, Cpu, Calendar, Database,
  HelpCircle, RefreshCw, Layers, ArrowUpRight, ShieldCheck, Mail, Receipt,
  Sun, Moon, Printer, ShieldAlert
} from 'lucide-react';

const INITIAL_FILTERS: DashboardFilters = {
  searchQuery: '',
  section: 'All',
  supervisor: 'All',
  workStatus: 'All',
  classificationType: 'All',
  pendingBillStatus: 'All',
  newProposalStatus: 'All'
};

// Security Passcode Gate to protect public access on GitHub Pages.
// To turn off the password requirement, simply set this to an empty string ''.
const SECURITY_PASSCODE = 'KYN-ELS-2026';

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sourceName, setSourceName] = useState('Default KYN Shed Records');
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [currentTab, setCurrentTab] = useState<'analytics' | 'register' | 'billing' | 'matrix'>('analytics');
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('kyn_dark_mode') === 'true');
  const [showPrintNotice, setShowPrintNotice] = useState(false);

  // Passcode gate state
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (!SECURITY_PASSCODE) return true;
    return sessionStorage.getItem('kyn_unlocked') === 'true';
  });

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeAttempt === SECURITY_PASSCODE) {
      sessionStorage.setItem('kyn_unlocked', 'true');
      setIsUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('kyn_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('kyn_dark_mode', 'false');
    }
  }, [darkMode]);

  const handlePrintClick = () => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      setShowPrintNotice(true);
      // Auto-dismiss after 10 seconds
      setTimeout(() => setShowPrintNotice(false), 10000);
    }
    window.print();
  };

  // Load contracts from LocalStorage if they exist, else write initial parsed CSV
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('kyn_contracts_data');
      const storedSource = localStorage.getItem('kyn_contracts_source');

      if (storedData) {
        const parsed: Contract[] = JSON.parse(storedData);
        // Refresh classifications to prevent cached stale/duplicate types
        const upgraded = parsed.map(c => ({
          ...c,
          classificationType: deriveClassification(c.workName, c.section)
        }));
        setContracts(upgraded);
        if (storedSource) setSourceName(storedSource);
      } else {
        // Parse original pre-seeded CSV
        const rows = parseFullCSV(defaultRawCSV);
        const parsed = convertCSVRowsToContracts(rows);
        setContracts(parsed);
        localStorage.setItem('kyn_contracts_data', JSON.stringify(parsed));
        localStorage.setItem('kyn_contracts_source', 'Default KYN Shed Records');
      }
    } catch (e) {
      console.error('Failed to restore dashboard from local cache:', e);
      // Fallback load
      const rows = parseFullCSV(defaultRawCSV);
      setContracts(convertCSVRowsToContracts(rows));
    }
  }, []);

  const handleDataLoaded = (newContracts: Contract[], source: string) => {
    setContracts(newContracts);
    setSourceName(source);
    localStorage.setItem('kyn_contracts_data', JSON.stringify(newContracts));
    localStorage.setItem('kyn_contracts_source', source);
    // Auto collapse sync panel
    setShowSyncPanel(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Are you sure you want to reset the dashboard dataset back to the default Electric Loco Shed (Kalyan) pre-seeded contracts? This will overwrite your Google Sheets updates.')) {
      const rows = parseFullCSV(defaultRawCSV);
      const parsed = convertCSVRowsToContracts(rows);
      setContracts(parsed);
      setSourceName('Default KYN Shed Records');
      localStorage.setItem('kyn_contracts_data', JSON.stringify(parsed));
      localStorage.setItem('kyn_contracts_source', 'Default KYN Shed Records');
      setFilters(INITIAL_FILTERS);
    }
  };

  // Helper selectors from charts
  const handleFilterSection = (sec: string) => {
    setFilters(prev => ({ ...prev, section: sec }));
    setCurrentTab('register');
    // Scroll down to table
    document.getElementById('contracts-data-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFilterSupervisor = (superv: string) => {
    setFilters(prev => ({ ...prev, supervisor: superv }));
    setCurrentTab('register');
    document.getElementById('contracts-data-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFilterClassification = (classType: string) => {
    setFilters(prev => ({ ...prev, classificationType: classType }));
    setCurrentTab('register');
    document.getElementById('contracts-data-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReplaceFilters = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  if (!isUnlocked && SECURITY_PASSCODE) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden dark">
        {/* Abstract background decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative w-full max-w-md bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
          <div className="mx-auto w-14 h-14 bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white font-sans">Central Railway • ELS/KYN</h1>
          <p className="text-[10px] text-teal-400 font-mono tracking-widest uppercase mt-1">Contracts Controller Gate</p>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed px-2">
            This dashboard contains sensitive contractor schedules and live financial liabilities. Enter the secure controller passcode to initialize the monitoring system.
          </p>

          <form onSubmit={handlePasscodeSubmit} className="mt-8 space-y-4">
            <div>
              <input
                type="password"
                required
                value={passcodeAttempt}
                onChange={(e) => {
                  setPasscodeAttempt(e.target.value);
                  setPasscodeError(false);
                }}
                placeholder="Enter Site Passcode..."
                className="w-full text-center py-3 px-4 bg-slate-950/80 border border-slate-800 focus:border-teal-500/60 text-white placeholder-slate-600 rounded-xl outline-none text-xs font-mono tracking-wider focus:ring-2 focus:ring-teal-500/25 transition-all shadow-inner"
              />
              {passcodeError && (
                <p className="text-red-400 text-[10px] font-semibold font-mono mt-2 animate-bounce">
                  ❌ Incorrect passcode. Verification failed.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Initialize Controller Platform
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-850 flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-mono">
            <span>Static client-side sandbox privacy protocol</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 transition-all font-sans antialiased text-xs selection:bg-teal-150 selection:text-teal-900">

      {/* Top Professional Executive Banner */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-teal-600 p-1.5 rounded-lg text-white animate-pulse">
                  <Cpu className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] tracking-widest uppercase font-mono text-teal-400 font-bold">
                  Central Railway • Electric Loco Shed, Kalyan (ELS/KYN)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-sans mt-1">
                CAMC & Material Contracts Live Controller
              </h1>
              <p className="text-slate-400 text-xxs mt-1 flex items-center gap-2">
                <span>Spreadsheet Integration: <strong className="text-emerald-400 font-medium">{sourceName}</strong></span>
                <span>•</span>
                <span>Contracts count: <strong className="text-white">{contracts.length} records</strong></span>
              </p>
            </div>

            {/* Header Right Controllers */}
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xxs flex items-center gap-1.5 cursor-pointer transition-colors"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{darkMode ? 'Light UI' : 'Dark Space'}</span>
              </button>

              <button
                onClick={handlePrintClick}
                className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xxs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Export current view as formatted PDF"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export PDF / Print</span>
              </button>

              <button
                onClick={() => setShowSyncPanel(!showSyncPanel)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xxs px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Database className="w-3.5 h-3.5" />
                {showSyncPanel ? 'Hide Sync Center' : 'Sync Google Sheet'}
              </button>

              <button
                onClick={handleResetToDefault}
                className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xxs flex items-center gap-2 cursor-pointer transition-colors"
                title="Reset local changes"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Print Helper Toast */}
      {showPrintNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 no-print">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900/80 dark:to-slate-850/80 border border-blue-200/60 dark:border-indigo-950 p-4 rounded-xl shadow-xs flex items-start gap-3">
            <div className="bg-blue-100 dark:bg-blue-950/80 p-2 rounded-lg shrink-0">
              <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Opening PDF Export Dialog...
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-xxs leading-relaxed">
                ℹ️ <strong>Heads up:</strong> Since this app runs in a sandboxed preview frame, some web browsers block print dialog commands from triggering inside the frame, or truncate content.
                For a perfect, full-width, clean vector PDF printout, please click the <strong>"Open in new tab"</strong> button in the top-right corner of the player header first, then export there!
              </p>
              <button
                onClick={() => setShowPrintNotice(false)}
                className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-bold cursor-pointer pt-0.5 block"
              >
                Dismiss Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Animated Google Sheets Sync Center Section */}
        {showSyncPanel && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <SheetsSync
              onDataLoaded={handleDataLoaded}
              currentSource={sourceName}
              rowCount={contracts.length}
            />
          </div>
        )}

        {/* Dashboard Quick Switch Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
          <div className="flex p-1 bg-slate-200/70 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium gap-1 text-xs max-w-lg flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentTab === 'analytics' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Interactive Analytics
            </button>
            <button
              onClick={() => setCurrentTab('register')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentTab === 'register' ? 'bg-white dark:bg-slate-905 text-slate-900 dark:text-white shadow-sm font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Table className="w-3.5 h-3.5" />
              Contracts Register
            </button>
            <button
              onClick={() => setCurrentTab('billing')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentTab === 'billing' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Bill Status Matrix
            </button>
            <button
              onClick={() => setCurrentTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${currentTab === 'matrix' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              GCC Control Matrix
            </button>
          </div>

          <div className="flex items-center gap-2 text-xxs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl">
              <ShieldCheck className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
              Financial Audit Aligned
            </span>
            <span className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Calendar className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
              Shed Year: 2026/27
            </span>
          </div>
        </div>

        {/* Dynamic Display of active Filters on Dashboard */}
        {(filters.section !== 'All' || filters.supervisor !== 'All' || filters.classificationType !== 'All' || filters.workStatus !== 'All') && (
          <div className="p-3 bg-teal-50 border border-teal-100/80 rounded-xl flex items-center justify-between text-teal-900 text-xs font-medium">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="uppercase text-[9px] font-bold tracking-wider font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded">Active Filter Tunnel:</span>
              {filters.section !== 'All' && <span className="bg-white border border-teal-200 px-2.5 py-1 rounded-lg">Section: <strong className="text-teal-955">{filters.section}</strong></span>}
              {filters.supervisor !== 'All' && <span className="bg-white border border-teal-200 px-2.5 py-1 rounded-lg">Supervisor: <strong className="text-teal-955">{filters.supervisor}</strong></span>}
              {filters.classificationType !== 'All' && <span className="bg-white border border-teal-200 px-2.5 py-1 rounded-lg">Type: <strong className="text-teal-955">{filters.classificationType}</strong></span>}
              {filters.workStatus !== 'All' && <span className="bg-white border border-teal-200 px-2.5 py-1 rounded-lg">Status: <strong className="text-teal-955">{filters.workStatus}</strong></span>}
            </div>

            <button
              onClick={handleClearFilters}
              className="text-xxs px-2.5 py-1 hover:bg-teal-100 rounded-lg text-teal-800 font-bold border border-teal-200 transition-colors cursor-pointer"
            >
              Clear Filter State
            </button>
          </div>
        )}

        {/* Main Tab Rendering */}
        <div className="space-y-6">
          {currentTab === 'analytics' ? (
            <AnalyticsDashboard
              contracts={contracts}
              onSelectContract={setSelectedContract}
              onFilterSection={handleFilterSection}
              onFilterSupervisor={handleFilterSupervisor}
              onFilterClassification={handleFilterClassification}
              darkMode={darkMode}
            />
          ) : currentTab === 'register' ? (
            <div id="contracts-data-grid">
              <ContractsTable
                contracts={contracts}
                onSelectContract={setSelectedContract}
                filters={filters}
                onReplaceFilters={handleReplaceFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
          ) : currentTab === 'billing' ? (
            <BillingMatrix
              contracts={contracts}
              onSelectContract={setSelectedContract}
              darkMode={darkMode}
            />
          ) : (
            <ControlMatrix
              contracts={contracts}
              onSelectContract={setSelectedContract}
              darkMode={darkMode}
            />
          )}
        </div>

      </main>

      {/* Slide briefings detailing popups */}
      <ContractDetails
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
      />

      <footer className="bg-white border-t border-slate-100 text-slate-400 py-8 text-center text-xxs font-mono mt-12">
        <div className="max-w-7xl mx-auto px-4 divide-y divide-slate-100 space-y-4">
          <p className="leading-relaxed text-slate-500">
            💻 ELS/KYN Contracts Controller Platform • Built securely using React, Google Sheets API Integration, and Tailwind v4.
            <br />
            Designed for supervising Static Inverters, Hotel Loads, Brake Systems, and Traction Motor rehabilitation portfolios.
          </p>
          <p className="pt-4 text-slate-400">
            For operational assistance, contact section chief at Electric Loco Shed Kalyan, Central Railway.
          </p>
        </div>
      </footer>
    </div>
  );
}
