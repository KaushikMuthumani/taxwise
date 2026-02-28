// Realistic demo data for investor presentation
// Profile: Arjun Mehta, Senior Software Consultant, Mumbai

export const DEMO_PROFILE = {
  full_name: "Arjun Mehta",
  pan: "AMXPK7821F",
  profession: "software_developer",
  financial_year: "2024-25",
  preferred_regime: "new",
  itr_form: "ITR-4",
};

export const DEMO_INCOME = [
  { id: "1", type: "freelance_foreign", client_name: "Stripe Inc. (USA)", description: "API integration + backend", amount: 420000, tds_deducted: 0, date: "2024-05-15", source: "pdf_import" },
  { id: "2", type: "freelance_foreign", client_name: "Shopify (Canada)", description: "React storefront dev", amount: 380000, tds_deducted: 0, date: "2024-07-22", source: "pdf_import" },
  { id: "3", type: "freelance_indian", client_name: "Razorpay", description: "Integration consulting", amount: 250000, tds_deducted: 25000, date: "2024-08-01", source: "manual" },
  { id: "4", type: "freelance_indian", client_name: "Swiggy", description: "Data pipeline work", amount: 180000, tds_deducted: 18000, date: "2024-09-10", source: "manual" },
  { id: "5", type: "freelance_foreign", client_name: "Vercel (USA)", description: "Performance audit", amount: 290000, tds_deducted: 0, date: "2024-10-05", source: "pdf_import" },
  { id: "6", type: "freelance_indian", client_name: "HDFC Bank", description: "Mobile app consulting", amount: 200000, tds_deducted: 20000, date: "2024-11-20", source: "manual" },
  { id: "7", type: "creator", client_name: "YouTube", description: "AdSense revenue", amount: 48000, tds_deducted: 0, date: "2024-12-01", source: "manual" },
  { id: "8", type: "gig", client_name: "Toptal", description: "Marketplace earnings", amount: 110000, tds_deducted: 0, date: "2025-01-15", source: "pdf_import" },
];

export const DEMO_EXPENSES = [
  { id: "1", category: "software", description: "AWS EC2 + S3", amount: 36000, date: "2024-04-01" },
  { id: "2", category: "software", description: "GitHub Copilot + Notion + Linear", amount: 18000, date: "2024-04-15" },
  { id: "3", category: "internet", description: "Jio Fibre 300Mbps plan", amount: 14400, date: "2024-05-01" },
  { id: "4", category: "equipment", description: "MacBook Pro M3", amount: 190000, date: "2024-06-10" },
  { id: "5", category: "home_office", description: "CoWrks membership (6 months)", amount: 42000, date: "2024-07-01" },
  { id: "6", category: "travel", description: "Client meetings — Mumbai/Bangalore", amount: 28000, date: "2024-09-15" },
  { id: "7", category: "software", description: "Figma + Adobe CC", amount: 24000, date: "2024-10-01" },
  { id: "8", category: "phone", description: "Airtel business plan", amount: 9600, date: "2024-11-01" },
];

export const DEMO_ADVANCE_TAX = [
  { quarter: "Q1", amount_paid: 42000, paid_on: "2024-06-12", challan_number: "ITNS280-Q1-24" },
  { quarter: "Q2", amount_paid: 38000, paid_on: "2024-09-10", challan_number: "ITNS280-Q2-24" },
  { quarter: "Q3", amount_paid: 45000, paid_on: "2024-12-14", challan_number: "ITNS280-Q3-24" },
  { quarter: "Q4", amount_paid: 0, paid_on: null, challan_number: null },
];

export const DEMO_AIS_TRANSACTIONS = [
  { source: "HDFC Bank", type: "Professional Receipt", amount: 200000, date: "2024-11-20", tds: 20000, party: "HDFC BANK LTD" },
  { source: "Razorpay", type: "Professional Receipt", amount: 250000, date: "2024-08-01", tds: 25000, party: "RAZORPAY SOFTWARE PVT LTD" },
  { source: "Swiggy", type: "Professional Receipt", amount: 180000, date: "2024-09-10", tds: 18000, party: "BUNDL TECHNOLOGIES" },
  { source: "Form 26AS", type: "TDS on Professional Fees", amount: 63000, date: "2025-01-31", tds: 63000, party: "TOTAL TDS DEDUCTED" },
];

// Pre-computed tax result for demo (matches above data)
export const DEMO_TAX_RESULT = {
  totalIncome: 1878000,
  totalTDS: 63000,
  totalExpenses: 362000,
  presumptiveIncome: 939000, // 50% under 44ADA
  taxableIncome: 689000,     // after standard deduction
  newRegimeTax: 34500,
  oldRegimeTax: 87400,
  taxPayable: 34500,
  effectiveTaxRate: 1.84,
  recommendedRegime: "new" as const,
  regimeSavings: 52900,
  presumptiveSavings: 939000,
  is44ADAEligible: true,
  advanceTaxPaid: 125000,
  balanceTaxDue: 0,
  refundDue: 90500,
  advanceTaxSchedule: [
    { quarter: "Q1", deadline: "15 Jun 2024", amountDue: 42000, amountPaid: 42000, isPast: true, daysRemaining: null, paymentLink: "https://onlineservices.tin.egov-nsdl.com" },
    { quarter: "Q2", deadline: "15 Sep 2024", amountDue: 38000, amountPaid: 38000, isPast: true, daysRemaining: null, paymentLink: "https://onlineservices.tin.egov-nsdl.com" },
    { quarter: "Q3", deadline: "15 Dec 2024", amountDue: 45000, amountPaid: 45000, isPast: true, daysRemaining: null, paymentLink: "https://onlineservices.tin.egov-nsdl.com" },
    { quarter: "Q4", deadline: "15 Mar 2025", amountDue: 0, amountPaid: 0, isPast: false, daysRemaining: 16, paymentLink: "https://onlineservices.tin.egov-nsdl.com" },
  ],
  savingNudges: [
    { title: "Max out 80C before March 31", action: "Invest ₹1,50,000 in ELSS/PPF", saving: 46800, urgent: true, forOldRegime: true },
    { title: "NPS contribution (80CCD)", action: "Add ₹50,000 to NPS Tier 1", saving: 15600, urgent: true, forOldRegime: true },
    { title: "Health insurance (80D)", action: "₹25,000 premium for parents", saving: 7800, urgent: false, forOldRegime: true },
  ],
};

export const WAITLIST_COUNT = 847;

export const ITR_FORMS = [
  {
    form: "ITR-1",
    title: "Salaried & Simple Income",
    desc: "Salary, one house property, interest income",
    icon: "💼",
    color: "#4d9fff",
    who: ["Salaried employees", "Pensioners", "Interest income"],
    badge: "Most Common",
  },
  {
    form: "ITR-2",
    title: "Capital Gains & Investments",
    desc: "Stocks, mutual funds, crypto, property sale",
    icon: "📈",
    color: "#9d6fff",
    who: ["Stock investors", "Crypto holders", "Property sellers"],
    badge: "For Investors",
  },
  {
    form: "ITR-3",
    title: "Business Income",
    desc: "Trading business, partnership firm, full accounts",
    icon: "🏢",
    color: "#00d97e",
    who: ["Business owners", "Traders", "Partners in firms"],
    badge: "Full Books",
  },
  {
    form: "ITR-4",
    title: "Freelancers & Consultants",
    desc: "Section 44ADA presumptive — 50% tax on income",
    icon: "🧑‍💻",
    color: "#f0a500",
    who: ["Freelancers", "Consultants", "Gig workers"],
    badge: "Best for You",
    highlighted: true,
  },
];
