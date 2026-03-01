"use client";
import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";

const BANKS = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Bank", "Yes Bank", "IndusInd Bank", "Federal Bank", "IDFC First Bank", "Other"];

type Tx = {
  id: string; date: string; description: string; amount: number;
  type: "credit" | "debit"; classification: string;
  classification_confidence: number; classification_reason: string;
  suggested_category: string | null; suggested_income_type: string | null;
  selected: boolean; overrideClassification?: string;
};

type Summary = { total: number; income: number; expenses: number; tds: number; ignored: number; totalIncomeAmount: number; totalExpenseAmount: number; totalTDSAmount: number; };

const CLS_LABELS: Record<string, string> = {
  professional_income: "Professional Income",
  salary: "Salary",
  business_expense: "Business Expense",
  tds_deduction: "TDS Deduction",
  advance_tax: "Advance Tax",
  personal_transfer: "Personal Transfer",
  ignore: "Ignore",
};

const CLS_COLORS: Record<string, [string, string]> = {
  professional_income: ["var(--green-text)", "var(--green-card)"],
  salary: ["var(--green-text)", "var(--green-card)"],
  business_expense: ["#0891b2", "#e0f2fe"],
  tds_deduction: ["var(--amber-text)", "var(--amber)"],
  advance_tax: ["var(--amber-text)", "var(--amber)"],
  personal_transfer: ["var(--ink4)", "var(--bg)"],
  ignore: ["var(--ink4)", "var(--bg)"],
};

function fmtFull(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

export default function ImportPage() {
  const { refetch } = useTaxData();
  const [bankName, setBankName] = useState("HDFC Bank");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"upload" | "processing" | "review" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // Animate progress bar smoothly
  function animateProgressTo(target: number, label: string, duration = 2000) {
    setProgressLabel(label);
    if (progressRef.current) clearInterval(progressRef.current);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - fraction, 3);
      setProgress(prev => {
        const next = prev + (target - prev) * eased;
        if (next >= target - 0.5) {
          clearInterval(progressRef.current!);
          return target;
        }
        return next;
      });
    }, 30);
  }

  useEffect(() => () => { if (progressRef.current) clearInterval(progressRef.current); }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setStage("processing"); setError("");
    setProgress(0);
    
    animateProgressTo(25, "Uploading PDF...", 800);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("bank_name", bankName);
    
    try {
      // Animate to 45% while waiting for server to start
      setTimeout(() => animateProgressTo(45, "Extracting transactions...", 3000), 800);
      
      const res = await fetch("/api/parse-statement", { method: "POST", body: fd });
      
      animateProgressTo(80, "AI classifying transactions...", 2000);
      const data = await res.json();
      
      if (!res.ok) { setError(data.error ?? "Upload failed"); setStage("upload"); return; }
      
      animateProgressTo(100, "Preparing review...", 500);
      setSummary(data.summary);
      setTransactions(data.transactions.map((t: any) => ({
        ...t,
        selected: ["professional_income", "business_expense", "tds_deduction", "salary"].includes(t.classification),
      })));
      setTimeout(() => setStage("review"), 600);
    } catch {
      setError("Something went wrong. Please try again.");
      setStage("upload");
    }
  }

  async function handleConfirm() {
    setSaving(true);
    const selected = transactions.filter(t => t.selected);
    const overrides: Record<string, any> = {};
    selected.forEach(t => { if (t.overrideClassification) overrides[t.id] = { classification: t.overrideClassification, suggested_category: t.suggested_category, suggested_income_type: t.suggested_income_type }; });
    
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionIds: selected.map(t => t.id), overrides }),
    });
    const data = await res.json();
    if (res.ok) {
      // Trigger a refetch so dashboard/income page update immediately
      await refetch();
      setStage("done");
    } else {
      setError(data.error ?? "Failed to save");
    }
    setSaving(false);
  }

  const filtered = transactions.filter(t => {
    if (filter === "all") return true;
    if (filter === "income") return ["professional_income","salary"].includes(t.classification);
    if (filter === "expense") return t.classification === "business_expense";
    if (filter === "tds") return t.classification === "tds_deduction";
    if (filter === "review") return t.classification_confidence < 0.7;
    return true;
  });

  return (
    <AppLayout title="Import Bank Statement" subtitle="Upload PDF — AI classifies every transaction automatically">
      {/* Upload Stage */}
      {stage === "upload" && (
        <div className="au">
          {error && (
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--red)", borderRadius: "var(--r)", color: "var(--red-text)", fontSize: 13, border: "1px solid rgba(217,55,81,0.2)" }}>
              ⚠ {error}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Select Bank & Upload PDF</div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Your Bank</label>
                <select className="input" value={bankName} onChange={e => setBankName(e.target.value)}>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                <div style={{ fontSize: 42, marginBottom: 14 }}>{file ? "📄" : "⬆"}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{file ? file.name : "Click to upload PDF"}</div>
                <div style={{ fontSize: 12, color: "var(--ink4)" }}>{file ? `${(file.size/1024).toFixed(0)} KB` : "PDF bank statement, max 10MB"}</div>
                <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }}/>
              </div>

              <button className="btn btn-primary" disabled={!file} onClick={handleUpload} style={{ width: "100%", marginTop: 16, padding: "12px" }}>
                Analyse with AI →
              </button>
            </div>

            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>What gets detected</div>
              {[
                { icon: "💚", label: "Professional Income", desc: "Client payments, Stripe, PayPal, Payoneer, Upwork, foreign remittances" },
                { icon: "💸", label: "Business Expenses", desc: "Software, internet, equipment, coworking, work travel" },
                { icon: "🏦", label: "TDS Deductions", desc: "Tax deducted at source by clients (10% of payment)" },
                { icon: "📈", label: "Advance Tax", desc: "ITNS 280 / self-assessment tax payments to IT dept" },
                { icon: "🚫", label: "Ignored", desc: "ATM, rent, groceries, personal EMIs, personal UPI" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--purple-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)", marginTop: 1 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing Stage */}
      {stage === "processing" && (
        <div className="au" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420 }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🤖</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>AI is working...</h2>
          <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 32 }}>{progressLabel}</p>
          <div style={{ width: 320, height: 7, background: "var(--bg2)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round(progress)}%`, background: "var(--purple)", borderRadius: 4, transition: "width 0.1s linear" }}/>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink4)", marginTop: 10 }}>{Math.round(progress)}%</p>
          <p style={{ fontSize: 12, color: "var(--ink4)", marginTop: 8, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
            This takes 30–60 seconds depending on statement length. The AI reads every transaction line.
          </p>
        </div>
      )}

      {/* Review Stage */}
      {stage === "review" && summary && (
        <div className="au">
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Found", val: summary.total.toString(), sub: "transactions", bg: "var(--bg)" },
              { label: "Income", val: fmtFull(summary.totalIncomeAmount), sub: `${summary.income} entries`, bg: "var(--green-card)" },
              { label: "Expenses", val: fmtFull(summary.totalExpenseAmount), sub: `${summary.expenses} entries`, bg: "var(--amber)" },
              { label: "TDS", val: fmtFull(summary.totalTDSAmount), sub: `${summary.tds} deductions`, bg: "var(--purple-bg)" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: "var(--r-lg)", padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.3px" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Tip about review */}
          <div style={{ marginBottom: 16, padding: "10px 16px", background: "var(--purple-bg2)", borderRadius: "var(--r)", border: "1px solid var(--purple-bg)", fontSize: 12, color: "var(--ink3)" }}>
            💡 <strong>Review before confirming.</strong> Low-confidence rows are highlighted. Use the Override dropdown to correct any misclassified transactions.
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { id: "all", label: `All (${transactions.length})` },
              { id: "income", label: `Income (${transactions.filter(t=>["professional_income","salary"].includes(t.classification)).length})` },
              { id: "expense", label: `Expenses (${transactions.filter(t=>t.classification==="business_expense").length})` },
              { id: "tds", label: `TDS (${transactions.filter(t=>t.classification==="tds_deduction").length})` },
              { id: "review", label: `⚠ Low Confidence (${transactions.filter(t=>t.classification_confidence<0.7).length})` },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className="btn" style={{
                fontSize: 12, padding: "7px 14px",
                background: filter === f.id ? "var(--purple-bg)" : "var(--white)",
                border: `1.5px solid ${filter === f.id ? "var(--purple3)" : "var(--bg2)"}`,
                color: filter === f.id ? "var(--purple2)" : "var(--ink3)",
                fontWeight: filter === f.id ? 600 : 400,
              }}>{f.label}</button>
            ))}
          </div>

          {/* Transaction table */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            <table className="tw-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" onChange={e => setTransactions(prev => prev.map(t => ({ ...t, selected: e.target.checked })))}/>
                  </th>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Classification</th>
                  <th>Confidence</th>
                  <th>Override</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const cls = tx.overrideClassification ?? tx.classification;
                  const [clr, bg] = CLS_COLORS[cls] ?? ["var(--ink4)", "var(--bg)"];
                  const lowConfidence = (tx.classification_confidence ?? 0) < 0.7;
                  return (
                    <tr key={tx.id} style={{ opacity: tx.selected ? 1 : 0.45, background: lowConfidence ? "rgba(255,245,215,0.4)" : undefined }}>
                      <td><input type="checkbox" checked={tx.selected} onChange={() => setTransactions(prev => prev.map(t => t.id===tx.id ? {...t,selected:!t.selected} : t))}/></td>
                      <td style={{ fontSize: 12, color: "var(--ink4)", whiteSpace: "nowrap" }}>{tx.date}</td>
                      <td>
                        <div style={{ fontSize: 12, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</div>
                        {tx.classification_reason && <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>{tx.classification_reason}</div>}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, fontSize: 13, color: tx.type==="credit" ? "var(--green-text)" : "var(--red-text)", whiteSpace: "nowrap" }}>
                        {tx.type==="credit" ? "+" : "−"}{fmtFull(tx.amount)}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: bg, color: clr, whiteSpace: "nowrap" }}>
                          {CLS_LABELS[cls] ?? cls}
                        </span>
                      </td>
                      <td>
                        <div style={{ width: 56, height: 4, background: "var(--bg2)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(tx.classification_confidence??0)*100}%`, background: tx.classification_confidence > 0.8 ? "var(--green-text)" : tx.classification_confidence > 0.5 ? "var(--amber-text)" : "var(--red-text)", borderRadius: 2 }}/>
                        </div>
                        <span style={{ fontSize: 10, color: "var(--ink4)", marginTop: 2, display: "block" }}>{Math.round((tx.classification_confidence??0)*100)}%</span>
                      </td>
                      <td>
                        <select style={{ fontSize: 11, padding: "4px 8px", background: "var(--white)", border: "1.5px solid var(--bg2)", borderRadius: 8, color: "var(--ink)", cursor: "pointer", fontFamily: "var(--font)" }}
                          value={tx.overrideClassification ?? tx.classification}
                          onChange={e => setTransactions(prev => prev.map(t => t.id===tx.id ? {...t, overrideClassification:e.target.value, selected:e.target.value!=="ignore"} : t))}>
                          {Object.entries(CLS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--red)", borderRadius: "var(--r)", color: "var(--red-text)", fontSize: 13 }}>⚠ {error}</div>}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 13, color: "var(--ink3)" }}>
              {transactions.filter(t=>t.selected).length} of {transactions.length} selected
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => { setStage("upload"); setFile(null); }}>← Start Over</button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={saving || transactions.filter(t=>t.selected).length===0} style={{ padding: "10px 24px" }}>
                {saving ? "Adding to tax data..." : `Confirm ${transactions.filter(t=>t.selected).length} Transactions →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Done Stage */}
      {stage === "done" && (
        <div className="ac" style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Transactions Added!</h2>
          <p style={{ fontSize: 14, color: "var(--ink3)", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Income and expenses are now in your tax data. Your dashboard and income page have been updated with the new numbers.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <a href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none", padding: "12px 28px" }}>View Dashboard →</a>
            <button className="btn btn-ghost" onClick={() => { setStage("upload"); setFile(null); setSummary(null); setTransactions([]); }} style={{ padding: "12px 28px" }}>
              Import Another
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
