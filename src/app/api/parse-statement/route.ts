import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// ─── Parse raw bank statement text into structured transactions ───────────
async function parseTransactionsFromText(rawText: string, bankName: string): Promise<any[]> {
  const prompt = `You are a bank statement parser for Indian banks. Extract ALL transactions from this bank statement text.

Bank: ${bankName}

Raw statement text:
${rawText.slice(0, 8000)}

Return ONLY a valid JSON array of transactions. Each transaction must have:
- date: "YYYY-MM-DD" format (infer year from context — typically 2024 or 2025 for FY 2024-25)
- description: the full transaction description as-is
- amount: number (always positive)
- type: "credit" or "debit"
- balance: number or null

Include EVERY transaction. Return ONLY the JSON array, no other text, no markdown.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.choices[0]?.message?.content ?? "[]";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

// ─── AI classify each transaction ─────────────────────────────────────────
async function classifyTransactions(transactions: any[], profession: string): Promise<any[]> {
  if (transactions.length === 0) return [];

  const batchSize = 30;
  const results: any[] = [];

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const prompt = `You are a tax classification AI for Indian freelancers. Classify each bank transaction.

The user is a ${profession.replace("_", " ")} freelancer filing ITR-4 under Section 44ADA.

Classify each transaction into ONE of these categories:
- "professional_income": Payment received for freelance/professional work. Includes: client payments, project fees, Upwork/Fiverr/Toptal, PayPal/Payoneer/Wise/Stripe credits for services, foreign SWIFT remittances, Razorpay payouts.
- "personal_transfer": Personal money — family transfers, own account transfers, friend loan repayments.
- "business_expense": Work-related DEBIT — software (GitHub/Figma/Adobe/AWS/GSuite/Notion/Slack/Zoom), internet bill, mobile bill, equipment (laptop/monitor), coworking, work travel.
- "tds_deduction": TDS deducted by client — DEBIT labeled TDS/Income Tax/IT Deduction, typically 10% of a nearby income credit.
- "advance_tax": Tax payment to IT dept — DEBIT labeled ITNS 280, advance tax, self assessment tax, challan.
- "salary": Regular monthly salary from same employer.
- "ignore": ATM withdrawals, personal UPI, Amazon/Flipkart shopping, rent, groceries, utility bills, EMIs, personal insurance, SIP investments.

For suggested_income_type:
- "freelance_foreign": PayPal/Payoneer/Wise credit, SWIFT inward remittance, USD/EUR/GBP amount, Stripe, Deel, Remote.com, foreign company name.
- "freelance_indian": NEFT/RTGS/IMPS from Indian company, Razorpay business payout, Indian Pvt Ltd/LLP client.
- "gig": Swiggy/Zomato/Ola/Rapido/Urban Company earnings.
- "creator": YouTube AdSense, Instagram, course sales, newsletter revenue.

Transactions to classify:
${JSON.stringify(batch.map((t: any, localIdx: number) => ({ idx: i + localIdx, date: t.date, description: t.description, amount: t.amount, type: t.type })), null, 2)}

Return ONLY a JSON array with idx matching the input idx values (starting at ${i}):
[{"idx": ${i}, "classification": "...", "confidence": 0.95, "reason": "...", "suggested_income_type": null, "suggested_category": null}]

Return ONLY valid JSON array.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content ?? "[]";
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const classified = JSON.parse(clean);
      // Fix idx if AI reset it to 0-based for this batch
      const corrected = classified.map((c: any, localIdx: number) => ({
        ...c,
        idx: typeof c.idx === "number" && c.idx >= i ? c.idx : i + localIdx,
      }));
      results.push(...corrected);
    } catch {
      batch.forEach((_: any, localIdx: number) => {
        results.push({ idx: i + localIdx, classification: "ignore", confidence: 0, reason: "Parse error" });
      });
    }
  }

  return results;
}

// ─── Main API Route ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bankName = formData.get("bank_name") as string || "Unknown Bank";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files accepted" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("profession").eq("id", user.id).single();
    const profession = profile?.profession ?? "software_developer";

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    await supabase.storage.from("statements").upload(fileName, fileBuffer, { contentType: "application/pdf" });

    const { data: statement } = await supabase.from("parsed_statements").insert({
      user_id: user.id,
      filename: file.name,
      bank_name: bankName,
      status: "processing",
    }).select().single();

    if (!statement) return NextResponse.json({ error: "Failed to create statement record" }, { status: 500 });

    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(Buffer.from(fileBuffer));
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      await supabase.from("parsed_statements").update({ status: "error" }).eq("id", statement.id);
      return NextResponse.json({ error: "Could not extract text from this PDF. It may be scanned/image-based. Try a text-based PDF bank statement." }, { status: 422 });
    }

    const transactions = await parseTransactionsFromText(rawText, bankName);

    if (transactions.length === 0) {
      await supabase.from("parsed_statements").update({ status: "error", raw_text: rawText }).eq("id", statement.id);
      return NextResponse.json({ error: "Could not extract transactions from this PDF. Please check the file and try again." }, { status: 422 });
    }

    const classifications = await classifyTransactions(transactions, profession);
    const classificationMap = new Map(classifications.map((c: any) => [c.idx, c]));

    const classified = transactions.map((t: any, idx: number) => {
      const cls = classificationMap.get(idx) ?? { classification: "ignore", confidence: 0, reason: "" };
      return {
        user_id: user.id,
        statement_id: statement.id,
        date: t.date,
        description: t.description,
        amount: Math.abs(Number(t.amount) || 0),
        type: t.type,
        balance: t.balance ?? null,
        classification: cls.classification,
        classification_confidence: cls.confidence ?? 0,
        classification_reason: cls.reason ?? null,
        suggested_category: cls.suggested_category ?? null,
        suggested_income_type: cls.suggested_income_type ?? null,
        user_confirmed: false,
      };
    });

    const { data: insertedTransactions, error: insertErr } = await supabase
      .from("raw_transactions")
      .insert(classified)
      .select("*");
    
    if (insertErr || !insertedTransactions) {
      await supabase.from("parsed_statements").update({ status: "error" }).eq("id", statement.id);
      return NextResponse.json({ error: "Failed to save transactions" }, { status: 500 });
    }

    const classifiedCount = classified.filter((t: any) => t.classification !== "ignore").length;
    await supabase.from("parsed_statements").update({
      status: "done",
      total_transactions: classified.length,
      classified_transactions: classifiedCount,
      raw_text: rawText.slice(0, 5000),
    }).eq("id", statement.id);

    const incomeTransactions = insertedTransactions.filter((t: any) => t.classification === "professional_income" || t.classification === "salary");
    const expenseTransactions = insertedTransactions.filter((t: any) => t.classification === "business_expense");
    const tdsTransactions = insertedTransactions.filter((t: any) => t.classification === "tds_deduction");

    return NextResponse.json({
      success: true,
      statementId: statement.id,
      summary: {
        total: insertedTransactions.length,
        income: incomeTransactions.length,
        expenses: expenseTransactions.length,
        tds: tdsTransactions.length,
        ignored: insertedTransactions.filter((t: any) => t.classification === "ignore").length,
        totalIncomeAmount: incomeTransactions.reduce((s: number, t: any) => s + t.amount, 0),
        totalExpenseAmount: expenseTransactions.reduce((s: number, t: any) => s + t.amount, 0),
        totalTDSAmount: tdsTransactions.reduce((s: number, t: any) => s + t.amount, 0),
      },
      transactions: insertedTransactions,
    });

  } catch (err) {
    console.error("Parse statement error:", err);
    return NextResponse.json({ error: "Failed to process statement" }, { status: 500 });
  }
}
