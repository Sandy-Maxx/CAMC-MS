import React, { useMemo, useState } from 'react';
import { Contract } from '../types';
import { 
  FileSpreadsheet, Clipboard, Download, CheckCircle2, AlertTriangle, Clock, 
  HelpCircle, Search, DollarSign, ArrowUpRight, Layers, FileText, Ban, Sparkles, Filter, Check
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LabelList
} from 'recharts';

interface BillingMatrixProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  darkMode?: boolean;
}

export default function BillingMatrix({ contracts, onSelectContract, darkMode = false }: BillingMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [billingFilter, setBillingFilter] = useState('All');
  const [copiedStyled, setCopiedStyled] = useState(false);

  const gridStroke = darkMode ? '#1e293b' : '#f1f5f9';
  const labelColor = darkMode ? '#cbd5e1' : '#475569';
  const valLabelColor = darkMode ? '#38bdf8' : '#334155';

  // Format currency
  const formatIndianCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  // Group contracts by their Billing State
  const billingStats = useMemo(() => {
    let totalRetentionValue = 0;
    let pendingPreparation = 0;
    let passedWithGaps = 0;
    let bgPending = 0;

    contracts.forEach(c => {
      const bill = (c.pendingBillStatus || '').toLowerCase();
      const remarks = (c.remarks || '').toLowerCase();
      
      if (bill.includes('preparation') || bill.includes('prepaired')) {
        pendingPreparation++;
      }
      if (bill.includes('bg') || bill.includes('bank') || remarks.includes('bg') || remarks.includes('guarantee')) {
        bgPending++;
      }
      if (c.physicalProgressNumeric - c.financialProgressNumeric >= 15) {
        passedWithGaps++;
        // Approximate the outstanding balance value
        const unbilledProgress = (c.physicalProgressNumeric - c.financialProgressNumeric) / 100;
        totalRetentionValue += c.totalContractValueNumeric * Math.max(0, unbilledProgress);
      }
    });

    return {
      totalRetentionValue,
      pendingPreparation,
      passedWithGaps,
      bgPending
    };
  }, [contracts]);

  // Dynamic compact formatter for Indian Currency
  const formatIndianCompact = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)} K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  // 1. Chart statistics: Dynamic billing donut categories from 'pendingBillStatus' column
  const billingStagesChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    contracts.forEach(c => {
      let status = (c.pendingBillStatus || '').trim();
      if (!status || status === '-' || status.toLowerCase() === 'nil' || status.toLowerCase() === 'none') {
        status = 'Cleared / Invoiced';
      }
      counts[status] = (counts[status] || 0) + 1;
      total++;
    });

    const colors = [
      '#0d9488', // teal
      '#2563eb', // blue
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#ec4899', // pink
      '#10b981', // emerald
      '#6366f1', // indigo
      '#f43f5e', // rose
    ];

    return Object.entries(counts)
      .map(([name, value], idx) => ({
        name,
        value,
        percent: ((value / total) * 100).toFixed(1),
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [contracts]);

  // 2. Unbilled Liability metrics by Shed Section: ALL available sections with RAW numerical Rupees
  const unbilledValueBySectionData = useMemo(() => {
    const map: Record<string, number> = {};
    contracts.forEach(c => {
      const sec = c.section || 'General';
      const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
      if (gap > 0 && c.workStatus !== 'Not Started') {
        const unbilledFactor = gap / 100;
        const unbilledVal = c.totalContractValueNumeric * unbilledFactor;
        map[sec] = (map[sec] || 0) + unbilledVal;
      }
    });

    return Object.entries(map).map(([section, value]) => ({
      section,
      value: parseFloat(value.toFixed(2)) // Raw values in Rupees
    })).sort((a, b) => b.value - a.value); // Removed .slice(0, 8) to show ALL available sections!
  }, [contracts]);

  // Handle formatted copy of HTML table
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
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1; text-align: center;">Variance Gap</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Billing Status</th>
            <th style="padding: 10px 8px; border: 1px solid #cbd5e1;">Assigned Supervisor</th>
          </tr>
        </thead>
        <tbody>`;

      filteredContracts.forEach(c => {
        const variance = c.physicalProgressNumeric - c.financialProgressNumeric;
        const isGapAlert = variance >= 15 && c.workStatus !== 'Not Started';
        
        let gapBg = '#ffffff';
        let statusBg = '#f8fafc';
        let statusColor = '#475569';

        if (isGapAlert) {
          gapBg = '#fef2f2';
          statusBg = '#fef2f2';
          statusColor = '#b91c1c';
        } else if (variance <= 0 && c.financialProgressNumeric === 100) {
          statusBg = '#f0fdf4';
          statusColor = '#15803d';
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
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; background-color: ${gapBg}; font-weight: bold; text-align: center; color: ${variance >= 15 ? '#b91c1c' : variance > 0 ? '#b45309' : '#15803d'}; font-family: monospace;">${variance > 0 ? '+' : ''}${variance.toFixed(0)}%</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; background-color: ${statusBg}; color: ${statusColor}; font-weight: bold;">${c.pendingBillStatus || 'Cleared/Invoiced'}</td>
            <td style="padding: 8px 6px; border: 1px solid #e2e8f0; color: #475569;">${c.supervisor}</td>
          </tr>`;
      });

      html += `</tbody></table>`;

      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([filteredContracts.map(c => `${c.section}\t${c.workName}\t${c.totalContractValue}\t${c.physicalProgress}\t${c.financialProgress}\t${c.pendingBillStatus}`).join('\n')], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);

      setCopiedStyled(true);
      setTimeout(() => setCopiedStyled(false), 3050);
    } catch (err) {
      console.error(err);
      alert('Could not auto-copy the styled HTML spreadsheet rows. Please allow clipboard permissions inside browser setting panel.');
    }
  };

  // Handle Free CSV Report Extraction
  const handleExportDataCSV = () => {
    try {
      const headers = [
        'Section',
        'Work Name',
        'LOA Number & Date',
        'Firm Name',
        'Total Contract Value',
        'Contract Qty',
        'Qty Done till date',
        'Physical Progress',
        'Financial Progress',
        'Shed Supervisor',
        'Work Status',
        'Pending Bill Status',
        'New Proposal Status',
        'Remarks'
      ];

      const csvRows = [headers.join(',')];

      contracts.forEach((c) => {
        const values = [
          `"${c.section.replace(/"/g, '""')}"`,
          `"${c.workName.replace(/"/g, '""')}"`,
          `"${c.loaNumberAndDate.replace(/"/g, '""')}"`,
          `"${c.firmName.replace(/"/g, '""')}"`,
          `"${c.totalContractValue.replace(/"/g, '""')}"`,
          `"${c.contractQty} ${c.contractQtyUnit || ''}"`,
          `"${c.qtyDoneTillDate || '0'}"`,
          `"${c.physicalProgress}"`,
          `"${c.financialProgress}"`,
          `"${c.supervisor}"`,
          `"${c.workStatus}"`,
          `"${c.pendingBillStatus || ''}"`,
          `"${c.newProposalStatus || ''}"`,
          `"${c.remarks.replace(/"/g, '""')}"`
        ];
        csvRows.push(values.join(','));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ELS_KYN_Bill_Status_Matrix_Report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error extracting CSV report port file.');
    }
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = c.workName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.firmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.supervisor.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (billingFilter === 'All') return true;
      if (billingFilter === 'bottlenecks') return (c.physicalProgressNumeric - c.financialProgressNumeric) >= 15 && c.workStatus !== 'Not Started';
      if (billingFilter === 'prep') return c.pendingBillStatus.toLowerCase().includes('preparation') || c.pendingBillStatus.toLowerCase().includes('invoice');
      if (billingFilter === 'bg') return c.pendingBillStatus.toLowerCase().includes('bg') || c.remarks.toLowerCase().includes('bg') || c.remarks.toLowerCase().includes('guarantee');

      return true;
    });
  }, [contracts, searchTerm, billingFilter]);

  return (
    <div className="space-y-6">
      
      {/* Informational Header with Sharing & Dynamic update facts */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl shadow-sm border border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-teal-400 font-mono uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Shed Billing Intelligence Hub
            </h3>
            <p className="text-lg font-bold tracking-tight">Active Bills Liability & Audit Matrix</p>
            <p className="text-slate-400 text-xxs max-w-2xl leading-relaxed">
              This dashboard binds directly to your Google Sheet link stream. To refresh changes instantly, toggle the upper-right <strong className="text-emerald-300">"Sync Google Sheet"</strong> loader. Shared users can launch this app anonymously using the shared URL, entirely independent of AI Studio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <button
              onClick={handleCopyStyledTableForSheets}
              className={`text-xxs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                copiedStyled 
                  ? 'bg-emerald-600 text-white border border-emerald-500' 
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Copy interactive rows formatted with table lines, background colors, status meters, and bold layouts to paste in Google Sheets!"
            >
              {copiedStyled ? <Check className="w-3.5 h-3.5 text-white animate-bounce" /> : <Clipboard className="w-3.5 h-3.5 text-emerald-800" />}
              {copiedStyled ? 'Ready to Paste in Sheets!' : 'Copy Styled Sheet Rows (Excel/Google)'}
            </button>

            <button
              onClick={handleExportDataCSV}
              className="bg-white hover:bg-slate-150 text-slate-900 text-xxs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-850" />
              Excel CSV Export
            </button>
          </div>
        </div>

        {/* Informational Metrics Column inside header */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 border-t border-slate-800/80 pt-6">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Unbilled Exposure Value</span>
            <span className="text-base font-bold text-teal-400 mt-1 block">
              {formatIndianCurrency(billingStats.totalRetentionValue)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Outstanding physical value done</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Bills in Preparation</span>
            <span className="text-base font-bold mt-1 block text-slate-100">
              {billingStats.pendingPreparation} works
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting contractor signing/submission</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Guarantees Pending (BG)</span>
            <span className="text-base font-bold text-amber-500 mt-1 block">
              {billingStats.bgPending} contracts
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Requires correction letter submission</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Billing Gaps Alerts</span>
            <span className="text-base font-bold text-red-400 mt-1 block">
              {billingStats.passedWithGaps} contracts
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Physical progress &gt;15% ahead of billed</span>
          </div>
        </div>
      </div>

      {/* Interactive Billing Status Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart Card */}
        <div className="glass-card lg:col-span-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Active Billing Pipeline Status
            </h4>
            <p className="text-xxs text-slate-500 dark:text-slate-400 mt-0.5">Ratio of cleared invoices vs outstanding preparation / delay steps</p>
          </div>
          
          <div className="h-[200px] w-full flex items-center justify-center mt-3 relative">
            {/* Absolute Donut Center KPI */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-800 dark:text-white leading-none">{contracts.length}</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Works</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={billingStagesChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                >
                  {billingStagesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} Contracts`, 'Quantity']}
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px', fontFamily: 'monospace', borderRadius: '8px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
            {billingStagesChartData.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800/50"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-350 font-medium">
                  {item.name}: <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold">{item.value}</strong>
                </span>
                <span className="text-slate-400 font-mono text-[9px]">({item.percent}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="glass-card lg:col-span-6 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Unbilled Liability Exposure by Section
            </h4>
            <p className="text-xxs text-slate-500 dark:text-slate-400 mt-0.5">Physical progress done but not billed yet (Lakhs, Crores, or Thousands scaling)</p>
          </div>

          <div className="h-[210px] w-full mt-3">
            {unbilledValueBySectionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xxs bg-slate-50/50 dark:bg-slate-950/45 rounded-xl">
                No active outstanding unbilled value found. All work aligns with billings.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={unbilledValueBySectionData} 
                  margin={{ top: 10, right: 35, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 9, fill: labelColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val: number) => formatIndianCompact(val)}
                  />
                  <YAxis 
                    dataKey="section"
                    type="category"
                    tick={{ fontSize: 9, fill: labelColor, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatIndianCompact(value), 'Potential Bill Amount']}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '10px', fontFamily: 'monospace', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={11}>
                    {unbilledValueBySectionData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#2563eb'} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      formatter={(val: number) => formatIndianCompact(val)} 
                      style={{ fill: valLabelColor, fontSize: 8.5, fontWeight: 700 }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-slate-400 dark:text-slate-450 text-xxs mt-1 text-right italic">
            *Liability Exposure = Total Value × (Physical% - Financial Paid%)
          </div>
        </div>
      </div>

      {/* Bill Matrix Datagrid */}
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-5 border-b border-slate-100/40 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans tracking-tight">Operational Invoices Tracking Matrix</h4>
            <p className="text-xxs text-slate-500 dark:text-slate-400">Track clearance, BG approvals, CA preparation, and audits</p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xxs text-slate-450 dark:text-slate-400 font-semibold font-mono hidden md:inline">Quick Filter:</span>
            <div className="inline-flex rounded-xl bg-slate-50 dark:bg-slate-950 p-1 font-mono text-xxs font-medium border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setBillingFilter('All')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'All' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                All
              </button>
              <button 
                onClick={() => setBillingFilter('bottlenecks')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'bottlenecks' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Billing lag
              </button>
              <button 
                onClick={() => setBillingFilter('prep')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'prep' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                In Prep
              </button>
              <button 
                onClick={() => setBillingFilter('bg')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'bg' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                BG Delays
              </button>
            </div>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-805 mt-4">
          <table className="w-full border-collapse text-left text-xs text-slate-505 dark:text-slate-300">
            <thead className="bg-slate-50/70 dark:bg-slate-900/60 text-[10px] text-slate-600 dark:text-slate-400 font-semibold font-mono uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 pl-5">Section & Contract Details</th>
                <th className="px-4 py-3">Contract Value</th>
                <th className="px-4 py-3 font-mono">Phy vs Fin Progression</th>
                <th className="px-4 py-3 text-center">Variance Gap</th>
                <th className="px-4 py-3">Current Bill Status Parameter</th>
                <th className="px-4 py-3 pr-5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-105/60 dark:divide-slate-810/60">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 bg-slate-50/20 dark:bg-slate-950/20">
                    No contracts matched the selected bill filter.
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => {
                  const variance = c.physicalProgressNumeric - c.financialProgressNumeric;
                  const isGapAlert = variance >= 15 && c.workStatus !== 'Not Started';

                  return (
                    <tr 
                      key={c.id} 
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors group cursor-pointer border-b border-slate-100 dark:border-slate-810/30"
                      onClick={() => onSelectContract(c)}
                    >
                      {/* Name / Section description */}
                      <td className="px-4 py-3.5 pl-5 max-w-md whitespace-normal break-words">
                        <div className="flex items-start gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-900 text-teal-400 border border-slate-800 shrink-0">
                            {c.section}
                          </span>
                          <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 whitespace-normal break-words block">
                            {c.workName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Firm: <strong className="text-slate-600 dark:text-slate-300 font-medium">{c.firmName}</strong> • Supervisor: <strong className="text-slate-600 dark:text-slate-350 font-medium">{c.supervisor}</strong>
                        </span>
                      </td>

                      {/* Contract value */}
                      <td className="px-4 py-3.5 font-mono text-xxs font-semibold text-slate-800 dark:text-slate-100">
                        {c.totalContractValue}
                      </td>

                      {/* Phy vs Fin meter */}
                      <td className="px-4 py-3.5 w-44">
                        <div className="flex items-center gap-1.5 justify-between text-xxs font-mono font-bold">
                          <span className="text-teal-700 dark:text-teal-400">P: {c.physicalProgress}</span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="text-blue-600 dark:text-blue-400">F: {c.financialProgress}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                          <div className="h-full bg-teal-600" style={{ width: `${c.physicalProgressNumeric}%` }} />
                          <div className="h-full bg-blue-400/80" style={{ width: `${Math.max(0, c.financialProgressNumeric - c.physicalProgressNumeric)}%` }} />
                        </div>
                      </td>

                      {/* Variance Gap index */}
                      <td className="px-4 py-3.5 text-center font-mono text-xxs font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${isGapAlert ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-750 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-900/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                          {variance > 0 ? `+${variance.toFixed(0)}%` : `${variance.toFixed(0)}%`}
                        </span>
                      </td>

                      {/* Billing State parameters */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isGapAlert ? 'bg-red-50 dark:bg-red-955/35 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/40' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-250/60 dark:border-slate-800'
                          }`}>
                            {isGapAlert ? <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> : null}
                            {c.pendingBillStatus || 'Cleared/Invoiced'}
                          </span>
                          
                          {/* Superwisor refined summary preview */}
                          {c.remarksRefined ? (
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block italic max-w-xs truncate" title={c.remarksRefined}>
                              {c.remarksRefined}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* View Briefing buttons */}
                      <td className="px-4 py-3.5 text-right pr-5">
                        <button 
                          className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-black px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xxs font-medium font-mono cursor-pointer transition-all"
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
