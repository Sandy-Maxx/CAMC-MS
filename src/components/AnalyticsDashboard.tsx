import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, LabelList
} from 'recharts';
import { Contract } from '../types';
import {
  TrendingUp, Users, AlertCircle, CheckCircle2, IndianRupee, PieChart as PieIcon,
  BarChart4, ArrowUpRight, BarChart2, CheckSquare, Clock, ShieldAlert, Layers
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

  // Chart Colors presets
  const COLORS = ['#0f766e', '#6d28d9', '#1d4ed8', '#b45309', '#be185d', '#0369a1', '#15803d', '#475569'];

  return (
    <div className="space-y-6">
      {/* KPI Top Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl shadow-sm p-5 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10 text-white group-hover:scale-110 transition-transform">
            <IndianRupee className="w-28 h-28" />
          </div>
          <p className="text-slate-400 text-xxs font-semibold uppercase tracking-wider">Total Active Value</p>
          <p className="text-2xl font-bold font-sans tracking-tight mt-1 text-teal-400">
            {formatIndianCurrency(stats.totalValue)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-slate-450 text-xxs font-mono">
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
