import React from 'react';
import { Contract } from '../types';
import { 
  X, Calendar, Clipboard, User, FileText, CheckCircle2, TrendingUp, AlertTriangle, 
  MapPin, Archive, Tag, DollarSign, Clock, HelpCircle, FileCheck2, ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react'; // React 19 motion/react is pre-loaded or verified

interface ContractDetailsProps {
  contract: Contract | null;
  onClose: () => void;
}

export default function ContractDetails({ contract, onClose }: ContractDetailsProps) {
  if (!contract) return null;

  const hasBillingRisk = (contract.physicalProgressNumeric - contract.financialProgressNumeric) >= 15 && contract.workStatus !== 'Not Started';

  // Format currency
  const formatIndianCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const handleCopyClipboard = () => {
    const textToCopy = `
Contract: ${contract.workName}
LOA No: ${contract.loaNumberAndDate}
Contractor/Firm: ${contract.firmName}
Section: ${contract.section} | Supervisor: ${contract.supervisor}
Value: ${contract.totalContractValue} (${formatIndianCurrency(contract.totalContractValueNumeric)})
Timeline: ${contract.startDate} to ${contract.endDate} ${contract.extendedUpto ? `(Extended to ${contract.extendedUpto})` : ''}
Progress: Physical: ${contract.physicalProgress} | Financial: ${contract.financialProgress}
Billing Status: ${contract.pendingBillStatus || 'N/A'}
Refined Status: ${contract.remarksRefined || 'N/A'}
Remarks: ${contract.remarks}
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    alert('Contract briefing copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Semi-transparent overlay backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Drawer Shell */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-l border-slate-100">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border bg-slate-900 text-white border-transparent font-mono">
                {contract.section}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                contract.workStatus.toLowerCase().includes('complete') 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-100'
              }`}>
                {contract.workStatus}
              </span>
            </div>
            <p className="text-xxs text-slate-400 font-mono mt-1.5 leading-none">
              LOA ID: {contract.id}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Work Name Header */}
          <div className="space-y-2">
            <h1 className="text-base font-bold text-slate-800 font-sans tracking-tight leading-snug">
              {contract.workName}
            </h1>
            <p className="text-xxs text-slate-500 leading-relaxed">
              Assigned Supervisor: <strong className="text-slate-800 hover:underline">{contract.supervisor}</strong>
            </p>
          </div>

          {/* Quick Copy Tool */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyClipboard}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Copy Briefing Details
            </button>
          </div>

          {/* Financial Risk Billing Warning Banner */}
          {hasBillingRisk && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Billing Process Delay Detected</p>
                <p className="text-xxs text-amber-700 mt-1 leading-relaxed">
                  The physical progress ({contract.physicalProgress}) is significantly ahead of financial clearances ({contract.financialProgress}). This indicates a clearance hurdle (e.g. pending joint inspections, MB fillings or invoices).
                </p>
              </div>
            </div>
          )}

          {/* Progress Section */}
          <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-4">
            <h3 className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-mono">Progress & Outlay</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Physical progress indicator */}
              <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xs">
                <span className="text-xxs text-slate-400 block font-mono">Physical Done</span>
                <strong className="text-lg text-teal-700 block mt-0.5">{contract.physicalProgress}</strong>
                <div className="w-full bg-slate-150 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full" style={{ width: `${contract.physicalProgressNumeric}%` }} />
                </div>
              </div>

              {/* Financial progress indicator */}
              <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-xs">
                <span className="text-xxs text-slate-400 block font-mono">Financial Paid</span>
                <strong className="text-lg text-blue-700 block mt-0.5">{contract.financialProgress}</strong>
                <div className="w-full bg-slate-150 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${contract.financialProgressNumeric}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline and Dates parameters */}
          <div className="space-y-3">
            <h3 className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-mono">Timeline & Extensions</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xxs font-medium text-slate-600">
              <div className="flex items-center gap-2.5 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">LOA Start Date</span>
                  <span className="text-slate-800 font-semibold">{contract.startDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Original End Date</span>
                  <span className="text-slate-800 font-semibold">{contract.endDate}</span>
                </div>
              </div>

              {contract.extendedUpto && (
                <div className="flex items-center gap-2.5 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl sm:col-span-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <div>
                    <span className="text-[10px] text-indigo-500 block font-mono uppercase font-bold">Extended Upto Date</span>
                    <span className="text-indigo-900 font-bold">{contract.extendedUpto}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Time Elapsed progressbar */}
            <div className="bg-slate-50 p-3 border border-slate-100 rounded-xl">
              <div className="flex justify-between items-center text-[10px] mb-1 font-medium text-slate-500">
                <span>Contract Time Elapsed Index</span>
                <span className={`font-mono font-bold ${contract.timeElapsedNumeric > 100 ? 'text-red-600' : 'text-slate-700'}`}>
                  {contract.timeElapsed}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${contract.timeElapsedNumeric > 100 ? 'bg-red-500' : 'bg-slate-700'}`} 
                  style={{ width: `${Math.min(contract.timeElapsedNumeric, 100)}%` }} 
                />
              </div>
              {contract.timeElapsedNumeric > 100 && (
                <p className="text-[10px] text-red-600 font-semibold mt-1.5 leading-none">
                  ⚠️ Work exceeds original end timeline. Requires retrospective variance review.
                </p>
              )}
            </div>
          </div>

          {/* Briefing and Contractor Details */}
          <div className="space-y-3">
            <h3 className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-mono">Contracting Details</h3>
            
            <div className="space-y-2 text-xxs font-medium text-slate-600">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-mono">Contractor/Firm Name</span>
                <span className="text-slate-800 font-bold block mt-0.5">{contract.firmName}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-mono">LOA Reference & Tender ID</span>
                <span className="text-slate-700 font-mono font-semibold block mt-1 leading-relaxed whitespace-pre-wrap">{contract.loaNumberAndDate}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-mono">Total Contract Value</span>
                  <span className="text-slate-800 font-bold block mt-0.5">{contract.totalContractValue}</span>
                </div>
                {contract.allocationDemand && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-mono">Allocation Demand</span>
                    <span className="text-slate-800 font-mono font-bold block mt-0.5">{contract.allocationDemand}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quantities breakdown */}
          {contract.contractQty && (
            <div className="space-y-3">
              <h3 className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-mono">Quantities Execution</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Total Qty</span>
                  <strong className="text-slate-800 text-xs mt-0.5 block">{contract.contractQty}</strong>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Qty Done</span>
                  <strong className="text-emerald-700 text-xs mt-0.5 block">{contract.qtyDoneTillDate || '0'}</strong>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block">Qty Balance</span>
                  <strong className="text-amber-700 text-xs mt-0.5 block">{contract.qtyBalance || '0'}</strong>
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 text-center rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium">
                Unit of Quantity: <strong className="text-slate-700">{contract.contractQtyUnit}</strong> {contract.billDoneQuantity ? `• Passed bills: ${contract.billDoneQuantity} items` : ''}
              </div>
            </div>
          )}

          {/* Remarks display */}
          <div className="space-y-3">
            <h3 className="text-xxs font-bold uppercase tracking-wider text-slate-400 font-mono">Shed Supervisor Remarks</h3>
            
            <div className="space-y-2 text-xxs leading-relaxed">
              {contract.remarksRefined && (
                <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl">
                  <span className="text-[10px] text-teal-800 font-mono block font-bold mb-1">REFINED CONTRACT SUMMARY</span>
                  <p className="text-slate-800 font-medium">{contract.remarksRefined}</p>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono block mb-1">RAW INTERNAL SHED NOTE</span>
                <p className="text-slate-700">{contract.remarks}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Drawer Footer controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-900 shadow hover:bg-black text-white text-xxs font-bold rounded-xl transition-all cursor-pointer text-center"
          >
            Finished briefings
          </button>
        </div>

      </div>
    </div>
  );
}
