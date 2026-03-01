import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { transactionIds, overrides } = await req.json();

    if (!transactionIds || transactionIds.length === 0) {
      return NextResponse.json({ error: "No transactions selected" }, { status: 400 });
    }

    // Fetch the transactions
    const { data: transactions, error: fetchError } = await supabase
      .from("raw_transactions")
      .select("*")
      .in("id", transactionIds)
      .eq("user_id", user.id);

    if (fetchError || !transactions || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions found" }, { status: 404 });
    }

    const incomeInserts: any[] = [];
    const expenseInserts: any[] = [];
    const tdsInserts: any[] = []; // TDS transactions to link back to income
    const confirmedIds: string[] = [];

    for (const tx of transactions) {
      const override = overrides?.[tx.id] ?? {};
      const classification = override.classification ?? tx.classification;
      const category = override.suggested_category ?? tx.suggested_category;
      const incomeType = override.suggested_income_type ?? tx.suggested_income_type;

      if (classification === "professional_income" || classification === "salary") {
        incomeInserts.push({
          user_id: user.id,
          financial_year: "2024-25",
          type: incomeType ?? (classification === "salary" ? "salary" : "freelance_indian"),
          description: tx.description,
          client_name: extractClientName(tx.description),
          amount: tx.amount,
          tds_deducted: 0, // TDS linked separately below
          date: tx.date ?? new Date().toISOString().split("T")[0],
          source: "pdf_import",
          raw_description: tx.description,
        });
        confirmedIds.push(tx.id);
      }

      if (classification === "business_expense") {
        expenseInserts.push({
          user_id: user.id,
          financial_year: "2024-25",
          category: category ?? "other",
          description: tx.description,
          amount: tx.amount,
          date: tx.date ?? new Date().toISOString().split("T")[0],
          source: "pdf_import",
          raw_description: tx.description,
        });
        confirmedIds.push(tx.id);
      }

      if (classification === "tds_deduction") {
        tdsInserts.push({ txId: tx.id, amount: tx.amount, date: tx.date });
        confirmedIds.push(tx.id);
      }

      if (classification === "advance_tax") {
        // Store advance tax payment — try to determine quarter from date
        const quarter = getQuarterFromDate(tx.date);
        if (quarter) {
          // Upsert advance tax payment — don't overwrite if already there
          await supabase.from("advance_tax_payments").upsert({
            user_id: user.id,
            financial_year: "2024-25",
            quarter,
            amount_paid: tx.amount,
            paid_on: tx.date,
            challan_number: null,
          }, { onConflict: "user_id,financial_year,quarter" });
        }
        confirmedIds.push(tx.id);
      }
    }

    // Bulk insert income
    let insertedIncome: any[] = [];
    if (incomeInserts.length > 0) {
      const { data: incomeData, error: incomeError } = await supabase
        .from("income_sources")
        .insert(incomeInserts)
        .select("id, raw_description, amount");

      if (!incomeError && incomeData) {
        insertedIncome = incomeData;
      }
    }

    // Bulk insert expenses
    if (expenseInserts.length > 0) {
      await supabase.from("expenses").insert(expenseInserts);
    }

    // Handle TDS: if there are TDS transactions, distribute TDS amounts to nearby income records
    // Strategy: find the most recent income record and add TDS to it
    // (This matches how Indian banks work — TDS cut = linked to the payment)
    if (tdsInserts.length > 0 && insertedIncome.length > 0) {
      const totalTDS = tdsInserts.reduce((s: number, t: any) => s + t.amount, 0);
      // Distribute TDS proportionally across inserted income records
      const totalIncome = insertedIncome.reduce((s: number, i: any) => s + i.amount, 0);
      for (const inc of insertedIncome) {
        const proportionalTDS = totalIncome > 0 ? Math.round((inc.amount / totalIncome) * totalTDS) : 0;
        if (proportionalTDS > 0) {
          await supabase.from("income_sources").update({ tds_deducted: proportionalTDS }).eq("id", inc.id);
        }
      }
    } else if (tdsInserts.length > 0) {
      // No income in this batch — try to find the most recent manual income entry
      const totalTDS = tdsInserts.reduce((s: number, t: any) => s + t.amount, 0);
      const { data: recentIncome } = await supabase
        .from("income_sources")
        .select("id, amount, tds_deducted")
        .eq("user_id", user.id)
        .eq("financial_year", "2024-25")
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentIncome && recentIncome.length > 0) {
        const inc = recentIncome[0];
        await supabase.from("income_sources").update({ tds_deducted: (inc.tds_deducted ?? 0) + totalTDS }).eq("id", inc.id);
      }
    }

    // Mark all confirmed transactions
    if (confirmedIds.length > 0) {
      await supabase.from("raw_transactions")
        .update({ user_confirmed: true })
        .in("id", confirmedIds)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      added: {
        income: incomeInserts.length,
        expenses: expenseInserts.length,
        tds: tdsInserts.length,
        advanceTax: transactions.filter(t => (overrides?.[t.id]?.classification ?? t.classification) === "advance_tax").length,
      },
    });

  } catch (err) {
    console.error("Confirm transactions error:", err);
    return NextResponse.json({ error: "Failed to confirm transactions" }, { status: 500 });
  }
}

// Extract a cleaner client name from bank description
function extractClientName(desc: string): string | null {
  if (!desc) return null;
  const upper = desc.toUpperCase();

  // Detect well-known platforms first
  const platforms = [
    ["PAYPAL", "PayPal"], ["PAYONEER", "Payoneer"], ["WISE", "Wise"],
    ["TRANSFERWISE", "Wise"], ["STRIPE", "Stripe"], ["UPWORK", "Upwork"],
    ["FIVERR", "Fiverr"], ["TOPTAL", "Toptal"], ["DEEL", "Deel"],
    ["REMOTE.COM", "Remote"], ["RAZORPAY", "Razorpay"], ["CASHFREE", "Cashfree"],
    ["YOUTUBE", "YouTube AdSense"], ["GOOGLE ADSENSE", "Google AdSense"],
  ];
  for (const [keyword, name] of platforms) {
    if (upper.includes(keyword)) return name;
  }

  // Common Indian bank description patterns
  const patterns = [
    /(?:NEFT|RTGS|IMPS|UPI)[/ -]+(.+?)(?:\s*[-/|]|$)/i,
    /(?:from|by|via)\s+([A-Za-z0-9 &.]+?)(?:\s*[-/|]|$)/i,
    /INB\s+(.+?)(?:\s*[-/|]|$)/i, // Internet banking transfer
  ];
  for (const pattern of patterns) {
    const match = desc.match(pattern);
    if (match && match[1].trim().length > 2) return match[1].trim().slice(0, 50);
  }

  // Return truncated description as fallback
  return desc.slice(0, 40);
}

// Determine advance tax quarter from payment date
function getQuarterFromDate(dateStr: string | null): "Q1" | "Q2" | "Q3" | "Q4" | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const year = date.getFullYear();

  // FY 2024-25: Q1 = by Jun 15 2024, Q2 = by Sep 15 2024, Q3 = by Dec 15 2024, Q4 = by Mar 15 2025
  if (year === 2024) {
    if (month < 6 || (month === 6 && day <= 15)) return "Q1";
    if (month < 9 || (month === 9 && day <= 15)) return "Q2";
    if (month < 12 || (month === 12 && day <= 15)) return "Q3";
    return "Q4";
  }
  if (year === 2025 && month <= 3) return "Q4";
  return null;
}
