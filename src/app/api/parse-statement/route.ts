import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";




// ─── Parse raw bank statement text into structured transactions ───────────
async function parseTransactionsFromText(rawText: string, bankName: string): Promise<any[]> {
  const prompt = `You are a bank statement parser for Indian banks. Extract all transactions from this bank statement text.

Bank: ${bankName}

Raw statement text:
${rawText.slice(0, 8000)}

Return ONLY a valid JSON array of transactions. Each transaction must have:
- date: "YYYY-MM-DD" format
- description: the full transaction description
- amount: number (always positive)
- type: "credit" or "debit"
- balance: number or null

Return ONLY the JSON array, no other text, no markdown.`;

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

  // Process in batches of 30 to stay within token limits
  const batchSize = 30;
  const results: any[] = [];

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const prompt = `You are a tax classification AI for Indian freelancers. Classify each bank transaction.

The user is a ${profession.replace("_", " ")} freelancer filing ITR-4 under Section 44ADA.

Classify each transaction into ONE of these categories:
- "professional_income": Payment received for freelance/professional work (client payments, project fees, Upwork/Fiverr transfers, Paypal receipts for work)
- "personal_transfer": Personal money movement (family transfers, own account transfers, loan repayments from friends)
- "business_expense": Work-related expense (software subscriptions, internet bill, equipment, coworking, travel for work)
- "tds_deduction": TDS deducted by client (usually small amounts labeled TDS/IT deduction)  
- "advance_tax": Income tax advance payment (labeled ITNS 280, advance tax, self assessment tax)
- "salary": Regular monthly salary if employed
- "ignore": ATM withdrawals, personal purchases, rent, groceries, utilities, EMIs

Transactions to classify:
${JSON.stringify(batch.map((t: any, idx: number) => ({ idx, date: t.date, description: t.description, amount: t.amount, type: t.type })), null, 2)}

Return ONLY a JSON array with one object per transaction:
[
  {
    "idx": 0,
    "classification": "professional_income",
    "confidence": 0.95,
    "reason": "Payment from Upwork - typical freelance platform transfer",
    "suggested_income_type": "freelance_foreign",
    "suggested_category": null
  }
]

For business_expense, set suggested_category to: "software" | "internet" | "phone" | "travel" | "equipment" | "home_office" | "other"
For professional_income, set suggested_income_type to: "freelance_indian" | "freelance_foreign" | "gig" | "creator" | "other"
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
      results.push(...classified);
    } catch {
      // If parse fails, mark all as unclassified
      batch.forEach((_: any, idx: number) => results.push({ idx: i + idx, classification: "ignore", confidence: 0, reason: "Parse error" }));
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
    if (!file.name.endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files accepted" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

    // Get user profile for profession context
    const { data: profile } = await supabase.from("profiles").select("profession").eq("id", user.id).single();
    const profession = profile?.profession ?? "software_developer";

    // Upload PDF to Supabase storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    await supabase.storage.from("statements").upload(fileName, fileBuffer, { contentType: "application/pdf" });

    // Create statement record
    const { data: statement } = await supabase.from("parsed_statements").insert({
      user_id: user.id,
      filename: file.name,
      bank_name: bankName,
      status: "processing",
    }).select().single();

    if (!statement) return NextResponse.json({ error: "Failed to create statement record" }, { status: 500 });

    // Extract text from PDF using pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(Buffer.from(fileBuffer));
    const rawText = pdfData.text;

    // Step 1: Parse transactions from raw text using AI
    const transactions = await parseTransactionsFromText(rawText, bankName);

    if (transactions.length === 0) {
      await supabase.from("parsed_statements").update({ status: "error", raw_text: rawText }).eq("id", statement.id);
      return NextResponse.json({ error: "Could not extract transactions from this PDF. Try a different format." }, { status: 422 });
    }

    // Step 2: Classify each transaction using AI
    const classifications = await classifyTransactions(transactions, profession);

    // Step 3: Merge classifications back into transactions
    const classified = transactions.map((t: any, idx: number) => {
      const cls = classifications.find((c: any) => c.idx === idx) ?? { classification: "ignore", confidence: 0, reason: "" };
      return {
        user_id: user.id,
        statement_id: statement.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        balance: t.balance,
        classification: cls.classification,
        classification_confidence: cls.confidence,
        classification_reason: cls.reason,
        suggested_category: cls.suggested_category ?? null,
        suggested_income_type: cls.suggested_income_type ?? null,
        user_confirmed: false,
      };
    });

    // Step 4: Save all transactions to DB
    await supabase.from("raw_transactions").insert(classified);

    // Step 5: Update statement status
    const classifiedCount = classified.filter((t: any) => t.classification !== "ignore").length;
    await supabase.from("parsed_statements").update({
      status: "done",
      total_transactions: classified.length,
      classified_transactions: classifiedCount,
      raw_text: rawText.slice(0, 5000), // store first 5k chars
    }).eq("id", statement.id);

    // Return summary
    const incomeTransactions = classified.filter((t: any) => t.classification === "professional_income" || t.classification === "salary");
    const expenseTransactions = classified.filter((t: any) => t.classification === "business_expense");
    const tdsTransactions = classified.filter((t: any) => t.classification === "tds_deduction");

    return NextResponse.json({
      success: true,
      statementId: statement.id,
      summary: {
        total: classified.length,
        income: incomeTransactions.length,
        expenses: expenseTransactions.length,
        tds: tdsTransactions.length,
        ignored: classified.filter((t: any) => t.classification === "ignore").length,
        totalIncomeAmount: incomeTransactions.reduce((s: number, t: any) => s + t.amount, 0),
        totalExpenseAmount: expenseTransactions.reduce((s: number, t: any) => s + t.amount, 0),
        totalTDSAmount: tdsTransactions.reduce((s: number, t: any) => s + t.amount, 0),
      },
      transactions: classified,
    });

  } catch (err) {
    console.error("Parse statement error:", err);
    return NextResponse.json({ error: "Failed to process statement" }, { status: 500 });
  }
}
