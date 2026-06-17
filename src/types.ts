export interface Contract {
  id: string; // Unique generated or row-based ID
  section: string; // e.g. "PEX", "Body", "LAB"
  workName: string; // e.g. "CAMC of Medha make..."
  loaNumberAndDate: string; // e.g. "ELS-KYN-ELECTRICAL..."
  firmName: string; // e.g. "M/s MEDHA SERVO..."
  startDate: string; // e.g. "4-Jun-2021"
  endDate: string; // e.g. "3-Jun-2024"
  extendedUpto?: string; // e.g. "7-Oct-2024"
  totalContractValue: string; // Raw value: "₹42,48,011.00"
  totalContractValueNumeric: number; // Raw value converted: 4248011
  contractQty: string; // e.g. "40"
  contractQtyUnit: string; // e.g. "Months"
  qtyDoneTillDate: string; // e.g. "40"
  qtyBalance: string; // e.g. "0"
  billDoneQuantity: string; // e.g. "36"
  financialProgress: string; // raw % e.g. "90.00%"
  financialProgressNumeric: number; // e.g. 90
  physicalProgress: string; // raw % e.g. "100.00%"
  physicalProgressNumeric: number; // e.g. 100
  workStatus: 'In Progress' | 'Completed' | 'Not Started' | string;
  pendingBillStatus: string; // e.g. "Bill Under Preparation", "Acceptance pending"
  newProposalStatus: string; // e.g. "LOA Placed", "To Be Initiated"
  newProposalInitiationDate?: string;
  remarks: string;
  supervisor: string; // e.g. "Sourin", "Uday", "Sanjeev"
  remarksRefined?: string;
  allocationDemand?: string; // e.g. "050-555-32"
  timeElapsed: string; // raw % e.g. "150.61%"
  timeElapsedNumeric: number; // e.g. 150.61
  classificationType: string; // Derived automatically: "CAMC/AMC", "Repair & Rehab", "Supply & Commissioning", "Hiring Services", etc.
}

export interface DashboardFilters {
  searchQuery: string;
  section: string; // "All" or specific
  supervisor: string; // "All" or specific
  workStatus: string; // "All" or specific
  classificationType: string; // "All" or specific
  pendingBillStatus: string; // "All" or specific
  newProposalStatus: string; // "All" or specific
}

export interface SectionSummary {
  section: string;
  count: number;
  totalValue: number;
  avgPhysicalProgress: number;
  avgFinancialProgress: number;
  pendingBillsCount: number;
}

export interface SupervisorSummary {
  supervisor: string;
  count: number;
  totalValue: number;
  avgPhysicalProgress: number;
  avgFinancialProgress: number;
}
