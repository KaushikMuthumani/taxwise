import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { transactionIds, overrides } = await req.json();
    // overrides: { [transactionId]: { classification, suggested_category, suggested_income_type } }

    const { data: transactions } = await supabase
      .from("raw_transactions")
      .select("*")
      .in("id", transactionIds)
      .eq("user_id", user.id);

    if (!transactions) return NextResponse.json({ error: "No transactions found" }, { status: 404 });

    const incomeInserts = [];
    const expenseInserts = [];

    for (const tx of transactions) {
      const override = overrides?.[tx.id] ?? {};
      const classification = override.classification ?? tx.classification;
      const category = override.suggested_category ?? tx.suggested_category;
      const incomeType = override.suggested_income_type ?? tx.suggested_income_type;

      if (classification === "professional_income" || classification === "salary") {
        const income = {
          user_id: user.id,
          financial_year: "2024-25",
          type: incomeType ?? "freelance_indian",
          description: tx.description,
          amount: tx.amount,
          tds_deducted: 0,
          date: tx.date ?? new Date().toISOString().split("T")[0],
          source: "pdf_import",
          raw_description: tx.description,
        };
        incomeInserts.push(income);

        // Mark transaction as confirmed
        await supabase.from("raw_transactions").update({ user_confirmed: true }).eq("id", tx.id);
      }

      if (classification === "business_expense") {
        const expense = {
          user_id: user.id,
          financial_year: "2024-25",
          category: category ?? "other",
          description: tx.description,
          amount: tx.amount,
          date: tx.date ?? new Date().toISOString().split("T")[0],
          source: "pdf_import",
          raw_description: tx.description,
        };
        expenseInserts.push(expense);
        await supabase.from("raw_transactions").update({ user_confirmed: true }).eq("id", tx.id);
      }
    }

    // Bulk insert
    if (incomeInserts.length > 0) {
      const { data: incomeData } = await supabase.from("income_sources").insert(incomeInserts).select();
      // Link back to transactions
      if (incomeData) {
        for (let i = 0; i < incomeInserts.length; i++) {
          const tx = transactions.find((t) => t.description === incomeInserts[i].raw_description);
          if (tx && incomeData[i]) {
            await supabase.from("raw_transactions").update({ linked_income_id: incomeData[i].id }).eq("id", tx.id);
          }
        }
      }
    }

    if (expenseInserts.length > 0) {
      await supabase.from("expenses").insert(expenseInserts);
    }

    return NextResponse.json({
      success: true,
      added: { income: incomeInserts.length, expenses: expenseInserts.length },
    });

  } catch (err) {
    console.error("Confirm transactions error:", err);
    return NextResponse.json({ error: "Failed to confirm transactions" }, { status: 500 });
  }
}
