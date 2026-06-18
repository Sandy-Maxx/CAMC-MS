import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, LabelList
} from 'recharts';
import { Contract } from '../types';
import {
  TrendingUp, Users, AlertCircle, CheckCircle2, IndianRupee, PieChart as PieIcon,
  BarChart4, ArrowUpRight, BarChart2, CheckSquare, Clock, ShieldAlert, Layers, Printer
} from 'lucide-react';

interface AnalyticsDashboardProps {
  contracts: Contract[];
  onSelectContract: (contract: Contract) => void;
  onFilterSection: (sec: string) => void;
  onFilterSupervisor: (superv: string) => void;
  onFilterClassification: (classType: string) => void;
  darkMode?: boolean;
}

export default function AnalyticsDashboard({
  contracts,
  onSelectContract,
  onFilterSection,
  onFilterSupervisor,
  onFilterClassification,
  darkMode = false
}: AnalyticsDashboardProps) {

  const gridStroke = darkMode ? '#1e293b' : '#cbd5e1';
  const labelColor = darkMode ? '#94a3b8' : '#475569';
  const valLabelColor = darkMode ? '#3aa1e2' : '#0d9488';
  const textContrastColor = darkMode ? '#f8fafc' : '#0f172a';
  const labelFillColor = darkMode ? '#94a3b8' : '#334155';

  // Format currency into Lakhs/Crores or Indian numeric styling
  const formatIndianCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const stats = useMemo(() => {
    let totalVal = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    
    // Financial Bottlenecks: Physical progress is 10%+ ahead of financial progress
    const bottlenecks: Contract[] = [];
    
    contracts.forEach(c => {
      totalVal += c.totalContractValueNumeric;
      
      const st = c.workStatus.toLowerCase().trim();
      if (st.includes('completed')) {
        completedCount++;
      } else if (st.includes('not started')) {
        notStartedCount++;
      } else {
        inProgressCount++;
      }

      const lag = c.physicalProgressNumeric - c.financialProgressNumeric;
      if (lag >= 15 && c.workStatus !== 'Not Started') {
        bottlenecks.push(c);
      }
    });

    return {
      totalCount: contracts.length,
      totalValue: totalVal,
      completedCount,
      inProgressCount,
      notStartedCount,
      bottlenecksCount: bottlenecks.length,
      bottlenecksList: bottlenecks.sort((a,b) => (b.physicalProgressNumeric - b.financialProgressNumeric) - (a.physicalProgressNumeric - a.financialProgressNumeric)).slice(0, 5)
    };
  }, [contracts]);

  // 1. Data for Classification-wise summary
  const classificationChartData = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number }> = {};
    contracts.forEach(c => {
      const type = c.classificationType;
      if (!map[type]) {
        map[type] = { name: type, value: 0, count: 0 };
      }
      map[type].value += c.totalContractValueNumeric;
      map[type].count += 1;
    });
    return Object.values(map).sort((a,b) => b.value - a.value);
  }, [contracts]);

  // 2. Data for Section-wise performance
  const sectionChartData = useMemo(() => {
    const map: Record<string, { name: string; totalValue: number; count: number; avgPhysical: number; avgFinancial: number }> = {};
    contracts.forEach(c => {
      const sec = c.section;
      if (!map[sec]) {
        map[sec] = { name: sec, totalValue: 0, count: 0, avgPhysical: 0, avgFinancial: 0 };
      }
      map[sec].totalValue += c.totalContractValueNumeric;
      map[sec].count += 1;
      map[sec].avgPhysical += c.physicalProgressNumeric;
      map[sec].avgFinancial += c.financialProgressNumeric;
    });

    return Object.values(map).map(item => ({
      ...item,
      avgPhysical: parseFloat((item.avgPhysical / item.count).toFixed(1)),
      avgFinancial: parseFloat((item.avgFinancial / item.count).toFixed(1)),
    })).sort((a,b) => b.totalValue - a.totalValue);
  }, [contracts]);

  // Data for the Donut Chart (grouping minor categories into "Others" so the overall sum equals stats.totalValue)
  const sectionPieChartData = useMemo(() => {
    if (sectionChartData.length <= 6) {
      return sectionChartData;
    }
    const top = sectionChartData.slice(0, 5);
    const othersValue = sectionChartData.slice(5).reduce((acc, curr) => acc + curr.totalValue, 0);
    const othersCount = sectionChartData.slice(5).reduce((acc, curr) => acc + curr.count, 0);
    return [
      ...top,
      {
        name: 'Others',
        totalValue: othersValue,
        count: othersCount,
        avgPhysical: 0,
        avgFinancial: 0
      }
    ];
  }, [sectionChartData]);

  // 3. Data for Supervisor Workloads
  const supervisorChartData = useMemo(() => {
    const map: Record<string, { name: string; totalValue: number; count: number; completedCount: number; avgPhy: number }> = {};
    contracts.forEach(c => {
      const sup = c.supervisor;
      if (!map[sup]) {
        map[sup] = { name: sup, totalValue: 0, count: 0, completedCount: 0, avgPhy: 0 };
      }
      map[sup].totalValue += c.totalContractValueNumeric;
      map[sup].count += 1;
      map[sup].avgPhy += c.physicalProgressNumeric;
      if (c.workStatus.toLowerCase().includes('completed')) {
        map[sup].completedCount += 1;
      }
    });
    return Object.values(map).map(item => ({
      ...item,
      avgPhy: parseFloat((item.avgPhy / item.count).toFixed(1))
    })).sort((a,b) => b.count - a.count);
  }, [contracts]);

  const handleExportAnalyticsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Could not open print preview.');
      return;
    }

    // Classification Table Rows
    const classRowsHtml = classificationChartData.map((item, idx) => {
      const sharePct = stats.totalValue > 0 ? ((item.value / stats.totalValue) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="font-weight: bold;">${item.name}</td>
          <td style="text-align: center; font-family: monospace;">${item.count} Works</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace;">${formatIndianCurrency(item.value)}</td>
          <td style="text-align: center; font-family: monospace;">${sharePct}%</td>
        </tr>
      `;
    }).join('');

    // Section Table Rows
    const sectionRowsHtml = sectionChartData.map((item, idx) => {
      const gap = item.avgPhysical - item.avgFinancial;
      const gapText = gap > 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`;
      const gapColor = gap >= 15 ? '#b91c1c' : gap > 0 ? '#b45309' : '#15803d';
      const gapWeight = gap >= 15 ? 'bold' : 'normal';

      return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="font-weight: bold; text-align: center;">${item.name}</td>
          <td style="text-align: center; font-family: monospace;">${item.count} Works</td>
          <td style="text-align: right; font-family: monospace;">${formatIndianCurrency(item.totalValue)}</td>
          <td style="text-align: center; font-family: monospace; color: #0d9488; font-weight: bold;">${item.avgPhysical.toFixed(1)}%</td>
          <td style="text-align: center; font-family: monospace; color: #2563eb; font-weight: bold;">${item.avgFinancial.toFixed(1)}%</td>
          <td style="text-align: center; font-family: monospace; color: ${gapColor}; font-weight: ${gapWeight};">${gapText}</td>
        </tr>
      `;
    }).join('');

    // Supervisor Table Rows
    const supervisorRowsHtml = supervisorChartData.map((item, idx) => {
      return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="font-weight: bold;">${item.name}</td>
          <td style="text-align: center; font-family: monospace;">${item.count} Works</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatIndianCurrency(item.totalValue)}</td>
          <td style="text-align: center; font-family: monospace; color: #16a34a; font-weight: bold;">${item.completedCount} / ${item.count}</td>
          <td style="text-align: center; font-family: monospace; color: #0f766e; font-weight: bold;">${item.avgPhy}%</td>
        </tr>
      `;
    }).join('');

    // Critical Gaps Rows
    const bottleneckRowsHtml = stats.bottlenecksList.map((c, idx) => {
      const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
      return `
        <tr>
          <td style="text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="font-weight: bold;">[${c.section}] ${c.workName}</td>
          <td>${c.supervisor}</td>
          <td style="text-align: right; font-family: monospace;">${c.totalContractValue}</td>
          <td style="text-align: center; font-family: monospace; color: #0d9488;">${c.physicalProgress}</td>
          <td style="text-align: center; font-family: monospace; color: #2563eb;">${c.financialProgress}</td>
          <td style="text-align: center; font-family: monospace; color: #b91c1c; font-weight: bold;">+${gap.toFixed(0)}%</td>
          <td style="color: #475569; font-size: 8px;">${c.pendingBillStatus || 'Pending Joint Sign-off'}</td>
        </tr>
      `;
    }).join('');

    const analyticReportContent = `
      <html>
        <head>
          <title>ELS-KYN INTERACTIVE ANALYTICS SUMMARY REPORT</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 25px; color: #0f172a; font-size: 9px; background-color: #fff; }
            .hdr { text-align: center; font-family: "Times New Roman", Times, serif; font-size: 15px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .subhdr { text-align: center; font-size: 8.5px; color: #475569; margin-bottom: 2px; letter-spacing: 0.5px; }
            .subhdr-bold { text-align: center; font-size: 9.5px; font-weight: bold; margin-bottom: 10px; }
            .divider { border-top: 1.5px solid #000; margin-bottom: 12px; }
            .title-box { background-color: #f1f5f9; text-align: center; padding: 8px; font-weight: bold; font-size: 11px; border: 1.5px solid #cbd5e1; border-radius: 6px; margin-bottom: 12px; text-transform: uppercase; }
            
            .meta-section { display: flex; justify-content: space-between; border: 1px dashed #94a3b8; background-color: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 12px; }
            .meta-item { line-height: 1.4; }

            .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
            .stat-card { border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 8px; text-align: center; background-color: #f8fafc; }
            .stat-title { font-size: 7.5px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 3px; }
            .stat-value { font-size: 12px; font-weight: bold; font-family: monospace; color: #0f172a; }

            h3 { font-size: 10px; font-weight: bold; text-transform: uppercase; margin: 12px 0 5px 0; color: #0f172a; border-left: 3px solid #0f766e; padding-left: 6px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

            .report-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            .report-table th { background-color: #0f172a; color: #ffffff; padding: 4px 5px; font-size: 7.5px; font-weight: bold; text-transform: uppercase; text-align: left; border: 1px solid #cbd5e1; }
            .report-table td { padding: 4px 5px; border: 1px solid #cbd5e1; font-size: 7.5px; vertical-align: middle; }
            .report-table tr:nth-child(even) { background-color: #fcfcfc; }

            .footer-sig { margin-top: 20px; font-size: 8px; page-break-inside: avoid; }
            
            @media print {
              body { margin: 12px; }
              @page { size: A4 portrait; margin: 0.8cm; }
            }
          </style>
        </head>
        <body>
          <div class="hdr">Central Railway</div>
          <div class="subhdr">Office of the Senior Divisional Electrical Engineer (TRS)</div>
          <div class="subhdr-bold">Electric Loco Shed, Kalyan (Mumbai Division)</div>
          <div class="divider"></div>

          <div class="title-box">
            ELS/KYN CONTRACTS — INTERACTIVE ANALYTICS COMPACT EXECUTIVE REPORT
          </div>

          <div class="meta-section">
            <div class="meta-item">
              <strong>Audit Period:</strong> Financial Year 2026/27<br>
              <strong>Data Source:</strong> Live Local Sheets Dataset
            </div>
            <div class="meta-item" style="text-align: right;">
              <strong>Date of Generation:</strong> ${new Date().toLocaleString()}<br>
              <strong>Classification:</strong> HIGHLY CONFIDENTIAL (ELS/KYN Admin Only)
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-title">Total Active Portfolio Value</div>
              <div class="stat-value" style="color: #0d9488;">${formatIndianCurrency(stats.totalValue)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Technical Classification Mix</div>
              <div class="stat-value">${classificationChartData.length} Designations</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Risk Alerts (&ge;15% Progress Lag)</div>
              <div class="stat-value" style="color: #b91c1c;">${stats.bottlenecksCount} Works Gaps</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Completed Works Ratio</div>
              <div class="stat-value" style="color: #2563eb;">${stats.completedCount} / ${stats.totalCount} Works</div>
            </div>
          </div>

          <div class="grid-2">
            <div>
              <h3>1. Technical Classification Value Breakdown</h3>
              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width: 20px; text-align: center;">S.N</th>
                    <th>Classification Type</th>
                    <th style="width: 50px; text-align: center;">Contracts</th>
                    <th style="width: 80px; text-align: right;">Total Budget</th>
                    <th style="width: 40px; text-align: center;">Share%</th>
                  </tr>
                </thead>
                <tbody>
                  ${classRowsHtml}
                </tbody>
              </table>
            </div>

            <div>
              <h3>2. Section-wise Performance metrics</h3>
              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width: 20px; text-align: center;">S.N</th>
                    <th style="text-align: center; width: 35px;">Section</th>
                    <th style="width: 45px; text-align: center;">Contracts</th>
                    <th style="text-align: right; width: 75px;">Allocated Budget</th>
                    <th style="text-align: center; width: 35px;">Avg Phy%</th>
                    <th style="text-align: center; width: 35px;">Avg Fin%</th>
                    <th style="text-align: center; width: 35px;">Gap Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  ${sectionRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <div class="grid-2">
            <div>
              <h3>3. Supervisor Monitoring Workloads</h3>
              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width: 20px; text-align: center;">S.N</th>
                    <th>Supervisor Title</th>
                    <th style="width: 50px; text-align: center;">Works</th>
                    <th style="width: 85px; text-align: right;">Valuation</th>
                    <th style="width: 55px; text-align: center;">Comp Rate</th>
                    <th style="width: 45px; text-align: center;">Avg Progress</th>
                  </tr>
                </thead>
                <tbody>
                  ${supervisorRowsHtml}
                </tbody>
              </table>
            </div>

            <div>
              <h3>4. Executive Risk Insight Brief</h3>
              <div style="background-color: #fafafa; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; line-height: 1.4; color: #334155; font-size: 7.5px;">
                <p style="margin: 0 0 5px 0; font-weight: bold; color: #0f172a; font-size: 8px;">📈 KEY DECISION RECOMMENDATIONS:</p>
                <p style="margin: 0 0 4px 0;"><strong>Unified Billing Alignment:</strong> The total outstanding financial exposure from progress margins requires SSE/Works physical measurement updates within this fiscal cycle.</p>
                <p style="margin: 0 0 4px 0;"><strong>Supervisor Workload balancing:</strong> Supervisors managing higher workload sums should be prioritized for fast-tracked billing preparation to sync clearances.</p>
                <p style="margin: 0;"><strong>Active Sections:</strong> PEX and renovation sections occupy the major chunk of CAMC budget allocation. Strict SLA parameters are recommended.</p>
              </div>
            </div>
          </div>

          <h3>5. Top Critical Billing Bottlenecks (Outstanding Gaps)</h3>
          <table class="report-table" style="margin-bottom: 5px;">
            <thead>
              <tr>
                <th style="width: 20px; text-align: center;">S.N</th>
                <th>Contract Description</th>
                <th style="width: 85px;">Supervisor</th>
                <th style="width: 80px; text-align: right;">Valuation</th>
                <th style="width: 45px; text-align: center;">Physical%</th>
                <th style="width: 45px; text-align: center;">Financial%</th>
                <th style="width: 45px; text-align: center;">Gap %</th>
                <th style="width: 120px;">Hurdle / Remark</th>
              </tr>
            </thead>
            <tbody>
              ${bottleneckRowsHtml.length > 0 ? bottleneckRowsHtml : '<tr><td colspan="8" style="text-align:center;">No major progress-billing gaps logged.</td></tr>'}
            </tbody>
          </table>

          <div class="footer-sig">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; font-size: 8.5px; color: #b91c1c; font-weight: bold; vertical-align: bottom; font-family: Arial, sans-serif;">
                  * Highly Confidential Report only to be shared within ELS/KYN Administration.
                </td>
                <td style="text-align: right; width: 50%;">
                  <div style="font-weight: bold; font-size: 9px;">Central Railway • Electric Loco Shed, Kalyan</div>
                  <div style="font-size: 8.5px; color: #333; margin-top: 3px; font-weight: bold;">Senior Section Engineer (Works) / SSE / ELS-KYN</div>
                  <div style="font-size: 7.5px; color: #555; margin-top: 1px;">Office of Senior Divisional Electrical Engineer (TRS)</div>
                </td>
              </tr>
            </table>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(analyticReportContent);
    printWindow.document.close();
  };

  // Chart Colors presets
  const COLORS = ['#0f766e', '#6d28d9', '#1d4ed8', '#b45309', '#be185d', '#0369a1', '#15803d', '#475569'];

  return (
    <div className="space-y-6">
      {/* Executive Quick Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs no-print">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <BarChart2 className="w-4.5 h-4.5 text-teal-600" />
            Executive Analytics Summary
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Live technical progress, supervisor workloads, and billing risk profiling</p>
        </div>
        <button
          onClick={handleExportAnalyticsPDF}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xxs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-transparent self-stretch sm:self-auto justify-center"
          title="Export high-density compact executive analytics dashboard as printable PDF"
        >
          <Printer className="w-3.5 h-3.5 text-indigo-100" />
          Export Analytics PDF
        </button>
      </div>

      {/* KPI Top Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-50/60 to-white dark:from-slate-900/40 dark:to-slate-950/60 border border-teal-100 dark:border-slate-800/80 text-slate-800 dark:text-white rounded-2xl shadow-xs p-5 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-15 dark:opacity-10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
            <IndianRupee className="w-28 h-28" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xxs font-semibold uppercase tracking-wider">Total Active Value</p>
          <p className="text-2xl font-bold font-sans tracking-tight mt-1 text-teal-600 dark:text-teal-400">
            {formatIndianCurrency(stats.totalValue)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 text-xxs font-mono">
            <span>Across {stats.totalCount} active contracts</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-slate-800 dark:text-white group-hover:scale-110 transition-transform">
            <Layers className="w-28 h-28" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xxs font-semibold uppercase tracking-wider">Classification Mix</p>
          <p className="text-2xl font-bold text-slate-805 dark:text-slate-100 font-sans tracking-tight mt-1">
            {classificationChartData.length} Types
          </p>
          <div className="flex items-center gap-2 mt-2 text-emerald-600 dark:text-emerald-400 text-xxs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Categorized by technical work scope</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-indigo-700 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-28 h-28" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xxs font-semibold uppercase tracking-wider">Financial Risk Alerts</p>
          <p className={`text-2xl font-bold font-sans tracking-tight mt-1 ${stats.bottlenecksCount > 0 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-slate-805 dark:text-slate-100'}`}>
            {stats.bottlenecksCount} Contracts
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-slate-550 dark:text-slate-400 text-xxs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Physically done but pending bills &gt;15%</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-slate-800 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-28 h-28" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xxs font-semibold uppercase tracking-wider">Execution Pipeline</p>
          <p className="text-2xl font-bold text-slate-805 dark:text-slate-100 font-sans tracking-tight mt-1">
            {stats.completedCount} Complete
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-slate-550 dark:text-slate-400 text-xxs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{stats.inProgressCount} in progress • {stats.notStartedCount} queued</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Classification Breakdown */}
        <div className="glass-card lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <BarChart4 className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                Work Classifications (Operational Value Breakup)
              </h3>
              <p className="text-xxs text-slate-500 dark:text-slate-400">Auto-classified contract value distributions</p>
            </div>
            <span className="text-xxs text-slate-400 font-mono">By Value (INR)</span>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classificationChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => formatIndianCurrency(v).replace('₹', '')}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: labelColor, fontFamily: 'monospace' }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: labelColor, fontWeight: 500 }}
                />
                <Tooltip
                  formatter={(value: any) => [formatIndianCurrency(Number(value)), 'Total Value']}
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#cbd5e1' }}
                  itemStyle={{ fontSize: '11px', color: '#38bdf8' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 8, 8, 0]} 
                  onClick={(data) => onFilterClassification(data.name)}
                  cursor="pointer"
                >
                  {classificationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    formatter={(val: number) => {
                      if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
                      if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
                      return `₹${val}`;
                    }}
                    style={{ fill: textContrastColor, fontSize: 9, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Value Shares (Pie Chart) */}
        <div className="glass-card lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-1">
              <PieIcon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Shed Sections Share
            </h3>
            <p className="text-xxs text-slate-500 dark:text-slate-400">Proportional budget allocations across engineering sections</p>
          </div>

          <div className="h-52 my-3 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectionPieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="totalValue"
                  label={({ name, percent }) => percent > 0.03 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={true}
                >
                  {sectionPieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatIndianCurrency(Number(value)), 'Allocation']}
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend in Center */}
            <div className="absolute text-center pointer-events-none select-none">
              <span className="text-[9px] text-slate-450 dark:text-slate-400 block uppercase font-mono">PEX SHARES</span>
              <span className="text-sm font-black text-slate-905 dark:text-slate-100">
                {((sectionChartData.find(s=>s.name === 'PEX')?.totalValue || 0) / (stats.totalValue || 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xxs font-mono">
            {sectionChartData.slice(0, 3).map((item, i) => (
              <div 
                key={item.name} 
                onClick={() => onFilterSection(item.name)}
                className="p-1.5 bg-slate-50/70 dark:bg-slate-950/40 rounded-lg border border-slate-100 dark:border-slate-800/80 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="block font-semibold text-slate-705 dark:text-slate-300">{item.name}</span>
                <span className="text-slate-500 dark:text-slate-400 mt-0.5 block">{formatIndianCurrency(item.totalValue).replace('₹', '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Performance & Progress Chart (Physical vs Financial Alignment) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Physical vs Financial lag */}
        <div className="glass-card lg:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <BarChart2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                Physical vs Financial Progress by Shed Section
              </h3>
              <p className="text-xxs text-slate-500 dark:text-slate-400">Identifies billing gaps (Physical progress done but payments awaiting sanction)</p>
            </div>
            <div className="flex gap-4 text-xxs mt-2 sm:mt-0 font-medium">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal-600 rounded"></span> Physical progress %</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded"></span> Financial progress %</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={sectionChartData.slice(0, 10)}
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: labelColor, fontSize: 9 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: labelColor, fontSize: 9 }}
                />
                <Tooltip
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                />
                <Bar 
                  dataKey="avgPhysical" 
                  fill="#0d9488" 
                  radius={[4, 4, 0, 0]} 
                  barSize={18} 
                  name="Physical Done" 
                  onClick={(data) => onFilterSection(data.name)}
                  cursor="pointer"
                >
                  <LabelList 
                    dataKey="avgPhysical" 
                    position="top" 
                    formatter={(val: number) => `${val.toFixed(0)}%`}
                    style={{ fill: valLabelColor, fontSize: 8, fontWeight: 700 }}
                  />
                </Bar>
                <Bar 
                  dataKey="avgFinancial" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={18} 
                  name="Bill Clearances" 
                  onClick={(data) => onFilterSection(data.name)}
                  cursor="pointer"
                >
                  <LabelList 
                    dataKey="avgFinancial" 
                    position="top" 
                    formatter={(val: number) => `${val.toFixed(0)}%`}
                    style={{ fill: '#3b82f6', fontSize: 8, fontWeight: 700 }}
                  />
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#be185d" 
                  name="No. of Contracts"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  yAxisId={0}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottleneck Alerts Sidebar (Physical vs Financial Gap) */}
        <div className="glass-card lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Billing Gaps (Risk Analysis)
              </h3>
            </div>
            <p className="text-xxs text-slate-500 dark:text-slate-400">Highest priority works that are physically locked but financially blocked</p>
          </div>

          <div className="space-y-3 my-4 overflow-y-auto max-h-56 pr-1">
            {stats.bottlenecksList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                No critical billing bottlenecks detected. Physical & Financial alignment looks fully synced!
              </div>
            ) : (
              stats.bottlenecksList.map((c) => {
                const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectContract(c)}
                    className="p-3 bg-red-50/50 hover:bg-red-50 hover:shadow-sm border border-red-100 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xxs font-bold text-slate-800 font-sans tracking-tight truncate max-w-[150px]">
                        {c.workName}
                      </span>
                      <span className="text-xxs shrink-0 font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-mono">
                        +{gap.toFixed(0)}% Gap
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-slate-500 text-[10px] font-medium">
                      <span>Supervisor: <strong className="text-slate-800 font-semibold">{c.supervisor}</strong></span>
                      <span className="text-slate-600 font-mono text-xxs flex items-center gap-0.5">
                        Phy: {c.physicalProgressNumeric}% • Fin: {c.financialProgressNumeric}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-xxs text-slate-400 bg-slate-50 p-2 border border-slate-100 rounded-xl leading-relaxed">
            💸 <strong className="text-slate-700">Audit Insight:</strong> Contracts with large variance metrics suggest billing preparation hurdles due to missing MB filings, BG delays, or pending joint notes.
          </div>
        </div>
      </div>

      {/* Supervisor Workloads Breakdown row */}
      <div className="glass-card">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-3.5">
          <Users className="w-4.5 h-4.5 text-teal-700 dark:text-teal-400" />
          Supervisor Monitoring Centre (Workload & Status tracking)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supervisorChartData.map((su) => (
            <div 
              key={su.name}
              onClick={() => onFilterSupervisor(su.name)}
              className="p-4 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:shadow-xs transition-all border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">{su.name}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                  {su.count} works
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3.5 border-t border-slate-200/60 pt-3 text-xxs font-mono text-slate-500">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Budget</span>
                  <strong className="text-slate-800 font-semibold text-xs mt-0.5 block">
                    {formatIndianCurrency(su.totalValue).replace('₹', '')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Completed</span>
                  <strong className="text-emerald-700 font-semibold text-xs mt-0.5 block">
                    {su.completedCount} / {su.count}
                  </strong>
                </div>
              </div>

              {/* Progress Bar overall */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-slate-400 font-medium mb-1">
                  <span>Average Technical Progress</span>
                  <span>{su.avgPhy}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: `${su.avgPhy}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Small icons
function AlertSquare() {
  return (
    <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
      <AlertCircle className="w-4 h-4" />
    </div>
  );
}
