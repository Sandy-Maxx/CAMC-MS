import { Contract } from '../types';

// Simple but custom robust character-by-character CSV cell splitter
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentCell = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check if it's an escaped quote ""
      if (inQuotes && line[i + 1] === '"') {
        currentCell += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentCell.trim());
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  result.push(currentCell.trim());
  return result;
}

// Full CSV text parser that handles line breaks within quotes
export function parseFullCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let inQuotes = false;
  let currentRow: string[] = [];
  let currentCell = '';

  // Standardize line endings
  const cleanText = csvText.replace(/\r\n/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];

    if (char === '"') {
      // Handle escaped double quotes
      if (inQuotes && cleanText[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Push final cell/row if anything remains
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  // Filter out completely empty rows
  return rows.filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''));
}

// Clean and categorize contracts
export function cleanCurrency(val: string): number {
  if (!val) return 0;
  // Remove currency symbols, commas, spaces
  const cleaned = val.replace(/[₹$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function cleanProgress(val: string): number {
  if (!val) return 0;
  // Remove %, spaces
  const cleaned = val.replace(/[\s%]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function deriveClassification(workName: string, section: string): string {
  const name = workName.toLowerCase();
  const sec = section.trim().toUpperCase();

  if (
    name.includes('camc') || 
    name.includes('amc') || 
    name.includes('maintenance') || 
    name.includes('maintanance') || 
    name.includes('maintainance') ||
    sec === 'PEX'
  ) {
    return 'Annual Maintenance Contract (AMC/CAMC)';
  }
  if (name.includes('repair') || name.includes('recondition') || name.includes('rehab') || name.includes('stripping') || name.includes('rewinding') || name.includes('refurbish') || name.includes('card') || name.includes('pcb')) {
    return 'Repair & Overhauling';
  }
  if (name.includes('painting') || name.includes(' pu ')) {
    return 'Painting Work';
  }
  if (name.includes('wash') || name.includes('clean') || name.includes('scrub')) {
    return 'Washing & Upkeeping';
  }
  if (name.includes('hiring') || name.includes('transport') || name.includes('trailer') || name.includes('taxi') || name.includes('vehicle') || name.includes('pickup')) {
    return 'Hiring & Transport';
  }
  if (name.includes('supply') || name.includes('install') || name.includes('commission') || name.includes('biometric') || name.includes('trap chamber') || name.includes('provision')) {
    return 'Supply & Projects';
  }
  if (name.includes('calib') || name.includes('test') || name.includes('certif')) {
    return 'Testing & Calibration';
  }

  // Fallback defaults based on Section
  if (sec === 'MW') return 'Hiring & Transport';
  if (sec === 'LAB' || sec === 'TOOLS') return 'Testing & Calibration';
  if (sec === 'BODY') return 'Washing & Upkeeping';
  
  return 'General Operations';
}

export function convertCSVRowsToContracts(rows: string[][]): Contract[] {
  if (rows.length <= 1) return [];

  // Find index of headers
  const headers = rows[0].map(h => h.trim().toLowerCase());
  
  const colIndex = (nameCandidates: string[]) => {
    return headers.findIndex(h => nameCandidates.some(candidate => h.includes(candidate.toLowerCase())));
  };

  const idxSection = colIndex(['section']);
  const idxWorkName = colIndex(['work name']);
  const idxLoa = colIndex(['loa number', 'loa number & date', 'loa no']);
  const idxFirm = colIndex(['firm name']);
  const idxStart = colIndex(['work start date', 'start date']);
  const idxEnd = colIndex(['end date']);
  const idxExtended = colIndex(['extended upto', 'extended']);
  const idxValue = colIndex(['total contract value', 'contract value']);
  const idxQty = colIndex(['contract qty', 'qty']);
  const idxUnit = colIndex(['contract qty unit', 'qty unit', 'unit']);
  const idxQtyDone = colIndex(['qty done till date', 'qty done']);
  const idxQtyBal = colIndex(['qty balance', 'balance qty']);
  const idxBillDone = colIndex(['bill done', 'bill done (quantity)']);
  const idxFinProgress = colIndex(['financial progress']);
  const idxPhyProgress = colIndex(['physical progress']);
  const idxStatus = colIndex(['work status', 'status']);
  const idxPendingBill = colIndex(['pending bill status', 'pending bill']);
  const idxNewPropStatus = colIndex(['new proposal status', 'proposal status']);
  const idxNewPropDate = colIndex(['new proposal initiation', 'initiation date']);
  const idxRemarks = colIndex(['remarks']);
  const idxSupervisor = colIndex(['superwisor', 'supervisor']);
  const idxRemarksRefined = colIndex(['remarks (refined)', 'refined remarks']);
  const idxAllocDemand = colIndex(['allocation', 'allocation demand']);
  const idxTimeElapsed = colIndex(['time elapsed']);

  const contracts: Contract[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < 3 || !row[idxWorkName]) continue; // skip metadata or broken rows

    const section = idxSection !== -1 ? row[idxSection] : 'Other';
    const workName = idxWorkName !== -1 ? row[idxWorkName] : '';
    const loa = idxLoa !== -1 ? row[idxLoa] : '';
    const firmName = idxFirm !== -1 ? row[idxFirm] : '';
    const startVal = idxStart !== -1 ? row[idxStart] : '';
    const endVal = idxEnd !== -1 ? row[idxEnd] : '';
    const extendedVal = idxExtended !== -1 ? row[idxExtended] : '';
    const rawVal = idxValue !== -1 ? row[idxValue] : '';
    const contractQty = idxQty !== -1 ? row[idxQty] : '';
    const contractQtyUnit = idxUnit !== -1 ? row[idxUnit] : '';
    const qtyDone = idxQtyDone !== -1 ? row[idxQtyDone] : '';
    const qtyBal = idxQtyBal !== -1 ? row[idxQtyBal] : '';
    const billDone = idxBillDone !== -1 ? row[idxBillDone] : '';
    const finProg = idxFinProgress !== -1 ? row[idxFinProgress] : '0.00%';
    const phyProg = idxPhyProgress !== -1 ? row[idxPhyProgress] : '0.00%';
    const status = idxStatus !== -1 ? row[idxStatus] : 'In Progress';
    const pendingBill = idxPendingBill !== -1 ? row[idxPendingBill] : '';
    const newPropStatus = idxNewPropStatus !== -1 ? row[idxNewPropStatus] : '';
    const newPropDate = idxNewPropDate !== -1 ? row[idxNewPropDate] : '';
    const remarksVal = idxRemarks !== -1 ? row[idxRemarks] : '';
    const superwisor = idxSupervisor !== -1 ? row[idxSupervisor] : 'Unassigned';
    const remarksRefined = idxRemarksRefined !== -1 ? row[idxRemarksRefined] : '';
    const allocDemand = idxAllocDemand !== -1 ? row[idxAllocDemand] : '';
    const timeElapsed = idxTimeElapsed !== -1 ? row[idxTimeElapsed] : '0.00%';

    const valNumeric = cleanCurrency(rawVal);
    const phyProgressNumeric = cleanProgress(phyProg);
    const finProgressNumeric = cleanProgress(finProg);
    const timeElapsedNumeric = cleanProgress(timeElapsed);

    contracts.push({
      id: `${r}-${section.replace(/\s+/g, '')}-${valNumeric}`,
      section: section || 'Unclassified',
      workName,
      loaNumberAndDate: loa,
      firmName,
      startDate: startVal,
      endDate: endVal,
      extendedUpto: extendedVal || undefined,
      totalContractValue: rawVal,
      totalContractValueNumeric: valNumeric,
      contractQty,
      contractQtyUnit,
      qtyDoneTillDate: qtyDone,
      qtyBalance: qtyBal,
      billDoneQuantity: billDone,
      financialProgress: finProg,
      financialProgressNumeric: finProgressNumeric,
      physicalProgress: phyProg,
      physicalProgressNumeric: phyProgressNumeric,
      workStatus: status || 'In Progress',
      pendingBillStatus: pendingBill,
      newProposalStatus: newPropStatus,
      newProposalInitiationDate: newPropDate || undefined,
      remarks: remarksVal,
      supervisor: superwisor || 'Unassigned',
      remarksRefined,
      allocationDemand: allocDemand || undefined,
      timeElapsed,
      timeElapsedNumeric,
      classificationType: deriveClassification(workName, section),
    });
  }

  return contracts;
}
