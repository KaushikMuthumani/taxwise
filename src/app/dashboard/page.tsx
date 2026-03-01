"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

function fmt(n: number) { return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`; }
function fmtFull(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const currentMonth = new Date().getMonth();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: "100%", height: `${Math.round((v / max) * 80)}px`, borderRadius: "6px 6px 0 0", background: i === currentMonth ? color : "var(--purple-bg)", transition: "height 0.6s cubic-bezier(0.22,1,0.36,1)", minHeight: 8 }} />
          <span style={{ fontSize: 9, color: "var(--ink4)", fontWeight: i === currentMonth ? 600 : 400 }}>{MONTHS[i].slice(0, 3)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { incomes, expenses, deductions, advanceTax, taxResult, loading, totalIncome, totalTDS, totalExpenses, advanceTaxPaid, taxHealthScore } = useTaxData();
  const [period, setPeriod] = useState("6 months");

  const nextQ = taxResult?.advanceTaxSchedule.find(q => !q.isPast && q.amountDueThisQuarter > 0);
  const remaining80C = Math.max(0, 150000 - (deductions?.section_80c ?? 0));
  const remaining80D = Math.max(0, 25000 - (deductions?.section_80d ?? 0));
  const remainingNPS = Math.max(0, 50000 - (deductions?.section_80ccd ?? 0));

  // Real monthly income bars derived from actual income records
  const monthlyData = (() => {
    const buckets = new Array(12).fill(0);
    for (const inc of incomes) {
      if (!inc.date) continue;
      const d = new Date(inc.date);
      const fy2425Start = new Date("2024-04-01");
      const fy2425End = new Date("2025-03-31");
      if (d >= fy2425Start && d <= fy2425End) {
        // FY month index: April=0, May=1, ..., March=11
        const fyMonthIdx = ((d.getMonth() - 3 + 12) % 12);
        buckets[fyMonthIdx] += inc.amount;
      }
    }
    // Convert to calendar month order (Jan-Dec) for display
    // FY index 0=Apr → calendar month 3, so shift: calIdx = (fyIdx + 3) % 12
    const calBuckets = new Array(12).fill(0);
    buckets.forEach((v, fyIdx) => { calBuckets[(fyIdx + 3) % 12] = v; });
    // If no real data, return dummy to keep chart renderable
    if (calBuckets.every(v => v === 0)) return [62, 78, 95, 110, 85, 140, 130, 105, 88, 120, 135, 150];
    return calBuckets;
  })();

  if (loading) return (
    <AppLayout>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />)}
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      {/* Empty state */}
      {incomes.length === 0 && (
        <div className="au card" style={{ textAlign: "center", padding: "56px 24px", borderRadius: 24, border: "2px dashed var(--bg2)" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Add your first income</h3>
          <p style={{ fontSize: 14, color: "var(--ink3)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Import your bank statement or add income manually — your tax picture appears instantly.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/import" className="btn btn-primary">⬆ Import Bank Statement</Link>
            <Link href="/income" className="btn btn-ghost">+ Add Manually</Link>
          </div>
        </div>
      )}

      {incomes.length > 0 && (<>
        {/* Advance tax alert */}
        {nextQ && (
          <div className="au" style={{ marginBottom: 20, padding: "14px 22px", background: "var(--red)", borderRadius: "var(--r-lg)", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(217,55,81,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>⏰</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--red-text)" }}>Advance Tax Due — {nextQ.quarter} · {nextQ.deadline}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 1 }}>{nextQ.daysRemaining} days remaining</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--red-text)" }}>{fmtFull(nextQ.amountDueThisQuarter)}</div>
              <a href="https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp" target="_blank" rel="noopener" className="btn btn-danger" style={{ fontSize: 12 }}>Pay Now →</a>
            </div>
          </div>
        )}

        {/* Overview section */}
        <div className="section-header" style={{ marginBottom: 12 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Overview</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/advisor" className="btn btn-primary" style={{ fontSize: 12, padding: "7px 16px" }}>✦ AI Advisor</Link>
            <Link href="/income" className="btn btn-ghost" style={{ fontSize: 12, padding: "7px 16px" }}>+ Add Income</Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
          {/* Balance/Income card */}
          <div className="au stat-card stat-card-purple" style={{ animationDelay: "0ms" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="stat-card-label">Total Income</span>
              <span className="stat-card-icon">💼</span>
            </div>
            <div className="stat-card-value">{fmt(totalIncome)}</div>
            <div className="stat-card-sub">{incomes.length} sources · FY 2024–25</div>
            <div className="stat-card-blob" style={{ background: "var(--purple)", width: 70, height: 70 }} />
          </div>

          {/* Tax card */}
          <div className="au stat-card stat-card-lilac" style={{ animationDelay: "60ms" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="stat-card-label">Tax Payable</span>
              <span className="stat-card-icon">🧾</span>
            </div>
            <div className="stat-card-value">{taxResult ? fmtFull(taxResult.taxPayable) : "—"}</div>
            <div className="stat-card-sub">
              {taxResult ? `Rate: ${taxResult.effectiveTaxRate}% effective` : "Add income to calculate"}
            </div>
            <div className="stat-card-blob" style={{ background: "#9d86e8", width: 70, height: 70 }} />
          </div>

          {/* Refund card */}
          <div className="au stat-card stat-card-green" style={{ animationDelay: "120ms" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="stat-card-label">{taxResult?.refundDue && taxResult.refundDue > 0 ? "Refund Due" : "TDS Deducted"}</span>
              <span className="stat-card-icon">{taxResult?.refundDue && taxResult.refundDue > 0 ? "💚" : "🏦"}</span>
            </div>
            <div className="stat-card-value" style={{ color: "var(--green-text)" }}>
              {taxResult?.refundDue && taxResult.refundDue > 0 ? fmtFull(taxResult.refundDue) : fmtFull(totalTDS)}
            </div>
            <div className="stat-card-sub">
              {taxResult?.refundDue && taxResult.refundDue > 0 ? "After advance tax + TDS credit" : "Credited with Income Tax dept"}
            </div>
            <div className="stat-card-blob" style={{ background: "var(--green-text)", width: 70, height: 70 }} />
          </div>
        </div>

        {/* Analytics + 44ADA */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>

          {/* Analytics chart */}
          <div className="au card" style={{ animationDelay: "0.15s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div>
                <div className="section-title" style={{ marginBottom: 2 }}>Analytics</div>
                {taxResult && <div style={{ fontSize: 12, color: "var(--ink3)" }}>Expected annual income</div>}
              </div>
              <div className="period-tabs">
                {["Week", "Month", "6 months", "Year"].map(p => (
                  <button key={p} className={`period-tab${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
            </div>
            {totalIncome > 0 && (
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.5px", marginBottom: 16 }}>
                {fmt(totalIncome)}
                <span style={{ fontSize: 13, fontWeight: 400, color: "var(--green-text)", marginLeft: 8 }}>↗ FY 2024–25</span>
              </div>
            )}
            <BarChart data={monthlyData} color="var(--purple)" />
          </div>

          {/* 44ADA + regime */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {taxResult?.is44ADAEligible && (
              <div className="au banner-44ada" style={{ animationDelay: "0.18s" }}>
                <div className="banner-44ada-wm">44ADA</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--purple2)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 4 }}>44ADA Active</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>50% of income untaxed</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>{fmt(taxResult.presumptiveSavings)} saved</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--purple2)", letterSpacing: "-0.8px" }}>{fmt(taxResult.presumptiveSavings)}</div>
                </div>
              </div>
            )}

            {taxResult && (
              <div className="au card" style={{ animationDelay: "0.2s" }}>
                <div className="section-title" style={{ marginBottom: 14 }}>Best Regime</div>
                {[
                  { label: "New Regime", tax: taxResult.newRegimeTax, winner: taxResult.recommendedRegime === "new" },
                  { label: "Old Regime", tax: taxResult.oldRegimeTax, winner: taxResult.recommendedRegime === "old" },
                ].map(r => (
                  <div key={r.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "var(--ink3)" }}>{r.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtFull(r.tax)}</span>
                        {r.winner && <span className="badge badge-green" style={{ fontSize: 9 }}>SAVE {fmt(taxResult.regimeSavings)}</span>}
                      </div>
                    </div>
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${Math.round(r.tax / Math.max(taxResult.newRegimeTax, taxResult.oldRegimeTax, 1) * 100)}%`, background: r.winner ? "var(--purple)" : "var(--bg2)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transactions + Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

          {/* Recent transactions */}
          <div className="au card" style={{ padding: 0, overflow: "hidden", animationDelay: "0.22s" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Transactions</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="filter-pill">Period ▾</button>
                <button className="filter-pill">Source ▾</button>
              </div>
            </div>

            {incomes.slice(0, 5).length > 0 ? (
              <table className="tw-table">
                <thead>
                  <tr><th>Name</th><th>Type</th><th>Date</th><th style={{ textAlign: "right" }}>Amount</th></tr>
                </thead>
                <tbody>
                  {incomes.slice(0, 5).map(inc => (
                    <tr key={inc.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                            {(inc.client_name ?? inc.type ?? "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{inc.client_name ?? inc.description ?? "—"}</div>
                            <div style={{ fontSize: 11, color: "var(--ink4)" }}>{inc.type.replace(/_/g, " ")}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-purple" style={{ fontSize: 10 }}>{inc.source === "pdf_import" ? "Import" : "Manual"}</span></td>
                      <td style={{ color: "var(--ink3)", fontSize: 12 }}>{inc.date}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "var(--green-text)", fontSize: 13 }}>+{fmtFull(inc.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink4)" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <p style={{ fontSize: 13 }}>No transactions yet</p>
              </div>
            )}

            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--bg)", textAlign: "center" }}>
              <Link href="/income" className="btn-text btn" style={{ fontSize: 13 }}>View all income →</Link>
            </div>
          </div>

          {/* Action panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Quick actions */}
            <div className="au card" style={{ animationDelay: "0.25s" }}>
              <div className="section-title">Action</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/import" className="action-card">
                  <div className="action-icon">⬆</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Import Statement</div>
                    <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>Upload bank PDF</div>
                  </div>
                </Link>
                <Link href="/advance-tax" className="action-card">
                  <div className="action-icon">◷</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Pay Advance Tax</div>
                    <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>Quarterly schedule</div>
                  </div>
                </Link>
                <Link href="/file-itr" className="action-card">
                  <div className="action-icon">⬒</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>File ITR</div>
                    <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>Download summary</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* AI nudges */}
            {(remaining80C > 0 || remainingNPS > 0 || remaining80D > 0) && (
              <div className="au card" style={{ animationDelay: "0.28s", background: "var(--purple-bg2)", border: "1px solid var(--purple-bg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>💡 Save before March 31</div>
                  <Link href="/advisor" style={{ fontSize: 11, color: "var(--purple)", fontWeight: 500 }}>Ask AI →</Link>
                </div>
                {remaining80C > 0 && (
                  <div style={{ marginBottom: 10, padding: "12px 14px", background: "var(--white)", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>80C — {fmt(remaining80C)} remaining</div>
                      <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>ELSS or PPF before March 31</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green-text)" }}>Save {fmt(remaining80C * 0.3)}</div>
                  </div>
                )}
                {remainingNPS > 0 && (
                  <div style={{ padding: "12px 14px", background: "var(--white)", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>NPS — {fmt(remainingNPS)} remaining</div>
                      <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>Extra ₹50K deduction</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green-text)" }}>Save {fmt(remainingNPS * 0.3)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Deduction summary */}
            <div className="au card" style={{ animationDelay: "0.3s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Deductions</div>
                <Link href="/deductions" className="btn-text btn" style={{ fontSize: 12, padding: "2px 6px" }}>Edit</Link>
              </div>
              {[
                { label: "80C", used: deductions?.section_80c ?? 0, limit: 150000, color: "var(--purple)" },
                { label: "80D", used: deductions?.section_80d ?? 0, limit: 25000, color: "var(--green-text)" },
                { label: "NPS", used: deductions?.section_80ccd ?? 0, limit: 50000, color: "var(--amber-text)" },
              ].map(d => (
                <div key={d.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--ink3)" }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{fmtFull(d.used)} / {fmt(d.limit)}</span>
                  </div>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${Math.min(100, Math.round(d.used / d.limit * 100))}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>)}
    </AppLayout>
  );
}
