"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_PROFILE, DEMO_INCOME, DEMO_EXPENSES, DEMO_ADVANCE_TAX, DEMO_TAX_RESULT, DEMO_AIS_TRANSACTIONS } from "@/lib/demoData";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtFull(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const NAV = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "income", icon: "↓", label: "Income" },
  { id: "ais", icon: "🏦", label: "AIS / 26AS" },
  { id: "advance-tax", icon: "◷", label: "Advance Tax" },
];

export default function DemoPage() {
  const [tab, setTab] = useState("dashboard");
  const [aisUploaded, setAisUploaded] = useState(false);
  const [aisProcessing, setAisProcessing] = useState(false);

  const totalIncome = DEMO_INCOME.reduce((s, i) => s + i.amount, 0);
  const totalTDS = DEMO_INCOME.reduce((s, i) => s + i.tds_deducted, 0);
  const totalExpenses = DEMO_EXPENSES.reduce((s, i) => s + i.amount, 0);
  const t = DEMO_TAX_RESULT;

  function simulateAIS() {
    setAisProcessing(true);
    setTimeout(() => { setAisProcessing(false); setAisUploaded(true); }, 2200);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #080810; color: #f0f0fa; font-family: 'DM Sans', sans-serif; font-size: 14px; -webkit-font-smoothing: antialiased; height: 100%; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes shimmer { 0%{background-position:200% 0;}100%{background-position:-200% 0;} }
        @keyframes barFill { from{width:0}to{width:var(--w)} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        .au { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* Demo Banner */}
      <div style={{ background: "linear-gradient(90deg,rgba(240,165,0,0.15),rgba(240,165,0,0.08))", borderBottom: "1px solid rgba(240,165,0,0.2)", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <span style={{ color: "#f0a500", fontWeight: 600 }}>👋 Investor Demo</span>
          <span style={{ color: "#8888aa" }}>— You're viewing Arjun Mehta's account (FY 2024–25). Data is realistic but simulated.</span>
        </div>
        <Link href="/auth/signup" style={{ fontSize: 12, fontWeight: 700, background: "#f0a500", color: "#080810", padding: "6px 14px", borderRadius: 6, textDecoration: "none" }}>
          Try with your data →
        </Link>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 45px)" }}>

        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0, background: "#0d0d18", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "28px 0" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", padding: "0 22px 28px" }}>
            <span style={{ color: "#f0a500" }}>tax</span>wise
          </div>

          {NAV.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "11px 22px",
              fontSize: 13, fontWeight: tab === item.id ? 500 : 400,
              color: tab === item.id ? "#f0a500" : "#6b6b90",
              background: tab === item.id ? "rgba(240,165,0,0.06)" : "transparent",
              borderLeft: `2px solid ${tab === item.id ? "#f0a500" : "transparent"}`,
              border: "none", cursor: "pointer", width: "100%", textAlign: "left",
              fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <div style={{ padding: "18px 22px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "inline-block", padding: "3px 9px", background: "rgba(240,165,0,0.1)", border: "1px solid rgba(240,165,0,0.2)", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#f0a500", marginBottom: 10 }}>FY 2024–25</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{DEMO_PROFILE.full_name}</div>
            <div style={{ fontSize: 11, color: "#6b6b90", marginTop: 2 }}>{DEMO_PROFILE.itr_form} · {DEMO_PROFILE.pan}</div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: "auto" }}>

          {/* ─── DASHBOARD ─── */}
          {tab === "dashboard" && (
            <div style={{ padding: "40px 48px" }}>
              <div className="au" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Hey, Arjun 👋</h1>
                  <p style={{ fontSize: 13, color: "#6b6b90", marginTop: 4 }}>FY 2024–25 · Section 44ADA · ITR-4</p>
                </div>
                <Link href="/auth/signup" style={{ padding: "9px 18px", background: "#f0a500", color: "#080810", fontWeight: 700, fontSize: 13, borderRadius: 8, textDecoration: "none" }}>
                  Try with your account →
                </Link>
              </div>

              {/* 44ADA Banner */}
              <div className="au" style={{ background: "linear-gradient(135deg,rgba(240,165,0,0.1),rgba(240,165,0,0.03))", border: "1px solid rgba(240,165,0,0.2)", borderRadius: 16, padding: "24px 32px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", animationDelay: "0.05s" }}>
                <div style={{ position: "absolute", right: -8, top: -16, fontFamily: "'Syne',sans-serif", fontSize: 80, fontWeight: 800, color: "rgba(240,165,0,0.04)", letterSpacing: -4, pointerEvents: "none" }}>44ADA</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "#f0a500", textTransform: "uppercase", marginBottom: 6 }}>Section 44ADA Active · Presumptive Taxation</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 600, marginBottom: 4 }}>You pay tax on 50% of income — not 100%</div>
                  <div style={{ fontSize: 13, color: "#8888aa" }}>₹9.39L of your ₹18.78L income is untaxed by default</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#8888aa", marginBottom: 4 }}>Tax saved vs normal computation</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 36, fontWeight: 800, color: "#f0a500", letterSpacing: "-1px" }}>{fmt(t.presumptiveSavings)}</div>
                  <div style={{ fontSize: 12, color: "#8888aa", marginTop: 2 }}>untaxed income</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Total Income", value: fmt(totalIncome), sub: `${DEMO_INCOME.length} sources`, delay: 0 },
                  { label: "Tax Payable", value: fmtFull(t.taxPayable), sub: `Effective rate: ${t.effectiveTaxRate}%`, accent: true, delay: 60 },
                  { label: "TDS Deducted", value: fmtFull(totalTDS), sub: "Already with govt", delay: 120 },
                  { label: "Refund Due", value: fmtFull(t.refundDue), sub: "After advance tax paid", color: "#00d97e", delay: 180 },
                ].map((s) => (
                  <div key={s.label} className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22, animationDelay: `${s.delay}ms` }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#6b6b90", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px", color: s.color ?? (s.accent ? "#f0a500" : "#f0f0fa") }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#6b6b90", marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Saving nudges */}
              <div className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, marginBottom: 24, animationDelay: "0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600 }}>💡 Save more before March 31</div>
                  <div style={{ fontSize: 11, color: "#f0a500", background: "rgba(240,165,0,0.1)", padding: "3px 10px", borderRadius: 4, fontWeight: 600 }}>OLD REGIME TIPS</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {t.savingNudges.map((n, i) => (
                    <div key={i} style={{ flex: 1, background: "#181828", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "#8888aa", marginBottom: 12 }}>{n.action}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#6b6b90" }}>Save</span>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, color: "#00d97e" }}>{fmtFull(n.saving)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Regime comparison */}
                <div className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, animationDelay: "0.25s" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Regime Comparison</div>
                  {[
                    { label: "New Regime", tax: t.newRegimeTax, winner: true },
                    { label: "Old Regime", tax: t.oldRegimeTax, winner: false },
                  ].map((r) => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <span style={{ width: 88, fontSize: 13, color: "#8888aa" }}>{r.label}</span>
                      <div style={{ flex: 1, height: 6, background: "#181828", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round(r.tax / t.oldRegimeTax * 100)}%`, background: r.winner ? "#f0a500" : "#3a3a55", borderRadius: 3, transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
                      </div>
                      <span style={{ width: 72, textAlign: "right", fontSize: 13, fontWeight: r.winner ? 600 : 400, color: r.winner ? "#f0f0fa" : "#6b6b90" }}>{fmtFull(r.tax)}</span>
                      {r.winner && <span style={{ fontSize: 10, background: "rgba(0,217,126,0.1)", color: "#00d97e", padding: "2px 7px", borderRadius: 4, fontWeight: 700, whiteSpace: "nowrap" }}>SAVE {fmt(t.regimeSavings)}</span>}
                    </div>
                  ))}
                </div>

                {/* Advance tax */}
                <div className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, animationDelay: "0.3s" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Advance Tax</div>
                  {t.advanceTaxSchedule.map((q, i) => {
                    const paid = DEMO_ADVANCE_TAX.find((a) => a.quarter === q.quarter);
                    const isDone = (paid?.amount_paid ?? 0) >= q.amountDue && q.amountDue > 0;
                    return (
                      <div key={q.quarter} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: isDone ? "#00d97e" : q.isPast ? "#ff4d6d" : "#f0a500" }} />
                          <div>
                            <div style={{ fontSize: 13 }}>{q.quarter}</div>
                            <div style={{ fontSize: 11, color: "#6b6b90" }}>{q.deadline}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{fmtFull(q.amountDue)}</div>
                          <div style={{ fontSize: 11, color: isDone ? "#00d97e" : q.isPast ? "#ff4d6d" : "#f0a500" }}>
                            {isDone ? "✓ Paid" : q.isPast ? "Overdue" : q.daysRemaining ? `${q.daysRemaining}d left` : "—"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── INCOME ─── */}
          {tab === "income" && (
            <div style={{ padding: "40px 48px" }}>
              <div className="au" style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Income</h1>
                <p style={{ fontSize: 13, color: "#6b6b90", marginTop: 4 }}>FY 2024–25 · {DEMO_INCOME.length} entries</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Total Income", value: fmt(totalIncome), sub: `${DEMO_INCOME.length} entries` },
                  { label: "TDS Deducted", value: fmtFull(totalTDS), sub: "Credit on file with IT dept" },
                  { label: "Net Received", value: fmt(totalIncome - totalTDS), sub: "In your account" },
                ].map((s, i) => (
                  <div key={i} className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 22, animationDelay: `${i * 60}ms` }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#6b6b90", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "#6b6b90", marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", animationDelay: "0.15s" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 600 }}>All Income Sources</div>
                  <div style={{ fontSize: 11, background: "rgba(240,165,0,0.1)", border: "1px solid rgba(240,165,0,0.2)", padding: "3px 9px", borderRadius: 5, color: "#f0a500", fontWeight: 600 }}>{DEMO_INCOME.length} entries</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#181828" }}>
                      {["Date","Client / Source","Type","Amount","TDS","Source"].map((h) => (
                        <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b6b90", textTransform: "uppercase", letterSpacing: "0.7px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_INCOME.map((inc, i) => (
                      <tr key={inc.id} style={{ borderBottom: i < DEMO_INCOME.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <td style={{ padding: "13px 20px", fontSize: 12, color: "#6b6b90" }}>{inc.date}</td>
                        <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 500 }}>{inc.client_name}</td>
                        <td style={{ padding: "13px 20px" }}>
                          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: inc.type.includes("foreign") ? "rgba(77,159,255,0.1)" : "rgba(240,165,0,0.1)", color: inc.type.includes("foreign") ? "#4d9fff" : "#f0a500", fontWeight: 600 }}>
                            {inc.type.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "13px 20px", fontWeight: 600, color: "#00d97e" }}>+{fmtFull(inc.amount)}</td>
                        <td style={{ padding: "13px 20px", color: inc.tds_deducted > 0 ? "#f0a500" : "#3a3a55" }}>
                          {inc.tds_deducted > 0 ? fmtFull(inc.tds_deducted) : "—"}
                        </td>
                        <td style={{ padding: "13px 20px" }}>
                          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: inc.source === "pdf_import" ? "rgba(157,111,255,0.1)" : "rgba(255,255,255,0.05)", color: inc.source === "pdf_import" ? "#9d6fff" : "#6b6b90", fontWeight: 600 }}>
                            {inc.source === "pdf_import" ? "PDF Import" : "Manual"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── AIS ─── */}
          {tab === "ais" && (
            <div style={{ padding: "40px 48px" }}>
              <div className="au" style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>AIS / Form 26AS Import</h1>
                <p style={{ fontSize: 13, color: "#6b6b90", marginTop: 4 }}>Import your Annual Information Statement from the IT portal. Auto-fills your ITR.</p>
              </div>

              {!aisUploaded && !aisProcessing && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 32 }}>
                    <div style={{ fontSize: 28, marginBottom: 16 }}>🏦</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Upload AIS PDF / JSON</div>
                    <p style={{ fontSize: 13, color: "#8888aa", marginBottom: 24, lineHeight: 1.7 }}>
                      Download from incometax.gov.in → AIS → Download. We'll pre-fill your income, TDS, and other details automatically.
                    </p>
                    <div onClick={simulateAIS} style={{ border: "2px dashed rgba(240,165,0,0.3)", borderRadius: 12, padding: "32px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "rgba(240,165,0,0.02)" }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>⬆</div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Click to upload AIS</div>
                      <div style={{ fontSize: 12, color: "#6b6b90" }}>PDF or JSON · Max 10MB</div>
                    </div>
                    <button onClick={simulateAIS} style={{ marginTop: 16, width: "100%", padding: "12px", background: "#f0a500", color: "#080810", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                      Upload & Auto-fill ITR →
                    </button>
                  </div>

                  <div className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 32, animationDelay: "0.1s" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>What gets imported</div>
                    {[
                      { icon: "💰", title: "All TDS deductions", desc: "Every 26Q and 16A deduction from every payer" },
                      { icon: "📊", title: "Interest income", desc: "Bank FD interest, savings account interest" },
                      { icon: "📈", title: "Dividend income", desc: "Mutual fund and stock dividends" },
                      { icon: "🏠", title: "Property transactions", desc: "TDS on rent, property purchase" },
                      { icon: "🌐", title: "Foreign remittances", desc: "Inward remittances from foreign clients" },
                    ].map((item) => (
                      <div key={item.title} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: "#8888aa", marginTop: 2 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aisProcessing && (
                <div className="au" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360 }}>
                  <div style={{ fontSize: 48, marginBottom: 24 }}>🤖</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Reading your AIS...</div>
                  <p style={{ fontSize: 13, color: "#8888aa", marginBottom: 32 }}>Extracting TDS, income, and transaction data</p>
                  <div style={{ width: 280, height: 4, background: "#181828", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#f0a500", borderRadius: 2, animation: "aisProgress 2.2s ease forwards" }} />
                  </div>
                  <style>{`@keyframes aisProgress { from{width:0}to{width:100%} }`}</style>
                </div>
              )}

              {aisUploaded && (
                <div className="au">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, padding: "14px 20px", background: "rgba(0,217,126,0.08)", border: "1px solid rgba(0,217,126,0.2)", borderRadius: 12 }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>AIS imported successfully</div>
                      <div style={{ fontSize: 12, color: "#8888aa" }}>Found 4 matching transactions · ₹63,000 TDS confirmed</div>
                    </div>
                  </div>

                  <div style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 600 }}>AIS Transactions Matched</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#181828" }}>
                          {["Party","Type","Amount","TDS","Status"].map((h) => (
                            <th key={h} style={{ padding: "11px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b6b90", textTransform: "uppercase", letterSpacing: "0.7px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DEMO_AIS_TRANSACTIONS.map((tx, i) => (
                          <tr key={i} style={{ borderBottom: i < DEMO_AIS_TRANSACTIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                            <td style={{ padding: "13px 20px", fontSize: 13, fontWeight: 500 }}>{tx.party}</td>
                            <td style={{ padding: "13px 20px", fontSize: 12, color: "#8888aa" }}>{tx.type}</td>
                            <td style={{ padding: "13px 20px", fontWeight: 600 }}>{fmtFull(tx.amount)}</td>
                            <td style={{ padding: "13px 20px", color: "#f0a500", fontWeight: 500 }}>{fmtFull(tx.tds)}</td>
                            <td style={{ padding: "13px 20px" }}>
                              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(0,217,126,0.1)", color: "#00d97e", fontWeight: 600 }}>✓ Matched</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── ADVANCE TAX ─── */}
          {tab === "advance-tax" && (
            <div style={{ padding: "40px 48px" }}>
              <div className="au" style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>Advance Tax</h1>
                <p style={{ fontSize: 13, color: "#6b6b90", marginTop: 4 }}>FY 2024–25 · Quarterly schedule</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
                {t.advanceTaxSchedule.map((q, i) => {
                  const paid = DEMO_ADVANCE_TAX.find((a) => a.quarter === q.quarter);
                  const isDone = (paid?.amount_paid ?? 0) >= q.amountDue && q.amountDue > 0;
                  return (
                    <div key={q.quarter} className="au" style={{ background: "#111120", border: `1px solid ${isDone ? "rgba(0,217,126,0.2)" : q.isPast ? "rgba(255,77,109,0.2)" : "rgba(240,165,0,0.2)"}`, borderRadius: 16, padding: 22, animationDelay: `${i * 60}ms` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700 }}>{q.quarter}</div>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isDone ? "#00d97e" : q.isPast ? "#ff4d6d" : "#f0a500", marginTop: 4, boxShadow: `0 0 8px ${isDone ? "#00d97e" : q.isPast ? "#ff4d6d" : "#f0a500"}` }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#6b6b90", marginBottom: 8 }}>Due: {q.deadline}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{fmtFull(q.amountDue)}</div>
                      <div style={{ fontSize: 12, color: isDone ? "#00d97e" : q.isPast ? "#ff4d6d" : "#f0a500", fontWeight: 500 }}>
                        {isDone ? `✓ Paid ${fmtFull(paid!.amount_paid)}` : q.isPast ? "Overdue" : `${q.daysRemaining} days remaining`}
                      </div>
                      {paid?.challan_number && <div style={{ fontSize: 10, color: "#6b6b90", marginTop: 6 }}>{paid.challan_number}</div>}
                    </div>
                  );
                })}
              </div>

              <div className="au" style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28, animationDelay: "0.2s" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>How to pay advance tax</div>
                {[
                  { step: "1", title: "Go to IT portal", desc: "Visit onlineservices.tin.egov-nsdl.com or pay via your bank's tax payment section" },
                  { step: "2", title: "Select Challan 280", desc: "Choose ITNS 280 · Select (0021) Income Tax (Other than Companies)" },
                  { step: "3", title: "Select Advance Tax", desc: "Type of payment: (100) Advance Tax" },
                  { step: "4", title: "Enter PAN and amount", desc: `PAN: ${DEMO_PROFILE.pan} · Pay the exact amount shown above` },
                ].map((s) => (
                  <div key={s.step} style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(240,165,0,0.1)", border: "1px solid rgba(240,165,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: "#f0a500" }}>{s.step}</div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: "#8888aa" }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
                <a href="https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#f0a500", color: "#080810", fontWeight: 700, fontSize: 13, borderRadius: 8, textDecoration: "none" }}>
                  Pay Advance Tax Now →
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
