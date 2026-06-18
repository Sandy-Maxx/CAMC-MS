import React, { useMemo, useState } from 'react';
import { Contract } from '../types';
import { 
  FileSpreadsheet, Clipboard, Download, CheckCircle2, AlertTriangle, Clock, 
  HelpCircle, Search, DollarSign, ArrowUpRight, Layers, FileText, Ban, Sparkles, Filter, Check,
  Mail, Printer, X, ShieldAlert
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

  // Print Report state
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState(() => {
    return 'ELS/KYN CONTRACTS — DYNAMIC LIABILITY & COMPLIANCE REPORT';
  });
  const [reportNote, setReportNote] = useState('Generated only for ELS/KYN Administrative decision Making.');

  // Draft Letter state
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [letterContract, setLetterContract] = useState<Contract | null>(null);
  const [letterType, setLetterType] = useState<'BG' | 'IB'>('BG');
  const [letterRef, setLetterRef] = useState('');
  const [letterDate, setLetterDate] = useState(() => {
    const d = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  });
  const [letterSubject, setLetterSubject] = useState('');
  const [letterBody, setLetterBody] = useState('');
  const [letterSignatory, setLetterSignatory] = useState('Senior Divisional Electrical Engineer (TRS) Kalyan');
  const [copiedLetter, setCopiedLetter] = useState(false);

  const handleOpenLetterModal = (contract: Contract, type: 'BG' | 'IB') => {
    setLetterContract(contract);
    setLetterType(type);
    
    const year = new Date().getFullYear();
    const cleanSection = contract.section ? contract.section.toUpperCase() : 'TRS';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setLetterRef(`ELS/KYN/AWA/${cleanSection}/${year}/${randomNum}`);
    
    const cleanVal = contract.totalContractValue || 'tender value';
    
    if (type === 'BG') {
      setLetterSubject(`Submission of Performance Bank Guarantee (PBG) for execution of work: ${contract.workName}`);
      setLetterBody(
`1. With reference to the above cited Letter of Acceptance (LOA) issued by ELS Kalyan, you were advised to submit a valid Performance Bank Guarantee (PBG) / PG within 30 days of the date of issue of the LOA.

2. It is highly regretted to note that despite the physical execution progression of your work currently standing at ${contract.physicalProgress}, the required Bank Guarantee of appropriate value equivalent to 10% of the total contract value (joint valuation ${cleanVal}) has NOT been deposited at this office. This constitutes a severe contractual delay and liability.

3. You are hereby called upon to submit the valid Performance Guarantee (PG) within 7 days from the receipt of this letter, failing which, appropriate penal action as per terms of contract (including withholding of progressive payments, levy of late submission interest, or contract termination at your risk and cost) shall be initiated immediately.

Please treat this as most urgent and confirm compliance.`
      );
    } else {
      setLetterSubject(`Submission of Indemnity Bond for release of progressive bills / scrap disposal / tools for: ${contract.workName}`);
      setLetterBody(
`1. This is regarding the progress of subject work at Electric Loco Shed, Kalyan. It is observed from the record of work done that your bills are under preparation or pending certification, where the execution physically reached ${contract.physicalProgress}.

2. In terms of special conditions of contract and standard procurement guidelines of Indian Railways, you are required to submit an Indemnity Bond (IB) in the approved format of Central Railway on proper judicial stamp papers, indemnifying the President of India against any losses, tools handling, custody of property, or asset transition.

3. Release of progressive payments, supply materials, or bill dispatch can only be processed upon receipt of the original executed Indemnity Bond. You are advised to submit the Indemnity Bond immediately to the office of ELS Kalyan to expedite invoice clearance.`
      );
    }
    
    setShowLetterModal(true);
  };

  const handleSwitchLetterType = (type: 'BG' | 'IB') => {
    if (!letterContract) return;
    setLetterType(type);
    const cleanVal = letterContract.totalContractValue || 'tender value';
    
    if (type === 'BG') {
      setLetterSubject(`Submission of Performance Bank Guarantee (PBG) for execution of work: ${letterContract.workName}`);
      setLetterBody(
`1. With reference to the above cited Letter of Acceptance (LOA) issued by ELS Kalyan, you were advised to submit a valid Performance Bank Guarantee (PBG) / PG within 30 days of the date of issue of the LOA.

2. It is highly regretted to note that despite the physical execution progression of your work currently standing at ${letterContract.physicalProgress}, the required Bank Guarantee of appropriate value equivalent to 10% of the total contract value (joint valuation ${cleanVal}) has NOT been deposited at this office. This constitutes a severe contractual delay and liability.

3. You are hereby called upon to submit the valid Performance Guarantee (PG) within 7 days from the receipt of this letter, failing which, appropriate penal action as per terms of contract (including withholding of progressive payments, levy of late submission interest, or contract termination at your risk and cost) shall be initiated immediately.

Please treat this as most urgent and confirm compliance.`
      );
    } else {
      setLetterSubject(`Submission of Indemnity Bond for release of progressive bills / scrap disposal / tools for: ${letterContract.workName}`);
      setLetterBody(
`1. This is regarding the progress of subject work at Electric Loco Shed, Kalyan. It is observed from the record of work done that your bills are under preparation or pending certification, where the execution physically reached ${letterContract.physicalProgress}.

2. In terms of special conditions of contract and standard procurement guidelines of Indian Railways, you are required to submit an Indemnity Bond (IB) in the approved format of Central Railway on proper judicial stamp papers, indemnifying the President of India against any losses, tools handling, custody of property, or asset transition.

3. Release of progressive payments, supply materials, or bill dispatch can only be processed upon receipt of the original executed Indemnity Bond. You are advised to submit the Indemnity Bond immediately to the office of ELS Kalyan to expedite invoice clearance.`
      );
    }
  };

  const handlePrintLetter = () => {
    const printContent = `
      <html>
        <head>
          <title>ELS-KYN Correspondence Letter</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; font-size: 14px; line-height: 1.6; color: #000; max-width: 800px; margin: auto; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px double #000; padding-bottom: 15px; }
            .header h1 { font-size: 18px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { font-size: 13px; margin: 5px 0 0 0; font-weight: normal; }
            .ref-date { margin-top: 20px; font-weight: bold; }
            .ref { float: left; }
            .date { float: right; }
            .recipient { margin-top: 40px; clear: both; font-weight: bold; }
            .subject { font-weight: bold; text-transform: uppercase; margin-top: 25px; margin-bottom: 25px; line-height: 1.4; padding-left: 20px; text-indent: -20px; }
            .body-text { white-space: pre-wrap; font-size: 14px; text-align: justify; margin-bottom: 50px; }
            .footer { margin-top: 60px; text-align: right; font-weight: bold; }
            .no-print-btn { display: block; text-align: center; margin-top: 40px; }
            .no-print-btn button { background: #0284c7; color: #fff; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-family: sans-serif; font-weight: bold; }
            @media print {
              .no-print-btn { display: none !important; }
              body { padding: 0px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="font-weight: bold; font-size: 20px; text-align: center;">CENTRAL RAILWAY</h1>
            <h2 style="text-align: center; font-size: 13px; margin-top: 5px;">OFFICE OF THE SENIOR DIVISIONAL ELECTRICAL ENGINEER (TRS)</h2>
            <h2 style="font-weight: bold; font-size: 14px; margin-top: 3px; text-align: center;">ELECTRIC LOCO SHED, KALYAN (MUMBAI DIVISION)</h2>
          </div>
          <div class="ref-date">
            <div class="ref">No: ${letterRef}</div>
            <div class="date">Date: ${letterDate}</div>
          </div>
          <div style="clear: both; height: 10px;"></div>
          <div class="recipient" style="margin-top: 25px;">
            To,<br/>
            M/s ${letterContract?.firmName || 'Contractor'}<br/>
            Kalyan / Mumbai Region.
          </div>
          
          <div class="subject">
            SUB: ${letterSubject}
          </div>
          
          <div class="body-text">${letterBody}</div>
          
          <div class="footer">
            <span style="font-size: 12px; font-weight: normal; color: #333; display: block; margin-bottom: 45px;">For Sr. Div. Electrical Engineer (TRS) Kalyan</span>
            <div>
              (${letterSignatory})
            </div>
            <span style="font-size: 11px; font-weight: normal; color: #555;">Electric Loco Shed, Kalyan</span>
          </div>

          <div class="no-print-btn">
            <button onclick="window.print()">Print Letter / Save PDF</button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert('Could not open print preview window. Please allow popup access in browser.');
    }
  };

  const handleCopyLetterToClipboard = async () => {
    try {
      const formattedText = `CENTRAL RAILWAY\nOFFICE OF THE SENIOR DIVISIONAL ELECTRICAL ENGINEER (TRS)\nELECTRIC LOCO SHED, KALYAN (MUMBAI DIVISION)\n\nNo: ${letterRef}\nDate: ${letterDate}\n\nTo,\nM/s ${letterContract?.firmName || 'Contractor'}\nKalyan / Mumbai Region.\n\nSUB: ${letterSubject}\n\n${letterBody}\n\nFor Sr. Div. Electrical Engineer (TRS) Kalyan\n\n(${letterSignatory})\nElectric Loco Shed, Kalyan`;
      
      await navigator.clipboard.writeText(formattedText);
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2500);
    } catch (e) {
      alert('Failed to copy to clipboard.');
    }
  };  const handleExportStyledExcel = () => {
    try {
      const reportTitleUpper = reportTitle.toUpperCase();
      const totalSelectedValue = filteredContracts.reduce((acc, c) => acc + c.totalContractValueNumeric, 0);
      const totalExposure = filteredContracts.reduce((acc, c) => {
        const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
        if (gap > 0 && c.workStatus !== 'Not Started') {
          return acc + c.totalContractValueNumeric * (gap / 100);
        }
        return acc;
      }, 0);

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <!--[if gte mso 9]>
        <xml>
        <x:ExcelWorkbook>
        <x:ExcelWorksheets>
        <x:ExcelWorksheet>
        <x:Name>Liability Report</x:Name>
        <x:WorksheetOptions>
        <x:DisplayGridlines/>
        </x:WorksheetOptions>
        </x:ExcelWorksheet>
        </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
        <style>
          .hdr { font-family: serif; font-size: 16px; font-weight: bold; text-align: center; color: #000000; }
          .subhdr { font-family: Arial; font-size: 11px; text-align: center; color: #555555; }
          .title { font-family: Arial; font-size: 13px; font-weight: bold; text-align: center; background-color: #f1f5f9; padding: 10px; }
          .meta-box { font-family: monospace; font-size: 10px; color: #333333; background-color: #fafafa; border: 1px dashed #dddddd; padding: 8px; }
          .tbl-header { font-family: Arial; font-size: 11px; font-weight: bold; background-color: #0f172a; color: #ffffff; text-align: left; }
          .tbl-header th { padding: 8px; border: 1px solid #cbd5e1; }
          .cell { font-family: Arial; font-size: 11px; border: 1px solid #cbd5e1; padding: 6px; }
          .cell-bold { font-family: Arial; font-size: 11px; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; }
          .cell-mono { font-family: monospace; font-size: 11px; border: 1px solid #cbd5e1; padding: 6px; }
          .cell-mono-bold { font-family: monospace; font-size: 11px; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px; }
          .stat-val { font-family: monospace; font-size: 16px; font-weight: bold; color: #1e293b; text-align: center; }
          .stat-lbl { font-family: Arial; font-size: 9px; font-weight: bold; color: #475569; text-align: center; text-transform: uppercase; }
        </style>
        </head>
        <body>
          <table>
            <!-- CENTRAL RAILWAY BANNER -->
            <tr><td colspan="7" class="hdr" style="font-weight: bold; font-family: Times New Roman, serif; text-align: center; font-size: 16px;">CENTRAL RAILWAY</td></tr>
            <tr><td colspan="7" class="subhdr" style="text-align: center; font-family: Arial, sans-serif; font-size: 11px;">OFFICE OF THE SENIOR DIVISIONAL ELECTRICAL ENGINEER (TRS)</td></tr>
            <tr><td colspan="7" class="subhdr" style="text-align: center; font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">ELECTRIC LOCO SHED, KALYAN (MUMBAI DIVISION)</td></tr>
            <tr><td colspan="7" style="height: 15px;"></td></tr>
            
            <!-- REPORT TITLE -->
            <tr><td colspan="7" class="title" style="text-align: center; background-color: #f1f5f9; padding: 10px; font-weight: bold; font-family: Arial, sans-serif; font-size: 13px;">${reportTitleUpper}</td></tr>
            <tr><td colspan="7" style="height: 10px;"></td></tr>
            
            <!-- REFERENCE MEMO -->
            <tr>
              <td colspan="7" style="border: 1px dashed #aaaaaa; background-color: #fcfcfc; padding: 10px; font-family: Arial, sans-serif; font-size: 11px;">
                <b>Ref Directive Note:</b> ${reportNote}<br>
                <b>Export Date:</b> ${new Date().toLocaleString()} Mumbai Zone | <b>Classification:</b> HIGHLY CONFIDENTIAL (ELS/KYN Admin Only) | <b>Selected Type:</b> ${billingFilter.toUpperCase()}
              </td>
            </tr>
            <tr><td colspan="7" style="height: 15px;"></td></tr>

            <!-- STAT CARDS -->
            <tr style="background-color: #f8fafc; font-weight: bold;">
              <td colspan="2" style="border: 1px solid #cbd5e1; text-align: center; padding: 12px; font-weight: bold; height: 50px;">
                <span style="font-size: 9px; color: #475569; text-transform: uppercase; font-family: Arial, sans-serif;">Total Audited Works</span><br>
                <span style="font-size: 14px; font-family: monospace; font-weight: bold; color: #111111;">${filteredContracts.length} Works</span>
              </td>
              <td colspan="3" style="border: 1px solid #cbd5e1; text-align: center; padding: 12px; font-weight: bold; height: 50px;">
                <span style="font-size: 9px; color: #475569; text-transform: uppercase; font-family: Arial, sans-serif;">Sum Valuation (Joint Valuation Limit)</span><br>
                <span style="font-size: 14px; font-family: monospace; font-weight: bold; color: #0d9488;">${formatIndianCurrency(totalSelectedValue)}</span>
              </td>
              <td colspan="2" style="border: 1px solid #cbd5e1; text-align: center; padding: 12px; font-weight: bold; height: 50px;">
                <span style="font-size: 9px; color: #475569; text-transform: uppercase; font-family: Arial, sans-serif;">Withheld Liability Exposure</span><br>
                <span style="font-size: 14px; font-family: monospace; font-weight: bold; color: #c21807;">${formatIndianCurrency(totalExposure)}</span>
              </td>
            </tr>
            <tr><td colspan="7" style="height: 20px;"></td></tr>

            <!-- MAIN TABLE HEADERS -->
            <tr style="background-color: #0c4a6e; color: #ffffff; font-weight: bold;">
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 45px; text-align: center; background-color: #0c4a6e; color: #ffffff;">S.N</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 350px; text-align: left; background-color: #0c4a6e; color: #ffffff;">Section & Contract Name / Work Description</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 220px; text-align: left; background-color: #0c4a6e; color: #ffffff;">LOA No & Date</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 180px; text-align: left; background-color: #0c4a6e; color: #ffffff;">Executing Firm / Contractor</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 130px; text-align: right; background-color: #0c4a6e; color: #ffffff;">Valuation</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 130px; text-align: center; background-color: #0c4a6e; color: #ffffff;">Prog (Physical% / Financial%)</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 150px; text-align: left; background-color: #0c4a6e; color: #ffffff;">Billing Status & remarks</th>
            </tr>
      `;

      filteredContracts.forEach((c, index) => {
        const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
        const isHighGap = gap >= 15 && c.workStatus !== 'Not Started';
        const rowColor = (index % 2 === 0) ? '#ffffff' : '#f8fafc';
        const valColor = isHighGap ? '#fef2f2' : '#ffffff';
        const gapTextColor = gap >= 15 ? '#c21807' : gap > 0 ? '#b45309' : '#15803d';

        html += `
          <tr style="background-color: ${rowColor};">
            <td style="text-align: center; border: 1px solid #cbd5e1; font-family: monospace; padding: 8px;">${index + 1}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 8px; font-weight: bold;"><b>[${c.section}] ${c.workName}</b></td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 8px; color: #555555;">${c.loaNumberAndDate}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 8px;">${c.firmName}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafafa; font-family: monospace; padding: 8px;">${c.totalContractValue}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; background-color: ${valColor}; font-family: monospace; padding: 8px;">
              P: <b>${c.physicalProgress}</b><br>
              F: <b>${c.financialProgress}</b><br>
              <font color="${gapTextColor}"><b>Gap: ${gap > 0 ? '+' : ''}${gap.toFixed(0)}%</b></font>
            </td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 8px; font-weight: bold; color: #0c4a6e; background-color: ${valColor};">
              ${c.pendingBillStatus || 'Cleared'}
            </td>
          </tr>
        `;
      });

      html += `
            <tr><td colspan="7" style="height: 35px;"></td></tr>
            <!-- SIGN SIGNATORY -->
            <tr>
              <td colspan="4" style="font-size: 10px; color: #b91c1c; font-weight: bold; text-align: left; vertical-align: top; font-family: Arial, sans-serif;">
                Highly Confidential Report only to be shared within ELS/KYN Administration.
              </td>
              <td colspan="3" style="text-align: right; font-weight: bold; font-family: Arial, sans-serif; font-size: 11px;">
                Senior Section Engineer (Works) / SSE / ELS-KYN<br>
                Office of Senior Divisional Electrical Engineer (TRS) Kalyan<br>
                Central Railway
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const link = document.createElement("a");
      const filename = `ELS_KYN_Liability_Compliance_Audit_${new Date().toISOString().slice(0, 10)}.xls`;
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error exporting styled Excel sheet.');
    }
  };

  const handlePrintReport = () => {
    const totalSelectedValue = filteredContracts.reduce((acc, c) => acc + c.totalContractValueNumeric, 0);
    const totalExposure = filteredContracts.reduce((acc, c) => {
      const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
      if (gap > 0 && c.workStatus !== 'Not Started') {
        return acc + c.totalContractValueNumeric * (gap / 100);
      }
      return acc;
    }, 0);
    
    // Rows of contract HTML
    const rowsHtml = filteredContracts.map((c, index) => {
      const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
      return `
        <tr style="page-break-inside: avoid;">
          <td style="border: 1px solid #aaa; padding: 6px; text-align: center; font-family: monospace; font-size: 10px;">${index + 1}</td>
          <td style="border: 1px solid #aaa; padding: 6px; font-weight: bold; font-size: 10.5px;">
            [${c.section}] ${c.workName}
            <div style="font-weight: normal; font-size: 9.5px; color: #444; margin-top: 3px;">
              LOA Reference: ${c.loaNumberAndDate}
            </div>
          </td>
          <td style="border: 1px solid #aaa; padding: 6px; font-size: 10px;">${c.firmName}</td>
          <td style="border: 1px solid #aaa; padding: 6px; text-align: right; font-family: monospace; font-size: 10.5px; font-weight: bold;">${c.totalContractValue}</td>
          <td style="border: 1px solid #aaa; padding: 6px; text-align: center; font-family: monospace; font-size: 10.5px; color: #111;">P: ${c.physicalProgress}<br/>F: ${c.financialProgress}</td>
          <td style="border: 1px solid #aaa; padding: 6px; text-align: center; font-family: monospace; font-size: 10.5px; font-weight: bold; color: ${gap >= 15 ? '#c21807' : gap > 0 ? '#b45309' : '#15803d'}; font-weight: bold;">
            ${gap > 0 ? '+' : ''}${gap.toFixed(0)}%
          </td>
          <td style="border: 1px solid #aaa; padding: 6px; font-size: 10px; font-weight: bold; color: #222;">${c.pendingBillStatus || 'Cleared'}</td>
        </tr>
      `;
    }).join('');

    // Compute section data for physical/financial summary chart
    const sectionData: Record<string, { physical: number; financial: number; count: number }> = {};
    filteredContracts.forEach(c => {
      const s = c.section || 'General';
      if (!sectionData[s]) sectionData[s] = { physical: 0, financial: 0, count: 0 };
      sectionData[s].physical += c.physicalProgressNumeric;
      sectionData[s].financial += c.financialProgressNumeric;
      sectionData[s].count++;
    });

    const numSections = Object.keys(sectionData).length;
    const chartHeight = 55 + numSections * 38;

    const sectionBarsHtml = Object.entries(sectionData).map(([section, data], idx) => {
      const avgPhys = data.count > 0 ? Math.round(data.physical / data.count) : 0;
      const avgFin = data.count > 0 ? Math.round(data.financial / data.count) : 0;
      const y = 30 + idx * 38;
      return `
        <text x="10" y="${y + 11}" font-family="Arial, sans-serif" font-size="9px" font-weight="bold" fill="#334155">${section}</text>
        <rect x="85" y="${y}" width="180" height="6" rx="1.5" fill="#e2e8f0" />
        <rect x="85" y="${y}" width="${avgPhys * 1.8}" height="6" rx="1.5" fill="#0d9488" />
        
        <rect x="85" y="${y + 8}" width="180" height="6" rx="1.5" fill="#e2e8f0" />
        <rect x="85" y="${y + 8}" width="${avgFin * 1.8}" height="6" rx="1.5" fill="#2563eb" />
        
        <text x="270" y="${y + 6}" font-family="monospace" font-size="7.5px" fill="#0d9488" font-weight="bold">${avgPhys}% P</text>
        <text x="270" y="${y + 14}" font-family="monospace" font-size="7.5px" fill="#2563eb" font-weight="bold">${avgFin}% F</text>
      `;
    }).join('');

    const svgSecChartHtml = `
      <svg width="340" height="${chartHeight}" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; box-sizing: border-box;">
        <text x="10" y="15" font-family="Arial, sans-serif" font-size="10px" font-weight="bold" fill="#0f172a">SEC-WISE AVG PROGRESS</text>
        <rect x="180" y="7" width="6" height="6" rx="1" fill="#0d9488" />
        <text x="190" y="12" font-family="Arial, sans-serif" font-size="7.5px" fill="#475569">Phys</text>
        <rect x="235" y="7" width="6" height="6" rx="1" fill="#2563eb" />
        <text x="245" y="12" font-family="Arial, sans-serif" font-size="7.5px" fill="#475569">Fin Paid</text>
        
        ${sectionBarsHtml}
      </svg>
    `;

    const numSeverelyDelayed = filteredContracts.filter(c => (c.physicalProgressNumeric - c.financialProgressNumeric) >= 20).length;
    const numDelayed = filteredContracts.filter(c => {
      const gap = c.physicalProgressNumeric - c.financialProgressNumeric;
      return gap > 0 && gap < 20;
    }).length;
    const numCleared = filteredContracts.filter(c => (c.physicalProgressNumeric - c.financialProgressNumeric) <= 0).length;

    const totalPie = numSeverelyDelayed + numDelayed + numCleared;
    const pctSevere = totalPie > 0 ? Math.round((numSeverelyDelayed / totalPie) * 100) : 0;
    const pctDelayed = totalPie > 0 ? Math.round((numDelayed / totalPie) * 100) : 0;
    const pctCleared = totalPie > 0 ? Math.round((numCleared / totalPie) * 100) : 0;

    const svgDonutHtml = `
      <svg width="340" height="${chartHeight}" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; box-sizing: border-box;">
        <text x="10" y="15" font-family="Arial, sans-serif" font-size="10px" font-weight="bold" fill="#0f172a">COMPLIANCE DISTRIBUTION GAP RATIO</text>
        
        <circle cx="20" cy="45" r="5" fill="#ef4444" />
        <text x="32" y="48" font-family="Arial, sans-serif" font-size="8.5px" fill="#334155" font-weight="bold">Severe Lag (&ge; 20%): ${numSeverelyDelayed} (${pctSevere}%)</text>
        
        <circle cx="20" cy="70" r="5" fill="#f59e0b" />
        <text x="32" y="73" font-family="Arial, sans-serif" font-size="8.5px" fill="#334155" font-weight="bold">Moderate Lag (&gt; 0%): ${numDelayed} (${pctDelayed}%)</text>
        
        <circle cx="20" cy="95" r="5" fill="#10b981" />
        <text x="32" y="98" font-family="Arial, sans-serif" font-size="8.5px" fill="#334155" font-weight="bold">Cleared / Billing Synced: ${numCleared} (${pctCleared}%)</text>
        
        <rect x="20" y="125" width="280" height="14" rx="3.5" fill="#e2e8f0" />
        ${pctSevere > 0 ? `<rect x="20" y="125" width="${pctSevere * 2.8}" height="14" rx="2" fill="#ef4444" />` : ''}
        ${pctDelayed > 0 ? `<rect x="${20 + pctSevere * 2.8}" y="125" width="${pctDelayed * 2.8}" height="14" rx="2" fill="#f59e0b" />` : ''}
        ${pctCleared > 0 ? `<rect x="${20 + (pctSevere + pctDelayed) * 2.8}" y="125" width="${pctCleared * 2.8}" height="14" rx="2" fill="#10b981" />` : ''}
      </svg>
    `;

    const reportContent = `
      <html>
        <head>
          <title>Central Railway - Contract Audit Report</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; padding: 25px; line-height: 1.4; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; }
            .title-text { text-align: center; text-transform: uppercase; font-family: serif; }
            .stats-container { display: flex; gap: 15px; margin-bottom: 20px; }
            .stat-card { flex: 1; border: 1px solid #aaa; padding: 10px; border-radius: 4px; text-align: center; background-color: #fcfcfc; }
            .stat-value { font-size: 15px; font-weight: bold; margin-top: 4px; font-family: monospace; }
            .stat-label { font-size: 8.5px; text-transform: uppercase; color: #555; font-weight: bold; letter-spacing: 0.5px; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .report-table th { border: 1px solid #666; background-color: #f0f0f0; padding: 6px; text-align: left; font-size: 9.5px; text-transform: uppercase; }
            .footer-sig { margin-top: 45px; page-break-inside: avoid; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0px; }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 70px; text-align: center; vertical-align: middle;">
                <span style="font-size: 26px; font-weight: bold; line-height: 1;">CR</span>
              </td>
              <td class="title-text">
                <div style="font-size: 15px; font-weight: bold; letter-spacing: 0.5px;">CENTRAL RAILWAY</div>
                <div style="font-size: 11px; font-weight: bold; margin-top: 3px;">ELECTRIC LOCO SHED, KALYAN (TRS BRANCH)</div>
                <div style="font-size: 10px; margin-top: 3px; color: #333;">Contracts Management & Operational Liability Compliance Audit</div>
              </td>
              <td style="width: 70px; text-align: right; vertical-align: middle;">
                <span style="font-size: 11px; font-weight: bold; font-family: monospace;">ELS-KYN</span>
              </td>
            </tr>
          </table>

          <div style="font-size: 13px; font-weight: bold; text-align: center; margin-bottom: 12px; text-transform: uppercase; color: #111; letter-spacing: 0.2px;">
            ${reportTitle}
          </div>

          <div style="margin-bottom: 15px; font-size: 10px; color: #333; border: 1px dashed #bbb; padding: 8px; border-radius: 4px; line-height: 1.5; background-color: #fafafa;">
            <strong>Ref Directive Note:</strong> ${reportNote || 'N/A'}<br/>
            <strong>Export Timestamp:</strong> ${new Date().toLocaleString()} Mumbai Zone • <strong>Active Quick Filter Type:</strong> ${billingFilter.toUpperCase()}
          </div>

          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-label">Contracts Audited</div>
              <div class="stat-value">${filteredContracts.length} Works</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Joint Valuation</div>
              <div class="stat-value">${formatIndianCurrency(totalSelectedValue)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Withheld Unbilled Liability</div>
              <div class="stat-value" style="color: #c21807;">${formatIndianCurrency(totalExposure)}</div>
            </div>
          </div>

          <!-- Dynamic Colorful Vector SVG Charts Row -->
          <div style="display: flex; gap: 15px; margin-bottom: 25px; justify-content: center; flex-wrap: wrap; page-break-inside: avoid;">
            ${svgSecChartHtml}
            ${svgDonutHtml}
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">S.N</th>
                <th>Section & Brief Description of Work</th>
                <th style="width: 140px;">Executing Firm</th>
                <th style="width: 110px; text-align: right;">Contract Value</th>
                <th style="width: 85px; text-align: center;">Progress %</th>
                <th style="width: 55px; text-align: center;">Variance</th>
                <th style="width: 110px;">Billing / BG Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-sig">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; font-size: 10px; color: #b91c1c; font-weight: bold; vertical-align: bottom; font-family: Arial, sans-serif;">
                  * Highly Confidential Report only to be shared within ELS/KYN Administration.
                </td>
                <td style="text-align: right; width: 50%;">
                  <div style="font-weight: bold; font-size: 11px;">Central Railway • Electric Loco Shed, Kalyan</div>
                  <div style="margin-top: 55px; font-weight: bold; font-size: 10.5px;">_______________________________________</div>
                  <div style="font-size: 10px; color: #333; margin-top: 4px; font-weight: bold;">Senior Section Engineer (Works) / SSE / ELS-KYN</div>
                  <div style="font-size: 9px; color: #555; margin-top: 2px;">Office of Senior Divisional Electrical Engineer (TRS)</div>
                </td>
              </tr>
            </table>
          </div>

          <div class="no-print" style="margin-top: 35px; text-align: center;">
            <button onclick="window.print()" style="background: #111; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-weight: bold; font-size: 12px; cursor: pointer; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              Click to Print or Save PDF
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
    } else {
      alert('Could not open print preview.');
    }
  };

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
              className="bg-white dark:bg-slate-900 hover:bg-slate-150 text-slate-900 dark:text-slate-100 text-xxs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              title="Generic raw comma-separated value spreadsheet export"
            >
              <Download className="w-3.5 h-3.5 text-slate-850 dark:text-slate-350" />
              CSV Raw
            </button>

            <button
              onClick={handleExportStyledExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-transparent"
              title="Formatted, colorized high-fidelity spreadsheet mimicking the official print report style"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
              Export Styled Excel
            </button>

            <button
              onClick={() => {
                let dynamicTitle = 'ELS/KYN CONTRACTS — GENERAL CORE STATUS AUDIT REPORT';
                if (billingFilter === 'bg') dynamicTitle = 'ELS/KYN CONTRACTS — OUTSTANDING BG/IB DELAY AUDIT REPORT';
                if (billingFilter === 'bottlenecks') dynamicTitle = 'ELS/KYN CONTRACTS — CRITICAL BILLING GAP REPORT';
                if (billingFilter === 'prep') dynamicTitle = 'ELS/KYN CONTRACTS — BILLS IN PREPARATION LIST';
                setReportTitle(dynamicTitle);
                setShowPrintReportModal(true);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xxs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-transparent"
              title="Export dynamic colorful PDF audit of the selected items"
            >
              <Printer className="w-3.5 h-3.5 text-teal-100" />
              Export PDF Report
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

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xxs text-slate-450 dark:text-slate-400 font-semibold font-mono hidden md:inline">Quick Filter:</span>
              <div className="inline-flex rounded-xl bg-slate-50 dark:bg-slate-950 p-1 font-mono text-xxs font-medium border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setBillingFilter('All')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'All' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-305'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setBillingFilter('bottlenecks')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'bottlenecks' ? 'bg-amber-50 dark:bg-amber-955/40 text-amber-800 dark:text-amber-400 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Billing lag
                </button>
                <button 
                  onClick={() => setBillingFilter('prep')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'prep' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-305'}`}
                >
                  In Prep
                </button>
                <button 
                  onClick={() => setBillingFilter('bg')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${billingFilter === 'bg' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-355'}`}
                >
                  BG Delays
                </button>
              </div>
            </div>

            <button
              onClick={handleExportStyledExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-transparent cursor-pointer"
              title="Formatted, colorized high-fidelity spreadsheet mimicking the official print report style"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => {
                let dynamicTitle = 'ELS/KYN CONTRACTS — GENERAL CORE STATUS AUDIT REPORT';
                if (billingFilter === 'bg') dynamicTitle = 'ELS/KYN CONTRACTS — OUTSTANDING BG/IB DELAY AUDIT REPORT';
                if (billingFilter === 'bottlenecks') dynamicTitle = 'ELS/KYN CONTRACTS — CRITICAL BILLING GAP REPORT';
                if (billingFilter === 'prep') dynamicTitle = 'ELS/KYN CONTRACTS — BILLS IN PREPARATION LIST';
                setReportTitle(dynamicTitle);
                setShowPrintReportModal(true);
              }}
              className="bg-slate-100 hover:bg-slate-205 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
              title="Print dynamic PDF audit of the selected items"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export {billingFilter === 'bg' ? 'BG Delays' : 'Report'} PDF</span>
            </button>
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
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button 
                            className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-black px-2 py-1 rounded border border-slate-200 dark:border-slate-805 text-slate-600 dark:text-slate-300 text-xxs font-medium font-mono cursor-pointer transition-all flex items-center gap-1 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLetterModal(c, 'BG');
                            }}
                            title="Compose dynamic official Railways letter regarding Bank Guarantee or Indemnity Bond outstanding/delay."
                          >
                            <Mail className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>LETTER</span>
                          </button>
                          
                          <button 
                            className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-black px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xxs font-medium font-mono cursor-pointer transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectContract(c);
                            }}
                          >
                            BRIEFING
                          </button>
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

      {/* 1. OFFICIAL PRINT/PDF REPORT PREVIEW MODAL */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowPrintReportModal(false)} 
          />
          
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[90vh] z-15 animate-in fade-in-50 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans tracking-tight">Export PDF Official Audit Report</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Format, annotate, and print local compliance documentation</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPrintReportModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Setup & Live Dynamic Preview Area */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Inputs to customize report */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 space-y-4">
                <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest font-mono block">Configure Report Parameters</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Custom Document Header / Title</label>
                    <input 
                      type="text" 
                      value={reportTitle} 
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Reference / Compliance Mandate note</label>
                    <input 
                      type="text" 
                      value={reportNote} 
                      onChange={(e) => setReportNote(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Document Print Layout Preview */}
              <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-xl bg-white text-black space-y-4 shadow-inner max-h-80 overflow-y-auto">
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block text-right">Draft Print-out Sheet Preview</span>
                
                {/* Simulated Sheet Paper */}
                <div className="font-sans leading-normal">
                  <div className="text-center border-b-2 border-black pb-3 mb-4">
                    <h2 className="font-bold text-lg leading-tight uppercase tracking-wider">Central Railway</h2>
                    <h3 className="text-xs font-semibold uppercase">Electric Loco Shed, Kalyan (TRS Branch)</h3>
                    <p className="text-[10px] text-slate-600 uppercase">Contracts Monitoring & Operational Liability Compliance</p>
                  </div>

                  <div className="text-center font-bold text-xs underline mb-3 uppercase tracking-wide">
                    {reportTitle}
                  </div>

                  <p className="text-[10px] text-slate-700 mb-4 bg-slate-50 p-2 rounded border border-dashed border-slate-300">
                    <strong>Directive:</strong> {reportNote}<br/>
                    <strong>Audited Elements:</strong> {filteredContracts.length} works matching active filters ({billingFilter.toUpperCase()})
                  </p>

                  {/* Tiny Table Preview */}
                  <table className="w-full text-[9px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-mono text-left">
                        <th className="border border-slate-350 p-1 text-center font-bold">SN</th>
                        <th className="border border-slate-350 p-1 font-bold">Section & Work Brief</th>
                        <th className="border border-slate-350 p-1 font-bold">Firm</th>
                        <th className="border border-slate-350 p-1 text-right font-bold">Value</th>
                        <th className="border border-slate-350 p-1 text-center font-bold">Prog (P/F)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.slice(0, 4).map((c, idx) => (
                        <tr key={c.id}>
                          <td className="border border-slate-300 p-1 text-center">{idx + 1}</td>
                          <td className="border border-slate-300 p-1 font-semibold">[{c.section}] {c.workName}</td>
                          <td className="border border-slate-300 p-1">{c.firmName}</td>
                          <td className="border border-slate-300 p-1 text-right font-mono font-semibold">{c.totalContractValue}</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">P:{c.physicalProgress} / F:{c.financialProgress}</td>
                        </tr>
                      ))}
                      {filteredContracts.length > 4 && (
                        <tr>
                          <td colSpan={5} className="border border-slate-300 p-1.5 text-center text-slate-500 italic text-[8.5px]">
                            ...and {filteredContracts.length - 4} other active contract rows matching current query
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="mt-6 flex justify-between items-end">
                    <span className="text-[8px] text-slate-400 italic">Central Railway ELS/KYN Contracts Engine</span>
                    <div className="text-right">
                      <p className="font-bold text-[9.5px]">For Sr. DEE (TRS) Kalyan</p>
                      <p className="text-[8px] text-slate-500">Kalyan (Central Railway)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button 
                onClick={() => setShowPrintReportModal(false)}
                className="py-2 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-xxs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrintReport}
                className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white text-xxs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5 text-teal-100" />
                <span>Open Print Window & Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* 2. EXCELLENT PROFESSIONAL CORRESPONDENCE LETTER GENERATOR */}
      {showLetterModal && letterContract && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowLetterModal(false)} 
          />
          
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[95vh] z-15 animate-in fade-in-50 duration-200">
            {/* Header banner */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-teal-900/10 to-slate-900 text-slate-800 dark:text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-sans tracking-tight">Contractor Delay Correspondence Generator</h3>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">Draft professional reprimands / deposit letters automatically in seconds</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLetterModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Template Selector Tabs */}
            <div className="px-6 pt-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => handleSwitchLetterType('BG')}
                className={`py-2 px-3 text-xxs font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  letterType === 'BG' 
                    ? 'border-teal-500 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Bank Guarantee (BG/PBG) Delays Template
              </button>
              <button
                onClick={() => handleSwitchLetterType('IB')}
                className={`py-2 px-3 text-xxs font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  letterType === 'IB' 
                    ? 'border-teal-500 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Indemnity Bond (IB) Release Template
              </button>
            </div>

            {/* Scrollable Letter fields & Body Editor */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Warnings regarding actual Physical Progress vs Financial state */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[10px] text-amber-850 dark:text-amber-400 leading-relaxed">
                  <strong>Contractor:</strong> {letterContract.firmName} | <strong>LOA Number:</strong> {letterContract.loaNumberAndDate || 'N/A'}<br/>
                  <strong>Intelligent Auditor:</strong> Physical work reached <strong className="text-teal-700 dark:text-teal-400">{letterContract.physicalProgress}</strong> but payment released is <strong className="text-blue-700 dark:text-blue-400">{letterContract.financialProgress}</strong>. Delay in BG/IB submission exposes the Railway to severe audit bottlenecks and represents an operational deficit.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Letter Reference No.</label>
                  <input 
                    type="text" 
                    value={letterRef} 
                    onChange={(e) => setLetterRef(e.target.value)}
                    className="w-full text-xxs font-mono rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Date of Dispatch</label>
                  <input 
                    type="text" 
                    value={letterDate} 
                    onChange={(e) => setLetterDate(e.target.value)}
                    className="w-full text-xxs font-mono rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Signing Authority</label>
                  <input 
                    type="text" 
                    value={letterSignatory} 
                    onChange={(e) => setLetterSignatory(e.target.value)}
                    className="w-full text-xxs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Subject Line</label>
                <input 
                  type="text" 
                  value={letterSubject} 
                  onChange={(e) => setLetterSubject(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono block mb-1">Letter Content Body (Strictly Editable)</label>
                <textarea 
                  rows={9}
                  value={letterBody} 
                  onChange={(e) => setLetterBody(e.target.value)}
                  className="w-full text-xs font-sans leading-relaxed rounded-lg border border-slate-200 dark:border-slate-700 p-3.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 h-64 focus:bg-slate-50/20"
                />
              </div>
            </div>

            {/* Actions bar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button 
                onClick={() => setShowLetterModal(false)}
                className="py-2 px-4 bg-slate-205 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xxs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                Close
              </button>
              
              <button 
                onClick={handleCopyLetterToClipboard}
                className="py-2 px-4 bg-slate-900 dark:bg-slate-900 hover:bg-black text-white text-xxs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{copiedLetter ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>

              <button 
                onClick={handlePrintLetter}
                className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white text-xxs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5 text-teal-100" />
                <span>Open Print & Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
