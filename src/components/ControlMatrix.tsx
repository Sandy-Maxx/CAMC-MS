import React, { useMemo, useState } from 'react';
import { Contract } from '../types';
import { 
  ShieldAlert, Clock, Layers, CheckSquare, Calendar, Search, Filter, 
  HelpCircle, ArrowUpRight, CheckCircle2, ChevronRight, FileSpreadsheet, Clipboard, AlertTriangle
} from 'lucide-react';

interface ControlMatrixProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  darkMode?: boolean;
}

export default function ControlMatrix({ contracts, onSelectContract, darkMode = false }: ControlMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'All' | 'Extension' | 'Variation' | 'Completion' | 'Critical'>('All');
  const [copiedStyled, setCopiedStyled] = useState(false);

  // Model SOP 2018 Approximate Approving Authorities for Works Matters (Part A)
  // Clause 9 (Variations), Clause 10 (Extension of Time)
  const getApprovingAuthority = (val: number) => {
    if (val <= 20000000) { // Up to ₹2 Crore (200 Lakhs)
      return { level: 'JAG', title: 'Sr. DEE / JAG Divisional Officer' };
    } else if (val <= 200000000) { // Up to ₹20 Crore (2000 Lakhs)
      return { level: 'SAG', title: 'ADRM / DRM (SAG)' };
    } else {
      return { level: 'HAG/PHOD', title: 'PCEE (HAG/PHOD) / General Manager (GM)' };
    }
  };

  // Parse custom dates safely for railway formats (e.g., "7-Oct-2024", "4-Jun-2021")
  const parseShedDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(/[-/]/);
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(year)) return null;

    const monthsMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    let month = monthsMap[monthStr.substring(0, 3)];
    if (month === undefined) {
      month = parseInt(monthStr, 10) - 1;
    }
    
    if (isNaN(month)) return null;
    return new Date(year, month, day);
  };

  // Convert contract formatting string (e.g. "₹42,48,011.00") to formatted representation
  const formatIndianCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  // Process and analyze contracts for decision milestones
  const analyzedContracts = useMemo(() => {
    const today = new Date('2026-06-17'); // Hardcode current simulation anchor date 2026-06-17

    return contracts.map(c => {
      const activeEndDateStr = c.extendedUpto || c.endDate;
      const parsedEnd = parseShedDate(activeEndDateStr);
      
      const qtyDoneVal = parseFloat((c.qtyDoneTillDate || '0').replace(/,/g, ''));
      const qtyLimitVal = parseFloat((c.contractQty || '0').replace(/,/g, ''));
      const qtyPct = qtyLimitVal > 0 ? (qtyDoneVal / qtyLimitVal) * 100 : 0;

      const isCompleted = c.workStatus === 'Completed';
      const auth = getApprovingAuthority(c.totalContractValueNumeric);

      // Classifications & Rules
      let requiresExtension = false;
      let requiresVariation = false;
      let requiresCompletion = false;
      let severity: 'Critical' | 'Medium' | 'Low' = 'Low';
      let prescriptiveAction = 'Routine measurement entries are healthy.';
      let triggerReason = '';

      // 1. EXTENSION LOGIC 
      if (!isCompleted) {
        if (parsedEnd) {
          const daysLeft = Math.ceil((parsedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 0) {
            requiresExtension = true;
            severity = 'Critical';
            triggerReason = `Currency expired on ${activeEndDateStr} (${Math.abs(daysLeft)} days ago).`;
            prescriptiveAction = `🚨 [Rule: Target date elapsed] Register immediate extension under GCC Cl. 17-A / Cl. 10. Approving authority: ${auth.title} based on contract value (${formatIndianCurrency(c.totalContractValueNumeric)}).`;
          } else if (daysLeft <= 90) {
            requiresExtension = true;
            severity = 'Medium';
            triggerReason = `Term ending in ${daysLeft} days (${activeEndDateStr}).`;
            prescriptiveAction = `⏳ [Rule: Deadlines <= 90d] Initiate time extension request under GCC Clause 17-A. Sanction level: ${auth.title}.`;
          }
        }

        // Explicit 75%+ time & 75%- progress check
        if (c.timeElapsedNumeric >= 75 && c.physicalProgressNumeric < 75) {
          requiresExtension = true;
          triggerReason = `Progress lag: Elapsed ${c.timeElapsed} currency with only ${c.physicalProgress} execution.`;
          
          if (c.timeElapsedNumeric >= 95 || c.physicalProgressNumeric < 50) {
            severity = 'Critical';
            prescriptiveAction = `🚨 [Rule: Time ${c.timeElapsed} vs Prog ${c.physicalProgress} (under 50%)] Severe progress-time gap detected. Formulate critical Extension Case & Acceleration Plan under Model SOP Part A Cl. 10. Authority: ${auth.title}.`;
          } else {
            severity = 'Medium';
            prescriptiveAction = `⏳ [Rule: Time ${c.timeElapsed} vs Prog ${c.physicalProgress} (under 75%)] Progress lagging. Submit extension proposal to prevent currency lapse under GCC Cl. 17-A. Approving authority: ${auth.title}.`;
          }
        }
      }

      // 2. QUANTITY VARIATION LOGIC
      if (qtyLimitVal > 0 && !isCompleted) {
        if (qtyPct >= 100) {
          requiresVariation = true;
          severity = 'Critical';
          triggerReason = `LOA Quantity limit fully exhausted (${qtyPct.toFixed(0)}%).`;
          prescriptiveAction = `⚠️ [Rule: Qty Limit Exhausted] Stop excess measurement recording. Formulate physical Variation Statement under Model SOP 2018 Clause 9. Approved by: ${auth.title}.`;
        } else if (qtyPct >= 90) {
          requiresVariation = true;
          if (severity !== 'Critical') severity = 'Medium';
          triggerReason = `LOA Quantity is at ${qtyPct.toFixed(0)}% (almost exhausted).`;
          prescriptiveAction = `⚠️ [Rule: Qty > 90%] Review site requirements. File variation case under SOP Clause 9 for approval by ${auth.title} before overrun.`;
        }
      }

      // 3. COMPLETION & FINAL BILLING LOGIC
      if (isCompleted && c.financialProgressNumeric < 100) {
        requiresCompletion = true;
        if (severity !== 'Critical') severity = 'Medium';
        triggerReason = 'Work physically complete but financial settlement pending.';
        prescriptiveAction = `✅ [Rule: Complete Pending Audit] Physical execution 100% complete. Collate joint measurement records, prepare Final Bill, and release PG through ${auth.title} or division office.`;
      }

      return {
        ...c,
        activeEndDateStr,
        qtyPct,
        requiresExtension,
        requiresVariation,
        requiresCompletion,
        severity,
        prescriptiveAction,
        triggerReason
      };
    });
  }, [contracts]);

  // Aggregate stats
  const stats = useMemo(() => {
    let extensionCount = 0;
    let variationCount = 0;
    let completionCount = 0;
    let criticalCount = 0;

    analyzedContracts.forEach(ac => {
      if (ac.requiresExtension) extensionCount++;
      if (ac.requiresVariation) variationCount++;
      if (ac.requiresCompletion) completionCount++;
      if (ac.severity === 'Critical') criticalCount++;
    });

    return {
      extensionCount,
      variationCount,
      completionCount,
      criticalCount
    };
  }, [analyzedContracts]);

  // Filter application
  const filteredContracts = useMemo(() => {
    return analyzedContracts.filter(ac => {
      const matchSearch = ac.workName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ac.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ac.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ac.supervisor.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (actionFilter === 'All') return true;
      if (actionFilter === 'Extension') return ac.requiresExtension;
      if (actionFilter === 'Variation') return ac.requiresVariation;
      if (actionFilter === 'Completion') return ac.requiresCompletion;
      if (actionFilter === 'Critical') return ac.severity === 'Critical';

      return true;
    });
  }, [analyzedContracts, searchTerm, actionFilter]);

  // Table Copy for Google Sheets
  const handleCopyActionMatrixForSheets = async () => {
    try {
      let html = `<table style="border-collapse: collapse; font-family: sans-serif; font-size: 11px; width: 100%; color: #334155;">
        <thead>
          <tr style="background-color: #1e293b; color: #ffffff; font-weight: bold; text-align: left;">
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Section</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Work Contract Description</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Target Date / Extension</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Qty Execution</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Severity</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Prescribed Administrative Course & Action Item</th>
          </tr>
        </thead>
        <tbody>`;

      filteredContracts.forEach(c => {
        let rowColor = '#ffffff';
        let sevColor = '#15803d';
        if (c.severity === 'Critical') {
          rowColor = '#fff5f5';
          sevColor = '#ef4444';
        } else if (c.severity === 'Medium') {
          rowColor = '#fffbeb';
          sevColor = '#d97706';
        }

        html += `<tr style="background-color: ${rowColor};">
          <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">${c.section}</td>
          <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold;">${c.workName}</td>
          <td style="padding: 8px 6px; border: 1px solid #e2e8f0;">${c.activeEndDateStr}</td>
          <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-family: monospace;">Done: ${c.qtyDoneTillDate || '0'} / Limit: ${c.contractQty} (${c.qtyPct.toFixed(1)}%)</td>
          <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: ${sevColor}; font-weight: bold;">${c.severity}</td>
          <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: 500;">${c.prescriptiveAction}</td>
        </tr>`;
      });

      html += `</tbody></table>`;

      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([filteredContracts.map(c => `${c.section}\t${c.workName}\t${c.severity}\t${c.prescriptiveAction}`).join('\n')], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);

      setCopiedStyled(true);
      setTimeout(() => setCopiedStyled(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Could not copy action matrix. Copying permission may be blocked in iframe.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Instruction & Control Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm border border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-teal-400 font-mono uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-teal-400" />
              Railway GCC Administration Console
            </h3>
            <p className="text-lg font-bold tracking-tight">Extension, Deviation & Contract Quantity Variation Control</p>
            <p className="text-slate-400 text-xxs max-w-2xl leading-relaxed">
              Maintains time currency integrity and quantity limit boundaries according to Indian Railway General Conditions of Contract (GCC). Automatically tracks overdue certificates, pending sanction notices, and prescribes administrative remedies.
            </p>
          </div>

          <div className="self-start md:self-center">
            <button
              onClick={handleCopyActionMatrixForSheets}
              className={`text-xxs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                copiedStyled 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white hover:bg-slate-100 text-slate-900'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              {copiedStyled ? 'Styled Matrix Copied!' : 'Copy Matrix for Sheets (Styled)'}
            </button>
          </div>
        </div>

        {/* Action KPIs Summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6 border-t border-slate-800/80 pt-6">
          <div 
            onClick={() => setActionFilter('Critical')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:scale-102 hover:bg-slate-900/60 hover:border-red-500/60 duration-150 ${
              actionFilter === 'Critical' 
                ? 'ring-2 ring-red-500 bg-slate-950 border-red-500' 
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Critical Risk Actions</span>
            <span className="text-xl font-bold mt-1 block text-red-400">
              {stats.criticalCount} issues
            </span>
            <span className="text-[9px] text-slate-500 block">Immediate sanction/letter required</span>
          </div>

          <div 
            onClick={() => setActionFilter('Extension')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:scale-102 hover:bg-slate-900/60 hover:border-amber-500/60 duration-150 ${
              actionFilter === 'Extension' 
                ? 'ring-2 ring-amber-500 bg-slate-950 border-amber-500' 
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            <span className="text-[10px] text-slate-400 block uppercase font-mono font-mono">Currency Extension Remedation</span>
            <span className="text-xl font-bold mt-1 block text-amber-400">
              {stats.extensionCount} contracts
            </span>
            <span className="text-[9px] text-slate-500 block">Term ended or ending within 90d</span>
          </div>

          <div 
            onClick={() => setActionFilter('Variation')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:scale-102 hover:bg-slate-900/60 hover:border-teal-500/60 duration-150 ${
              actionFilter === 'Variation' 
                ? 'ring-2 ring-teal-500 bg-slate-950 border-teal-500' 
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Quantity Variations Detected</span>
            <span className="text-xl font-bold text-teal-400 mt-1 block">
              {stats.variationCount} works
            </span>
            <span className="text-[9px] text-slate-500 block">LOA Qty limit exhausted &gt;90%</span>
          </div>

          <div 
            onClick={() => setActionFilter('Completion')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:scale-102 hover:bg-slate-900/60 hover:border-blue-500/60 duration-150 ${
              actionFilter === 'Completion' 
                ? 'ring-2 ring-blue-500 bg-slate-950 border-blue-500' 
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Completed Pending Release</span>
            <span className="text-xl font-bold text-blue-400 mt-1 block">
              {stats.completionCount} works
            </span>
            <span className="text-[9px] text-slate-500 block">Physical complete, 105% bills pending</span>
          </div>

          <div 
            onClick={() => setActionFilter('All')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:scale-102 hover:bg-slate-900/60 hover:border-slate-400 duration-150 ${
              actionFilter === 'All' 
                ? 'ring-2 ring-indigo-400 bg-slate-950 border-slate-600' 
                : 'bg-slate-950/40 border-slate-800/80'
            }`}
          >
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Monitored Works</span>
            <span className="text-xl font-bold text-indigo-300 mt-1 block">
              {contracts.length} contracts
            </span>
            <span className="text-[9px] text-slate-500 block">Live active pipeline coverage</span>
          </div>
        </div>
      </div>

      {/* Grid of Action Entries */}
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-5 border-b border-slate-100/40 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Live Extension/Variation Action Matrix</h4>
            <p className="text-xxs text-slate-500 dark:text-slate-400">Prescriptive measures matching each ELS/KYN folder portfolio</p>
          </div>

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-405 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search works, contractor, supervisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xxs outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="inline-flex rounded-xl bg-slate-50 dark:bg-slate-950 p-1 font-mono text-[10px] font-medium border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setActionFilter('All')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${actionFilter === 'All' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All ({contracts.length})
              </button>
              <button 
                onClick={() => setActionFilter('Critical')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${actionFilter === 'Critical' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Critical ({stats.criticalCount})
              </button>
              <button 
                onClick={() => setActionFilter('Extension')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${actionFilter === 'Extension' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Extensions ({stats.extensionCount})
              </button>
              <button 
                onClick={() => setActionFilter('Variation')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${actionFilter === 'Variation' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Qty Variations ({stats.variationCount})
              </button>
              <button 
                onClick={() => setActionFilter('Completion')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${actionFilter === 'Completion' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Completions ({stats.completionCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-805 mt-4">
          <table className="w-full border-collapse text-left text-xs text-slate-505 dark:text-slate-300">
            <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-mono uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 pl-5">Section & Contract Details</th>
                <th className="px-4 py-3">Time Currency & Deadlines</th>
                <th className="px-4 py-3">Execution Quantities</th>
                <th className="px-4 py-3 text-center">Severity</th>
                <th className="px-4 py-3">Prescribed GCC Course of Action</th>
                <th className="px-4 py-3 pr-5 text-right">More</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-105/60 dark:divide-slate-810/60">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 bg-slate-50/20 dark:bg-slate-950/20">
                    No contracts matched the selected control parameter filter of ELS/KYN.
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => {
                  let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
                  if (c.severity === 'Critical') {
                    badgeColor = 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-bold';
                  } else if (c.severity === 'Medium') {
                    badgeColor = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 font-bold';
                  }

                  return (
                    <tr 
                      key={c.id}
                      onClick={() => onSelectContract(c)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-905/30 transition-colors group cursor-pointer border-b border-slate-100 dark:border-slate-810/30"
                    >
                      {/* Section badge / work name wrapped */}
                      <td className="px-4 py-4 pl-5 max-w-sm">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-900 text-teal-400 border border-slate-800">
                            {c.section}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-indigo-900 text-indigo-300">
                            {c.classificationType}
                          </span>
                        </div>
                        <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 block break-words">
                          {c.workName}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Firm: <strong className="text-slate-600 dark:text-slate-300 font-medium">{c.firmName}</strong> • Supervisor: <strong className="text-slate-600 dark:text-slate-350 font-medium">{c.supervisor}</strong>
                        </span>
                      </td>

                      {/* Time Currency */}
                      <td className="px-4 py-4 text-xxs font-mono">
                        <div className="space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>Time Elapsed:</span>
                            <span className={c.timeElapsedNumeric > 100 ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {c.timeElapsed}
                            </span>
                          </div>
                          <div className="w-28 bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${c.timeElapsedNumeric > 100 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                              style={{ width: `${Math.min(100, c.timeElapsedNumeric)}%` }} 
                            />
                          </div>
                          <div className="text-[9px] text-slate-400">
                            Target End: <span className="font-bold text-slate-700 dark:text-slate-300">{c.activeEndDateStr}</span>
                          </div>
                        </div>
                      </td>

                      {/* Quantities Done vs Sanction */}
                      <td className="px-4 py-4 text-xxs font-mono">
                        <div className="space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>Sanction Limit:</span>
                            <span className={c.qtyPct >= 100 ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {c.qtyPct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-28 bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${c.qtyPct >= 100 ? 'bg-red-500' : c.qtyPct >= 90 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                              style={{ width: `${Math.min(100, c.qtyPct)}%` }} 
                            />
                          </div>
                          <div className="text-[9px] text-slate-450 dark:text-slate-400">
                            Done: <span className="font-bold text-slate-700 dark:text-slate-300">{c.qtyDoneTillDate || '0'}</span> / Unit: {c.contractQtyUnit || 'Qty'}
                          </div>
                        </div>
                      </td>

                      {/* Severity badge */}
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[9px] uppercase font-mono tracking-wider font-semibold ${badgeColor}`}>
                          {c.severity}
                        </span>
                      </td>

                      {/* Prescriptive action text */}
                      <td className="px-4 py-4 max-w-sm">
                        <p className="text-[10px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed font-sans">
                          {c.prescriptiveAction}
                        </p>
                      </td>

                      {/* More info cell button */}
                      <td className="px-4 py-4 text-right pr-5">
                        <button 
                          className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-150 hover:text-white dark:hover:text-black hover:shadow-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xxs font-medium font-mono cursor-pointer transition-all"
                          onClick={() => onSelectContract(c)}
                        >
                          BRIEFING
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
