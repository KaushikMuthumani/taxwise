// ============================================
// TAX ENGINE TESTS
// Run with: npx ts-node --project tsconfig.test.json src/lib/taxEngine.test.ts
// ============================================

import { calculateTax, formatINR, UserTaxProfile } from "./taxEngine";

// ----------------------------
// TEST 1: Basic freelancer with 44ADA
// Software developer earning ₹10L from freelancing
// ----------------------------
const test1: UserTaxProfile = {
  profession: "software_developer",
  incomeSources: [
    {
      type: "freelance_indian",
      amount: 1000000,
      tdsDeducted: 100000,
    },
  ],
  expenses: [
    { category: "software", amount: 50000 },
    { category: "internet", amount: 12000 },
    { category: "equipment", amount: 80000 },
  ],
  deductions: {
    section_80C: 0,
    section_80D: 0,
    hra: 0,
    standard_deduction: 0,
    other: 0,
  },
  advanceTaxPaid: { q1: 0, q2: 0, q3: 0, q4: 0 },
  financialYear: "2024-25",
};

console.log("\n========== TEST 1: Software Dev ₹10L ==========");
const result1 = calculateTax(test1);
console.log("Gross Income:", formatINR(result1.grossIncome));
console.log("44ADA Eligible:", result1.is44ADAEligible);
console.log("Taxable Income (New):", formatINR(result1.taxableIncomeNew));
console.log("New Regime Tax:", formatINR(result1.newRegimeTax));
console.log("Old Regime Tax:", formatINR(result1.oldRegimeTax));
console.log("Recommended Regime:", result1.recommendedRegime);
console.log("Regime Savings:", formatINR(result1.regimeSavings));
console.log("TDS Deducted:", formatINR(result1.totalTDSDeducted));
console.log("Final Tax Payable:", formatINR(result1.taxPayable));
console.log("Refund Due:", formatINR(result1.refundDue));
console.log("Effective Tax Rate:", result1.effectiveTaxRate + "%");
console.log("Advance Tax Required:", result1.advanceTaxRequired);
if (result1.advanceTaxRequired) {
  console.log("Advance Tax Schedule:");
  result1.advanceTaxSchedule.forEach((q) => {
    console.log(`  ${q.quarter} (${q.deadline}): ₹${q.amountDueThisQuarter.toLocaleString("en-IN")} due`);
  });
}

// ----------------------------
// TEST 2: Freelancer below ₹7L — should get 87A rebate (zero tax)
// ----------------------------
const test2: UserTaxProfile = {
  profession: "designer",
  incomeSources: [
    {
      type: "freelance_indian",
      amount: 600000,
      tdsDeducted: 0,
    },
  ],
  expenses: [],
  deductions: {
    section_80C: 0,
    section_80D: 0,
    hra: 0,
    standard_deduction: 0,
    other: 0,
  },
  advanceTaxPaid: { q1: 0, q2: 0, q3: 0, q4: 0 },
  financialYear: "2024-25",
};

console.log("\n========== TEST 2: Designer ₹6L (should be zero tax) ==========");
const result2 = calculateTax(test2);
console.log("Gross Income:", formatINR(result2.grossIncome));
console.log("44ADA Eligible:", result2.is44ADAEligible);
console.log("Taxable Income (New):", formatINR(result2.taxableIncomeNew));
console.log("New Regime Tax:", formatINR(result2.newRegimeTax));
console.log("Tax Payable:", formatINR(result2.taxPayable));
console.log("EXPECTED: ₹0 tax due to 87A rebate");

// ----------------------------
// TEST 3: High income freelancer ₹30L
// ----------------------------
const test3: UserTaxProfile = {
  profession: "consultant",
  incomeSources: [
    {
      type: "freelance_indian",
      amount: 3000000,
      tdsDeducted: 300000,
    },
  ],
  expenses: [
    { category: "travel", amount: 200000 },
    { category: "software", amount: 100000 },
  ],
  deductions: {
    section_80C: 150000,
    section_80D: 25000,
    hra: 0,
    standard_deduction: 0,
    other: 0,
  },
  advanceTaxPaid: { q1: 50000, q2: 0, q3: 0, q4: 0 },
  financialYear: "2024-25",
};

console.log("\n========== TEST 3: Consultant ₹30L ==========");
const result3 = calculateTax(test3);
console.log("Gross Income:", formatINR(result3.grossIncome));
console.log("44ADA Eligible:", result3.is44ADAEligible);
console.log("Presumptive Income:", formatINR(result3.presumptiveIncome));
console.log("Presumptive Savings:", formatINR(result3.presumptiveSavings));
console.log("New Regime Tax:", formatINR(result3.newRegimeTax));
console.log("Old Regime Tax:", formatINR(result3.oldRegimeTax));
console.log("Recommended:", result3.recommendedRegime, "(saves", formatINR(result3.regimeSavings) + ")");
console.log("Tax Payable after TDS:", formatINR(result3.taxPayable));

// ----------------------------
// TEST 4: Gig worker — not 44ADA eligible
// ----------------------------
const test4: UserTaxProfile = {
  profession: "other",
  incomeSources: [
    {
      type: "gig",
      amount: 400000,
      tdsDeducted: 20000,
    },
  ],
  expenses: [
    { category: "travel", amount: 50000 },
    { category: "phone", amount: 12000 },
  ],
  deductions: {
    section_80C: 0,
    section_80D: 0,
    hra: 0,
    standard_deduction: 0,
    other: 0,
  },
  advanceTaxPaid: { q1: 0, q2: 0, q3: 0, q4: 0 },
  financialYear: "2024-25",
};

console.log("\n========== TEST 4: Gig Worker ₹4L ==========");
const result4 = calculateTax(test4);
console.log("Gross Income:", formatINR(result4.grossIncome));
console.log("44ADA Eligible:", result4.is44ADAEligible);
console.log("Tax Payable:", formatINR(result4.taxPayable));
console.log("Advance Tax Required:", result4.advanceTaxRequired);

console.log("\n✅ All tests completed. Verify numbers with a CA before shipping.");
