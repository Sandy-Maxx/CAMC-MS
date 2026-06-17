import React, { useState, useMemo } from 'react';
import { Contract, DashboardFilters } from '../types';
import { 
  Search, Filter, ArrowUpDown, ChevronRight, AlertCircle, CheckCircle2, HelpCircle,
  FileSpreadsheet, Sparkles, User, UserCheck, Calendar, IndianRupee, Layers,
  Clipboard, Check
} from 'lucide-react';

interface ContractsTableProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  filters: DashboardFilters;
  onReplaceFilters: (newFilters: Partial<DashboardFilters>) => void;
  onClearFilters: () => void;
}

export default function ContractsTable({
  contracts,
  onSelectContract,
  filters,
  onReplaceFilters,
  onClearFilters
}: ContractsTableProps) {
  const [sortField, setSortField] = useState<keyof Contract>('totalContractValueNumeric');
  const [sortAscending, setSortAscending] = useState(false);
  const [copiedStyled, setCopiedStyled] = useState(false);

  const handleCopyStyledTableForSheets = async () => {
    try {
      let html = `<table style="border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; width: 100%; color: #334155;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; text-align: left; font-weight: bold;">
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Section</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Work/Contract Description</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">LOA Ref & Date</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Contractor Firm</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Total Contract Value</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">Physical Progress</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">Financial Paid</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">Work Status</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Supervisor</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Key Remarks / Updates</th>
          </tr>
        </thead>
        <tbody>`;

      processedContracts.forEach(c => {
        let statusBg = '#ffffff';
        let statusColor = '#334155';
        if (c.workStatus === 'Completed') {
          statusBg = '#f0fdf4';
          statusColor = '#15803d';
        } else if (c.workStatus === 'In Progress') {
          statusBg = '#eff6ff';
          statusColor = '#1d4ed8';
        } else {
          statusBg = '#fafafa';
          statusColor = '#64748b';
        }

        html += `
          <tr>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #f1f5f9;">${c.section}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${c.workName}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: #64748b;">${c.loaNumberAndDate}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: #334155;">${c.firmName}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; font-weight: bold; background-color: #fafafa; font-family: monospace;">${c.totalContractValue}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: #0d9488; font-weight: bold; text-align: center;">${c.physicalProgress}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: #2563eb; font-weight: bold; text-align: center;">${c.financialProgress}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; background-color: ${statusBg}; color: ${statusColor}; font-weight: bold; text-align: center;">${c.workStatus}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: #475569;">${c.supervisor}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: #334155;">${c.remarks}</td>
          </tr>`;
      });

      html += `</tbody></table>`;

      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([processedContracts.map(c => `${c.section}\t${c.workName}\t${c.totalContractValue}\t${c.physicalProgress}\t${c.financialProgress}\t${c.workStatus}`).join('\n')], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);

      setCopiedStyled(true);
      setTimeout(() => setCopiedStyled(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Derive unique lists for filters
  const filterOptions = useMemo(() => {
    const sections = new Set<string>();
    const supervisors = new Set<string>();
    const classifications = new Set<string>();
    const billingStatuses = new Set<string>();
    const proposalStatuses = new Set<string>();

    contracts.forEach(c => {
      if (c.section) sections.add(c.section.trim());
      if (c.supervisor) supervisors.add(c.supervisor.trim());
      if (c.classificationType) classifications.add(c.classificationType.trim());
      if (c.pendingBillStatus) billingStatuses.add(c.pendingBillStatus.trim());
      if (c.newProposalStatus) proposalStatuses.add(c.newProposalStatus.trim());
    });

    return {
      sections: Array.from(sections).sort(),
      supervisors: Array.from(supervisors).sort(),
      classifications: Array.from(classifications).sort(),
      billingStatuses: Array.from(billingStatuses).sort(),
      proposalStatuses: Array.from(proposalStatuses).sort()
    };
  }, [contracts]);

  // Handle Sort Toggle
  const handleSort = (field: keyof Contract) => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(false);
    }
  };

  // Perform Filter & Search & Sort matching
  const processedContracts = useMemo(() => {
    let result = contracts.filter(c => {
      // 1. Search Query Match
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const mainMatch = c.workName.toLowerCase().includes(query) ||
          c.firmName.toLowerCase().includes(query) ||
          c.loaNumberAndDate.toLowerCase().includes(query) ||
          c.remarks.toLowerCase().includes(query) ||
          (c.remarksRefined && c.remarksRefined.toLowerCase().includes(query));
        
        if (!mainMatch) return false;
      }

      // 2. Section Filter Match
      if (filters.section && filters.section !== 'All') {
        if (c.section !== filters.section) return false;
      }

      // 3. Supervisor Filter Match
      if (filters.supervisor && filters.supervisor !== 'All') {
        if (c.supervisor !== filters.supervisor) return false;
      }

      // 4. Status Filter Match
      if (filters.workStatus && filters.workStatus !== 'All') {
        if (c.workStatus !== filters.workStatus) return false;
      }

      // 5. Classification Filter Match
      if (filters.classificationType && filters.classificationType !== 'All') {
        if (c.classificationType !== filters.classificationType) return false;
      }

      // 6. Pending Bill Status Match
      if (filters.pendingBillStatus && filters.pendingBillStatus !== 'All') {
        if (c.pendingBillStatus !== filters.pendingBillStatus) return false;
      }

      // 7. Proposal Status Match
      if (filters.newProposalStatus && filters.newProposalStatus !== 'All') {
        if (c.newProposalStatus !== filters.newProposalStatus) return false;
      }

      return true;
    });

    // Sort Result
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle undefined/nulls safely
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      // Handle strings vs numbers comparison
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAscending 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAscending 
          ? valA - valB 
          : valB - valA;
      }
      return 0;
    });

    return result;
  }, [contracts, filters, sortField, sortAscending]);

  // Clean raw and numerical progress labels
  const formatIndianCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="glass-card mt-6">
      {/* Search and Filters Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Work Name, LOA, Firm, Supervisor or Remarks..."
              value={filters.searchQuery}
              onChange={(e) => onReplaceFilters({ searchQuery: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Actions / Reset */}
            {(filters.section !== 'All' || filters.supervisor !== 'All' || filters.workStatus !== 'All' || filters.classificationType !== 'All' || filters.searchQuery || filters.pendingBillStatus !== 'All' || filters.newProposalStatus !== 'All') && (
              <button
                onClick={onClearFilters}
                className="text-xxs px-3 py-2 border border-dashed border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}

            <div className="p-1 px-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xxs font-mono flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Matched: {processedContracts.length} of {contracts.length} records</span>
            </div>

            <button
              onClick={handleCopyStyledTableForSheets}
              className={`p-2 px-3 text-xxs font-mono font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border ${
                copiedStyled 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400' 
                  : 'bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-900/30'
              }`}
              title="Copy active register table with rich styling, borders, colors, and headers so pasting into Excel or Google Sheets is pixel-perfect."
            >
              {copiedStyled ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" /> : <Clipboard className="w-3.5 h-3.5" />}
              <span>{copiedStyled ? 'Styled Copy Ready!' : 'Copy Styled Sheets Table'}</span>
            </button>
          </div>
        </div>

        {/* Filters Multi-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* Section Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Section</label>
            <select
              value={filters.section}
              onChange={(e) => onReplaceFilters({ section: e.target.value })}
              className="w-full text-xxs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            >
              <option value="All">All Sections</option>
              {filterOptions.sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Supervisor Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Supervisor</label>
            <select
              value={filters.supervisor}
              onChange={(e) => onReplaceFilters({ supervisor: e.target.value })}
              className="w-full text-xxs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            >
              <option value="All">All Supervisors</option>
              {filterOptions.supervisors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Classification Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Work Type</label>
            <select
              value={filters.classificationType}
              onChange={(e) => onReplaceFilters({ classificationType: e.target.value })}
              className="w-full text-xxs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            >
              <option value="All">All Types</option>
              {filterOptions.classifications.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Work Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Work Status</label>
            <select
              value={filters.workStatus}
              onChange={(e) => onReplaceFilters({ workStatus: e.target.value })}
              className="w-full text-xxs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>

          {/* Pending Bill Status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Billing Status</label>
            <select
              value={filters.pendingBillStatus}
              onChange={(e) => onReplaceFilters({ pendingBillStatus: e.target.value })}
              className="w-full text-xxs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            >
              <option value="All">All Billing Bills</option>
              {filterOptions.billingStatuses.filter(b=>b).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Proposal status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Proposal Status</label>
            <select
              value={filters.newProposalStatus}
              onChange={(e) => onReplaceFilters({ newProposalStatus: e.target.value })}
              className="w-full text-xxs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-teal-600 font-semibold"
            >
              <option value="All">All Proposals</option>
              {filterOptions.proposalStatuses.filter(p=>p).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Datagrid */}
      <div className="overflow-x-auto mt-6 rounded-xl border border-slate-100">
        <table className="w-full border-collapse text-left text-xs text-slate-500">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100 font-mono">
            <tr>
              <th className="px-4 py-3 pl-5">Section</th>
              <th className="px-4 py-3 cursor-pointer select-none hover:text-black hover:bg-slate-100/60 transition-colors" onClick={() => handleSort('workName')}>
                <div className="flex items-center gap-1.5">
                  Work Name & Contractor
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:text-black hover:bg-slate-100/60 transition-colors" onClick={() => handleSort('totalContractValueNumeric')}>
                <div className="flex items-center gap-1.5">
                  Value (INR)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3">Quantities Done / Bal</th>
              <th className="px-4 py-3 cursor-pointer select-none hover:text-black hover:bg-slate-100/60 transition-colors" onClick={() => handleSort('physicalProgressNumeric')}>
                <div className="flex items-center gap-1.5">
                  Progress (Phy vs Fin)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="px-4 py-3">Billing & Proposal Status</th>
              <th className="px-4 py-3 pr-5 text-right">More</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100 font-sans">
            {processedContracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400 bg-slate-50/50">
                  <div className="max-w-md mx-auto">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700 text-sm">No contract matches are found.</p>
                    <p className="text-xxs text-slate-500 mt-1">Try relaxing your filter selectors, deleting character filters in the search text box, or resetting filters entirely.</p>
                    <button
                      onClick={onClearFilters}
                      className="mt-4 px-4 py-2 bg-slate-900 text-white font-semibold text-xxs rounded-xl hover:bg-black transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              processedContracts.map((c) => {
                // Classify color classes based on Section types
                const sectionColorMap: Record<string, string> = {
                  PEX: 'bg-teal-50 text-teal-800 border-teal-100',
                  BODY: 'bg-pink-50 text-pink-800 border-pink-100',
                  ACE: 'bg-emerald-50 text-emerald-800 border-emerald-100',
                  LAB: 'bg-violet-50 text-violet-800 border-violet-100',
                  ART: 'bg-rose-50 text-rose-800 border-rose-100',
                  PNE: 'bg-blue-50 text-blue-800 border-blue-100',
                  TM: 'bg-amber-50 text-amber-800 border-amber-100',
                  AUX: 'bg-indigo-50 text-indigo-800 border-indigo-100',
                  BOGIE: 'bg-cyan-50 text-cyan-800 border-cyan-100',
                  MW: 'bg-purple-50 text-purple-800 border-purple-100',
                  STORE: 'bg-slate-100 text-slate-800 border-slate-200',
                  'I&E': 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-100',
                  TOOLS: 'bg-orange-50 text-orange-800 border-orange-100',
                };
                
                const secClass = sectionColorMap[c.section.toUpperCase()] || 'bg-slate-50 text-slate-700 border-slate-200';
                
                // Risk Indicator: physical is significantly faster than financial
                const hasBillingRisk = (c.physicalProgressNumeric - c.financialProgressNumeric) >= 15 && c.workStatus !== 'Not Started';

                return (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-50/70 transition-colors group/row cursor-pointer"
                    onClick={() => onSelectContract(c)}
                  >
                    {/* Section Badge */}
                    <td className="px-4 py-3.5 pl-5">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border font-mono ${secClass}`}>
                        {c.section}
                      </span>
                    </td>

                    {/* Work Name & Firm Name */}
                    <td className="px-4 py-3.5 max-w-md whitespace-normal break-words">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 text-[11px] leading-snug group-hover/row:text-slate-950 dark:group-hover/row:text-white transition-colors" title={c.workName}>
                        {c.workName}
                      </div>
                      <div className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 whitespace-normal break-words" title={c.firmName}>
                        by <strong className="text-slate-600 dark:text-slate-300 font-medium">{c.firmName}</strong>
                      </div>
                      <div className="flex gap-2 items-center mt-1 text-[9px] font-medium font-mono text-slate-400">
                        <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          Supervisor: <strong className="text-slate-600">{c.supervisor}</strong>
                        </span>
                        <span>•</span>
                        <span>{c.classificationType}</span>
                      </div>
                    </td>

                    {/* Numeric value formatted */}
                    <td className="px-4 py-3.5 font-semibold text-slate-800 font-mono text-xxs">
                      {formatIndianCurrency(c.totalContractValueNumeric)}
                    </td>

                    {/* Quantities Done / Bal */}
                    <td className="px-4 py-3.5 text-xxs">
                      {c.contractQty ? (
                        <div>
                          <div className="font-semibold text-slate-700">
                            Done: {c.qtyDoneTillDate || '0'} / {c.contractQty}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Unit: {c.contractQtyUnit || 'Months'} • Bal: <span className="font-mono text-amber-700 font-semibold">{c.qtyBalance || '0'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">Lump sum</span>
                      )}
                    </td>

                    {/* Progress indicators bar physical vs financial */}
                    <td className="px-4 py-3.5 w-44">
                      <div className="space-y-1.5">
                        {/* Physical progress indicator */}
                        <div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mb-0.5">
                            <span>Phy Done</span>
                            <span className="font-semibold text-slate-700">{c.physicalProgress}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-teal-600 h-full rounded-full" style={{ width: `${c.physicalProgressNumeric}%` }} />
                          </div>
                        </div>

                        {/* Financial clearance index */}
                        <div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mb-0.5">
                            <span>Fin Paid</span>
                            <span className="font-semibold text-slate-700">{c.financialProgress}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${c.financialProgressNumeric}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Billing Risk Badge & Proposal Status */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        {c.pendingBillStatus ? (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${hasBillingRisk ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {hasBillingRisk && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                              {c.pendingBillStatus}
                            </span>
                          </div>
                        ) : null}
                        
                        {c.newProposalStatus ? (
                          <div className="text-[9px] text-slate-400 leading-none">
                            Proposal: <strong className="text-slate-600 font-semibold">{c.newProposalStatus}</strong>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Drawer activation caret */}
                    <td className="px-4 py-3.5 text-right pr-5">
                      <div className="inline-flex p-1 bg-slate-50 rounded-lg text-slate-400 group-hover/row:bg-slate-900 group-hover/row:text-white transition-all">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
