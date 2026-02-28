import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { message, history } = await req.json();

    // Fetch full financial context
    const [profileRes, incomeRes, expenseRes, deductionRes, advanceTaxRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("income_sources").select("*").eq("user_id", user.id).eq("financial_year", "2024-25"),
      supabase.from("expenses").select("*").eq("user_id", user.id).eq("financial_year", "2024-25"),
      supabase.from("deductions").select("*").eq("user_id", user.id).eq("financial_year", "2024-25").single(),
      supabase.from("advance_tax_payments").select("*").eq("user_id", user.id).eq("financial_year", "2024-25"),
    ]);

    const profile = profileRes.data;
    const incomes = incomeRes.data ?? [];
    const expenses = expenseRes.data ?? [];
    const deductions = deductionRes.data;
    const advanceTax = advanceTaxRes.data ?? [];

    const totalIncome = incomes.reduce((s: number, i: any) => s + i.amount, 0);
    const totalTDS = incomes.reduce((s: number, i: any) => s + i.tds_deducted, 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
    const advanceTaxPaid = advanceTax.reduce((s: number, a: any) => s + a.amount_paid, 0);

    const deduction80C = deductions?.section_80c ?? 0;
    const remaining80C = Math.max(0, 150000 - deduction80C);
    const deduction80D = deductions?.section_80d ?? 0;
    const remaining80D = Math.max(0, 25000 - deduction80D);
    const deductionNPS = deductions?.section_80ccd ?? 0;
    const remainingNPS = Math.max(0, 50000 - deductionNPS);

    const is44ADA = ["software_developer","designer","consultant","content_creator","doctor","lawyer","architect","other"].includes(profile?.profession);
    const presumptiveIncome = is44ADA ? totalIncome * 0.5 : totalIncome - totalExpenses;

    const systemPrompt = `You are Taxwise AI — a sharp, friendly financial co-pilot for Indian taxpayers. You are NOT a generic assistant. You have the user's complete financial data and you use it in every answer.

USER PROFILE:
- Name: ${profile?.full_name ?? "User"}
- Profession: ${profile?.profession?.replace(/_/g, " ")}
- PAN: ${profile?.pan ?? "Not set"}
- Financial Year: 2024–25
- Preferred regime: ${profile?.preferred_regime ?? "new"}
- ITR form: ${is44ADA ? "ITR-4 (44ADA eligible)" : "ITR-1/2/3"}

FINANCIAL SNAPSHOT (FY 2024–25):
- Total income: ₹${totalIncome.toLocaleString("en-IN")}
- Total TDS deducted: ₹${totalTDS.toLocaleString("en-IN")}
- Total expenses tracked: ₹${totalExpenses.toLocaleString("en-IN")}
- Advance tax paid: ₹${advanceTaxPaid.toLocaleString("en-IN")}
- Presumptive/taxable income: ₹${presumptiveIncome.toLocaleString("en-IN")}
- 44ADA eligible: ${is44ADA ? "YES — pays tax on 50% of income only" : "No"}

DEDUCTIONS SO FAR:
- 80C: ₹${deduction80C.toLocaleString("en-IN")} used / ₹1,50,000 limit (₹${remaining80C.toLocaleString("en-IN")} remaining)
- 80D: ₹${deduction80D.toLocaleString("en-IN")} used / ₹25,000 limit (₹${remaining80D.toLocaleString("en-IN")} remaining)
- NPS 80CCD(1B): ₹${deductionNPS.toLocaleString("en-IN")} used / ₹50,000 limit (₹${remainingNPS.toLocaleString("en-IN")} remaining)

Income sources:
${incomes.slice(0, 8).map((i: any) => `- ${i.client_name ?? i.type}: ₹${i.amount.toLocaleString("en-IN")} (TDS: ₹${i.tds_deducted.toLocaleString("en-IN")})`).join("\n")}

Top expenses:
${expenses.slice(0, 5).map((e: any) => `- ${e.category}: ₹${e.amount.toLocaleString("en-IN")}`).join("\n")}

YOUR PERSONALITY & RULES:
- Be direct, specific, and personal. Use their actual numbers.
- Never give generic advice. Always calculate with their real data.
- Keep answers concise — use bullet points when listing steps or options.
- Use ₹ with Indian number formatting (lakhs, not thousands).
- When suggesting investments, always calculate the exact tax saving.
- Be like a smart CA friend, not a legal disclaimer machine.
- If asked about topics outside tax/finance (weather, coding, general chat), gently redirect: "I'm your tax co-pilot — ask me anything about your finances!"
- Today's date context: FY 2024–25, approximately Q3. March 31 deadline is important.
- Format: Use markdown. Bold key numbers. Use bullet points for lists.`;

    const messages = [
      ...((history ?? []).slice(-8).map((m: any) => ({ role: m.role, content: m.content }))),
      { role: "user" as const, content: message },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 800,
      temperature: 0.7,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const reply = response.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response. Please try again.";

    // Save to DB
    await supabase.from("advisor_messages").insert([
      { user_id: user.id, role: "user", content: message },
      { user_id: user.id, role: "assistant", content: reply },
    ]);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Advisor error:", err);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
