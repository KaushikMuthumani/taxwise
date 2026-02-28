"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase, IncomeSource, Expense, AdvanceTaxPayment, Deduction } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { calculateTax, TaxResult } from "@/lib/taxEngine";

const FY = "2024-25";

export function useTaxData() {
  const { user, profile } = useAuth();
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deductions, setDeductions] = useState<Deduction | null>(null);
  const [advanceTax, setAdvanceTax] = useState<AdvanceTaxPayment[]>([]);
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [incomeRes, expenseRes, deductionRes, advanceTaxRes] = await Promise.all([
      supabase.from("income_sources").select("*").eq("user_id", user.id).eq("financial_year", FY).order("date", { ascending: false }),
      supabase.from("expenses").select("*").eq("user_id", user.id).eq("financial_year", FY).order("date", { ascending: false }),
      supabase.from("deductions").select("*").eq("user_id", user.id).eq("financial_year", FY).single(),
      supabase.from("advance_tax_payments").select("*").eq("user_id", user.id).eq("financial_year", FY),
    ]);

    const incomeData = (incomeRes.data ?? []) as IncomeSource[];
    const expenseData = (expenseRes.data ?? []) as Expense[];
    const deductionData = deductionRes.data as Deduction | null;
    const advanceTaxData = (advanceTaxRes.data ?? []) as AdvanceTaxPayment[];

    setIncomes(incomeData); setExpenses(expenseData);
    setDeductions(deductionData); setAdvanceTax(advanceTaxData);

    if (profile && incomeData.length > 0) {
      const result = calculateTax({
        profession: profile.profession as any,
        financialYear: FY,
        incomeSources: incomeData.map(i => ({ type: i.type as any, amount: i.amount, tdsDeducted: i.tds_deducted, description: i.description ?? undefined })),
        expenses: expenseData.map(e => ({ category: e.category as any, amount: e.amount, description: e.description ?? undefined })),
        deductions: {
          section_80C: deductionData?.section_80c ?? 0,
          section_80D: deductionData?.section_80d ?? 0,
          hra: deductionData?.hra ?? 0,
          standard_deduction: deductionData?.section_80ccd ?? 0,
          other: deductionData?.other ?? 0,
        },
        advanceTaxPaid: {
          q1: advanceTaxData.find(a => a.quarter === "Q1")?.amount_paid ?? 0,
          q2: advanceTaxData.find(a => a.quarter === "Q2")?.amount_paid ?? 0,
          q3: advanceTaxData.find(a => a.quarter === "Q3")?.amount_paid ?? 0,
          q4: advanceTaxData.find(a => a.quarter === "Q4")?.amount_paid ?? 0,
        },
      });
      setTaxResult(result);
    } else {
      setTaxResult(null);
    }
    setLoading(false);
  }, [user, profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived metrics for advisor/dashboard
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalTDS = incomes.reduce((s, i) => s + i.tds_deducted, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const advanceTaxPaid = advanceTax.reduce((s, a) => s + a.amount_paid, 0);

  // Tax health score (0-100)
  const taxHealthScore = (() => {
    if (!taxResult || totalIncome === 0) return null;
    let score = 50;
    if (taxResult.is44ADAEligible) score += 15;
    if (taxResult.recommendedRegime === "new" && taxResult.regimeSavings > 0) score += 10;
    if (advanceTaxPaid > 0) score += 10;
    const deductionUtilization = ((deductions?.section_80c ?? 0) / 150000);
    score += Math.round(deductionUtilization * 15);
    return Math.min(score, 100);
  })();

  return { incomes, expenses, deductions, advanceTax, taxResult, loading, refetch: fetchAll, totalIncome, totalTDS, totalExpenses, advanceTaxPaid, taxHealthScore };
}
