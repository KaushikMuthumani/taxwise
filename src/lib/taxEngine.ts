// ============================================
// TAX ENGINE — Core calculation logic
// Freelancer Tax SaaS — FY 2024-25
// ============================================

// ----------------------------
// TYPES
// ----------------------------

export type Profession =
  | "software_developer"
  | "designer"
  | "consultant"
  | "doctor"
  | "lawyer"
  | "engineer"
  | "architect"
  | "accountant"
  | "content_creator" // grey area — needs CA validation
  | "other";

export type IncomeSource = {
  type: "freelance_indian" | "freelance_foreign" | "gig" | "creator" | "salary" | "other";
  amount: number; // in INR
  tdsDeducted: number; // TDS already cut by client
  description?: string;
};

export type Expense = {
  category:
    | "software"
    | "internet"
    | "phone"
    | "travel"
    | "home_office"
    | "equipment"
    | "other";
  amount: number;
  description?: string;
};

export type Deduction = {
  section_80C: number;       // max 150,000
  section_80D: number;       // max 25,000
  hra: number;               // if applicable
  standard_deduction: number; // 50,000 if salaried
  other: number;
};

export type UserTaxProfile = {
  profession: Profession;
  incomeSources: IncomeSource[];
  expenses: Expense[];
  deductions: Deduction;
  advanceTaxPaid: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  financialYear: string; // e.g. "2024-25"
};

export type AdvanceTaxQuarter = {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  deadline: string;
  cumulativePercentage: number;
  totalDueByDeadline: number;
  alreadyPaid: number;
  amountDueThisQuarter: number;
  isPast: boolean;
  daysRemaining: number | null;
  paymentLink: string;
};

export type TaxResult = {
  // Income
  grossIncome: number;
  professionalIncome: number;
  otherIncome: number;

  // 44ADA
  is44ADAEligible: boolean;
  presumptiveIncome: number;
  presumptiveSavings: number; // how much less they pay tax on vs actual income

  // Regime comparison
  taxableIncomeNew: number;
  taxableIncomeOld: number;
  newRegimeTax: number;
  oldRegimeTax: number;
  recommendedRegime: "new" | "old";
  regimeSavings: number;

  // Final numbers
  totalTDSDeducted: number;
  taxPayable: number;
  refundDue: number;

  // Advance tax
  advanceTaxRequired: boolean;
  advanceTaxSchedule: AdvanceTaxQuarter[];

  // Summary for display
  effectiveTaxRate: number;
  totalDeductions: number;
};

// ----------------------------
// CONSTANTS
// ----------------------------

const NEW_REGIME_SLABS_2024_25 = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
];

const OLD_REGIME_SLABS_2024_25 = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

const CESS_RATE = 0.04; // 4% health and education cess
const ADVANCE_TAX_THRESHOLD = 10000; // pay advance tax if liability > ₹10,000

// Professions eligible under Section 44ADA
const ELIGIBLE_44ADA_PROFESSIONS: Profession[] = [
  "software_developer",
  "designer",
  "consultant",
  "doctor",
  "lawyer",
  "engineer",
  "architect",
  "accountant",
  // content_creator excluded — grey area, validate with CA
];

const MAX_44ADA_INCOME = 7500000; // ₹75 lakhs

// Advance tax deadlines FY 2024-25
const ADVANCE_TAX_DEADLINES = [
  { quarter: "Q1" as const, deadline: "2024-06-15", cumulative: 0.15 },
  { quarter: "Q2" as const, deadline: "2024-09-15", cumulative: 0.45 },
  { quarter: "Q3" as const, deadline: "2024-12-15", cumulative: 0.75 },
  { quarter: "Q4" as const, deadline: "2025-03-15", cumulative: 1.00 },
];

// ----------------------------
// HELPER FUNCTIONS
// ----------------------------

function calculateSlabTax(income: number, slabs: typeof NEW_REGIME_SLABS_2024_25): number {
  if (income <= 0) return 0;

  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxableInSlab = Math.min(income, slab.max) - slab.min;
    tax += taxableInSlab * slab.rate;
  }
  return Math.round(tax);
}

function applyRebate87A(tax: number, taxableIncome: number, regime: "new" | "old"): number {
  // Section 87A rebate — zero tax if income <= ₹7L (new) or ₹5L (old)
  const threshold = regime === "new" ? 700000 : 500000;
  const maxRebate = regime === "new" ? 25000 : 12500;

  if (taxableIncome <= threshold) {
    return Math.max(0, tax - Math.min(tax, maxRebate));
  }
  return tax;
}

function applyCess(tax: number): number {
  return Math.round(tax * (1 + CESS_RATE));
}

function calculateAdvanceTaxSchedule(
  annualTaxLiability: number,
  alreadyPaid: UserTaxProfile["advanceTaxPaid"]
): AdvanceTaxQuarter[] {
  const today = new Date();
  const totalPaid = alreadyPaid.q1 + alreadyPaid.q2 + alreadyPaid.q3 + alreadyPaid.q4;

  return ADVANCE_TAX_DEADLINES.map((d, index) => {
    const deadline = new Date(d.deadline);
    const isPast = today > deadline;
    const daysRemaining = isPast
      ? null
      : Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const totalDueByDeadline = Math.round(annualTaxLiability * d.cumulative);
    const paidBeforeThisQuarter =
      index === 0 ? 0 :
      index === 1 ? alreadyPaid.q1 :
      index === 2 ? alreadyPaid.q1 + alreadyPaid.q2 :
      alreadyPaid.q1 + alreadyPaid.q2 + alreadyPaid.q3;

    const amountDueThisQuarter = Math.max(0, totalDueByDeadline - paidBeforeThisQuarter);

    return {
      quarter: d.quarter,
      deadline: d.deadline,
      cumulativePercentage: d.cumulative * 100,
      totalDueByDeadline,
      alreadyPaid: paidBeforeThisQuarter,
      amountDueThisQuarter,
      isPast,
      daysRemaining,
      paymentLink: "https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp",
    };
  });
}

// ----------------------------
// MAIN TAX ENGINE
// ----------------------------

export function calculateTax(profile: UserTaxProfile): TaxResult {

  // ---- Step 1: Compute income breakdown ----
  const professionalIncome = profile.incomeSources
    .filter((s) => s.type !== "salary")
    .reduce((sum, s) => sum + s.amount, 0);

  const salaryIncome = profile.incomeSources
    .filter((s) => s.type === "salary")
    .reduce((sum, s) => sum + s.amount, 0);

  const grossIncome = professionalIncome + salaryIncome;

  const totalTDSDeducted = profile.incomeSources
    .reduce((sum, s) => sum + s.tdsDeducted, 0);

  const totalExpenses = profile.expenses
    .reduce((sum, e) => sum + e.amount, 0);

  // ---- Step 2: 44ADA eligibility ----
  const is44ADAEligible =
    ELIGIBLE_44ADA_PROFESSIONS.includes(profile.profession) &&
    professionalIncome <= MAX_44ADA_INCOME &&
    professionalIncome > 0;

  const presumptiveIncome = is44ADAEligible
    ? Math.round(professionalIncome * 0.5)
    : professionalIncome;

  const presumptiveSavings = is44ADAEligible
    ? Math.round(professionalIncome * 0.5) // they save tax on this amount
    : 0;

  // ---- Step 3: Taxable income under both regimes ----
  // New regime: no deductions allowed (except standard deduction for salary)
  const standardDeductionNew = salaryIncome > 0 ? 50000 : 0;
  const taxableIncomeNew = Math.max(
    0,
    presumptiveIncome + salaryIncome - standardDeductionNew
  );

  // Old regime: deductions allowed
  const totalDeductions = Math.min(profile.deductions.section_80C, 150000)
    + Math.min(profile.deductions.section_80D, 25000)
    + profile.deductions.hra
    + (salaryIncome > 0 ? Math.min(profile.deductions.standard_deduction, 50000) : 0)
    + profile.deductions.other;

  const taxableIncomeOld = Math.max(
    0,
    presumptiveIncome + salaryIncome - totalDeductions
  );

  // ---- Step 4: Calculate tax under both regimes ----
  let newTaxBeforeCess = calculateSlabTax(taxableIncomeNew, NEW_REGIME_SLABS_2024_25);
  newTaxBeforeCess = applyRebate87A(newTaxBeforeCess, taxableIncomeNew, "new");
  const newRegimeTax = applyCess(newTaxBeforeCess);

  let oldTaxBeforeCess = calculateSlabTax(taxableIncomeOld, OLD_REGIME_SLABS_2024_25);
  oldTaxBeforeCess = applyRebate87A(oldTaxBeforeCess, taxableIncomeOld, "old");
  const oldRegimeTax = applyCess(oldTaxBeforeCess);

  // ---- Step 5: Recommend regime ----
  const recommendedRegime = newRegimeTax <= oldRegimeTax ? "new" : "old";
  const finalTax = Math.min(newRegimeTax, oldRegimeTax);
  const regimeSavings = Math.abs(newRegimeTax - oldRegimeTax);

  // ---- Step 6: Final tax payable after TDS ----
  const taxPayable = Math.max(0, finalTax - totalTDSDeducted);
  const refundDue = Math.max(0, totalTDSDeducted - finalTax);

  // ---- Step 7: Advance tax ----
  const advanceTaxRequired = taxPayable > ADVANCE_TAX_THRESHOLD;
  const advanceTaxSchedule = advanceTaxRequired
    ? calculateAdvanceTaxSchedule(taxPayable, profile.advanceTaxPaid)
    : [];

  // ---- Step 8: Effective tax rate ----
  const effectiveTaxRate = grossIncome > 0
    ? Math.round((finalTax / grossIncome) * 100 * 10) / 10
    : 0;

  return {
    grossIncome,
    professionalIncome,
    otherIncome: salaryIncome,
    is44ADAEligible,
    presumptiveIncome,
    presumptiveSavings,
    taxableIncomeNew,
    taxableIncomeOld,
    newRegimeTax,
    oldRegimeTax,
    recommendedRegime,
    regimeSavings,
    totalTDSDeducted,
    taxPayable,
    refundDue,
    advanceTaxRequired,
    advanceTaxSchedule,
    effectiveTaxRate,
    totalDeductions,
  };
}

// ----------------------------
// UTILITY — Format currency
// ----------------------------

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ----------------------------
// UTILITY — Get next advance tax deadline
// ----------------------------

export function getNextAdvanceTaxDeadline(schedule: AdvanceTaxQuarter[]): AdvanceTaxQuarter | null {
  return schedule.find((q) => !q.isPast && q.amountDueThisQuarter > 0) ?? null;
}
