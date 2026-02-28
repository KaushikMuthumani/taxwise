"use client";

import { useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { formatINR } from "@/lib/taxEngine";

const BANKS = [
  "HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Bank",
  "Yes Bank", "IndusInd Bank", "Federal Bank", "IDFC First Bank", "Other",
];

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  classification: string;
  classification_confidence: number;
  classification_reason: string;
  suggested_category: string | null;
  suggested_income_type: string | null;
  user_confirmed: boolean;
  selected: boolean;
  overrideClassification?: string;
};

type Summary = {
  total: number;
  income: number;
  expenses: number;
  tds: number;
  ignored: number;
  totalIncomeAmount: number;
  totalExpenseAmount: number;
  totalTDSAmount: number;
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  professional_income: "var(--green)",
  salary: "var(--green)",
  business_expense: "var(--blue)",
  tds_deduction: "var(--amber)",
  advance_tax: "var(--amber)",
  personal_transfer: "var(--muted)",
  ignore: "var(--muted)",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  professional_income: "Professional Income",
  salary: "Salary",
  business_expense: "Business Expense",
  tds_deduction: "TDS Deduction",
  advance_tax: "Advance Tax",
  personal_transfer: "Personal Transfer",
  ignore: "Ignore",
};

export default function ImportPage() {
  const [bankName, setBankName] = useState("HDFC Bank");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"upload" | "processing" | "review" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setStage("processing");
    setError("");
    setProgress(10);
    setProgressLabel("Uploading PDF...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bank_name", bankName);

    try {
      setProgress(30);
      setProgressLabel("Extracting transactions from PDF...");

      const res = await fetch("/api/parse-statement", { method: "POST", body: fd });

      setProgress(60);
      setProgressLabel("AI is classifying each transaction...");

      const data = await res.json();

      if (!res.ok) { setError(data.error); setStage("upload"); return; }

      setProgress(90);
      setProgressLabel("Preparing review...");

      setSummary(data.summary);
      setStatementId(data.statementId);
      setTransactions(
        data.transactions.map((t: any) => ({
          ...t,
          selected: t.classification === "professional_income" || t.classification === "business_expense" || t.classification === "tds_deduction",
        }))
      );

      setProgress(100);
      setTimeout(() => setStage("review"), 300);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setStage("upload");
    }
  }

  function toggleSelect(id: string) {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, selected: !t.selected } : t));
  }

  function overrideClassification(id: string, cls: string) {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, overrideClassification: cls, selected: cls !== "ignore" } : t));
  }

  async function handleConfirm() {
    setSaving(true);
    const selected = transactions.filter((t) => t.selected);
    const overrides: Record<string, any> = {};
    selected.forEach((t) => {
      if (t.overrideClassification) overrides[t.id] = { classification: t.overrideClassification };
    });

    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionIds: selected.map((t) => t.id), overrides }),
    });

    const data = await res.json();
    if (res.ok) {
      setStage("done");
    } else {
      setError(data.error);
    }
    setSaving(false);
  }

  const filteredTx = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "income") return t.classification === "professional_income" || t.classification === "salary";
    if (filter === "expense") return t.classification === "business_expense";
    if (filter === "tds") return t.classification === "tds_deduction";
    if (filter === "review") return t.classification_confidence < 0.7;
    return true;
  });

  return (
    <AppLayout>
      <div style={{ padding: "40px 48px" }}>

        {/* Header */}
        <div className="animate-fadeUp" style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px" }}>Import Bank Statement</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Upload your PDF bank statement — AI will classify every transaction automatically</p>
        </div>

        {/* Upload Stage */}
        {stage === "upload" && (
          <div className="animate-fadeUp">
            {error && (
              <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "var(--red)", fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card">
                <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Select Bank & Upload PDF</p>

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Your Bank</label>
                  <select className="input" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                    {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${file ? "rgba(245,166,35,0.5)" : "var(--border)"}`,
                    borderRadius: 12, padding: "32px 24px", textAlign: "center",
                    cursor: "pointer", transition: "all 0.2s",
                    background: file ? "rgba(245,166,35,0.04)" : "var(--surface2)",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{file ? "📄" : "⬆"}</div>
                  <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    {file ? file.name : "Click to upload PDF"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>
                    {file ? `${(file.size / 1024).toFixed(0)} KB` : "PDF bank statement, max 10MB"}
                  </p>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: "none" }} />
                </div>

                <button className="btn btn-primary" disabled={!file} onClick={handleUpload} style={{ width: "100%", marginTop: 16, padding: "12px" }}>
                  Upload & Analyse with AI →
                </button>
              </div>

              {/* How it works */}
              <div className="card">
                <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>How it works</p>
                {[
                  { icon: "📄", title: "Upload PDF", desc: "Your bank statement PDF from any Indian bank" },
                  { icon: "🤖", title: "AI reads every transaction", desc: "Extracts date, description, amount from unstructured text" },
                  { icon: "🏷️", title: "Auto-classifies each one", desc: "Income vs expense vs personal transfer vs TDS vs ignore" },
                  { icon: "✅", title: "You review and confirm", desc: "Accept, reject, or override any classification" },
                  { icon: "📊", title: "Auto-added to your tax data", desc: "Confirmed transactions flow directly into your tax calculation" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</p>
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 4, padding: "12px 16px", background: "var(--surface2)", borderRadius: 8, fontSize: 12, color: "var(--muted)", borderLeft: "2px solid var(--amber)" }}>
                  Your PDF is processed securely and never stored longer than needed for classification.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Stage */}
        {stage === "processing" && (
          <div className="animate-fadeUp" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 24 }}>🤖</div>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>AI is working...</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>{progressLabel}</p>
            <div style={{ width: 320, height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "var(--amber)", borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>{progress}%</p>
          </div>
        )}

        {/* Review Stage */}
        {stage === "review" && summary && (
          <div className="animate-fadeUp">

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Transactions", value: summary.total.toString(), sub: "Found in statement" },
                { label: "Income Detected", value: formatINR(summary.totalIncomeAmount), sub: `${summary.income} transactions`, color: "var(--green)" },
                { label: "Expenses Detected", value: formatINR(summary.totalExpenseAmount), sub: `${summary.expenses} transactions`, color: "var(--blue)" },
                { label: "TDS Found", value: formatINR(summary.totalTDSAmount), sub: `${summary.tds} deductions`, color: "var(--amber)" },
              ].map((s, i) => (
                <div key={i} className="card">
                  <p className="label">{s.label}</p>
                  <p style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 600, color: s.color ?? "var(--text)" }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { id: "all", label: "All" },
                { id: "income", label: "Income" },
                { id: "expense", label: "Expenses" },
                { id: "tds", label: "TDS" },
                { id: "review", label: "⚠ Review (Low Confidence)" },
              ].map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)} className="btn" style={{
                  padding: "7px 14px", fontSize: 12,
                  background: filter === f.id ? "rgba(245,166,35,0.1)" : "var(--surface)",
                  border: `1px solid ${filter === f.id ? "rgba(245,166,35,0.3)" : "var(--border)"}`,
                  color: filter === f.id ? "var(--amber)" : "var(--muted)",
                }}>{f.label}</button>
              ))}
            </div>

            {/* Transaction table */}
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input type="checkbox" onChange={(e) => setTransactions((prev) => prev.map((t) => ({ ...t, selected: e.target.checked })))} />
                    </th>
                    <th>Date</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>AI Classification</th>
                    <th>Confidence</th>
                    <th>Override</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx) => {
                    const cls = tx.overrideClassification ?? tx.classification;
                    const color = CLASSIFICATION_COLORS[cls] ?? "var(--muted)";
                    return (
                      <tr key={tx.id} style={{ opacity: !tx.selected ? 0.4 : 1 }}>
                        <td>
                          <input type="checkbox" checked={tx.selected} onChange={() => toggleSelect(tx.id)} />
                        </td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>{tx.date}</td>
                        <td>
                          <div style={{ fontSize: 13, maxWidth: 280 }}>{tx.description}</div>
                          {tx.classification_reason && (
                            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{tx.classification_reason}</div>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500, color: tx.type === "credit" ? "var(--green)" : "var(--red)" }}>
                          {tx.type === "credit" ? "+" : "-"}{formatINR(tx.amount)}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 500, color, background: `${color}22`, padding: "3px 8px", borderRadius: 4 }}>
                            {CLASSIFICATION_LABELS[cls] ?? cls}
                          </span>
                        </td>
                        <td>
                          <div style={{ width: 60, height: 4, background: "var(--surface2)", borderRadius: 2 }}>
                            <div style={{
                              height: "100%",
                              width: `${(tx.classification_confidence ?? 0) * 100}%`,
                              background: tx.classification_confidence > 0.8 ? "var(--green)" : tx.classification_confidence > 0.5 ? "var(--amber)" : "var(--red)",
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>{Math.round((tx.classification_confidence ?? 0) * 100)}%</span>
                        </td>
                        <td>
                          <select
                            style={{ fontSize: 11, padding: "4px 8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", cursor: "pointer" }}
                            value={tx.overrideClassification ?? tx.classification}
                            onChange={(e) => overrideClassification(tx.id, e.target.value)}
                          >
                            {Object.entries(CLASSIFICATION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Confirm */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                {transactions.filter((t) => t.selected).length} of {transactions.length} transactions selected
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => { setStage("upload"); setFile(null); }}>← Start Over</button>
                <button className="btn btn-primary" onClick={handleConfirm} disabled={saving || transactions.filter((t) => t.selected).length === 0} style={{ padding: "10px 24px" }}>
                  {saving ? "Adding to your tax data..." : `Confirm & Add ${transactions.filter((t) => t.selected).length} Transactions →`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Done Stage */}
        {stage === "done" && (
          <div className="animate-fadeUp" style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 600, marginBottom: 12 }}>Transactions Added!</h2>
            <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 36, maxWidth: 400, margin: "0 auto 36px" }}>
              Your income and expenses have been added to your tax calculation. Your dashboard now reflects the updated numbers.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none", padding: "12px 28px" }}>View Dashboard →</a>
              <button className="btn btn-ghost" onClick={() => { setStage("upload"); setFile(null); setSummary(null); setTransactions([]); }} style={{ padding: "12px 28px" }}>
                Import Another Statement
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
