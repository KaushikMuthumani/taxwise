"use client";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

function fmt(n: number) { return n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`; }
function fmtFull(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

export default function DashboardPage() {
  const { profile } = useAuth();
  const { incomes, expenses, deductions, advanceTax, taxResult, loading, totalIncome, totalTDS, totalExpenses, advanceTaxPaid, taxHealthScore } = useTaxData();

  const nextQ = taxResult?.advanceTaxSchedule.find(q => !q.isPast && q.amountDueThisQuarter > 0);
  const scoreColor = taxHealthScore === null ? "var(--dim)" : taxHealthScore >= 75 ? "var(--green)" : taxHealthScore >= 50 ? "var(--amber)" : "var(--red)";
  const remaining80C = Math.max(0, 150000 - (deductions?.section_80c ?? 0));
  const remaining80D = Math.max(0, 25000 - (deductions?.section_80d ?? 0));
  const remainingNPS = Math.max(0, 50000 - (deductions?.section_80ccd ?? 0));

  if (loading) return (
    <AppLayout>
      <div style={{ padding: "40px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div style={{ padding: "40px 48px", maxWidth: 1200 }}>

        {/* Header */}
        <div className="au" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 className="page-title">Hey, {profile?.full_name?.split(" ")[0] ?? "there"} 👋</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>FY 2024–25 · {profile?.profession?.replace(/_/g," ")} · {taxResult?.is44ADAEligible ? "ITR-4 (44ADA)" : "ITR"}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/advisor" className="btn btn-ghost" style={{ fontSize: 13 }}>✦ Ask AI Advisor</Link>
            <Link href="/import" className="btn btn-ghost" style={{ fontSize: 13 }}>⬆ Import Bank PDF</Link>
            <Link href="/income" className="btn btn-primary" style={{ fontSize: 13 }}>+ Add Income</Link>
          </div>
        </div>

        {/* Empty state */}
        {incomes.length === 0 && (
          <div className="au card" style={{ textAlign: "center", padding: "56px 24px", marginBottom: 28, borderStyle: "dashed", borderColor: "var(--border2)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Start by adding your income</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>
              Add income manually or import your bank statement. Your tax calculation, AI insights, and health score appear instantly.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Link href="/import" className="btn btn-primary">⬆ Import Bank Statement</Link>
              <Link href="/income" className="btn btn-ghost">+ Add Manually</Link>
              <Link href="/advisor" className="btn btn-ghost">✦ Talk to AI Advisor</Link>
            </div>
          </div>
        )}

        {incomes.length > 0 && (<>

          {/* 44ADA banner */}
          {taxResult?.is44ADAEligible && (
            <div className="au" style={{ background: "linear-gradient(135deg,rgba(240,165,0,0.09),rgba(240,165,0,0.03))", border: "1px solid var(--amber-border)", borderRadius: "var(--r-xl)", padding: "22px 32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden", animationDelay: "0.05s" }}>
              <div style={{ position: "absolute", right: 0, top: -20, fontFamily: "var(--font-head)", fontSize: 90, fontWeight: 800, color: "rgba(240,165,0,0.04)", letterSpacing: -4, userSelect: "none" }}>44ADA</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--amber)", textTransform: "uppercase", marginBottom: 6 }}>Section 44ADA · Presumptive Taxation Active</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 600, marginBottom: 4 }}>You pay tax on 50% of income — not 100%</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{fmt(taxResult.presumptiveSavings)} of income is untaxed by default</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Untaxed income</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 34, fontWeight: 800, color: "var(--amber)", letterSpacing: "-1px" }}>{fmt(taxResult.presumptiveSavings)}</div>
              </div>
            </div>
          )}

          {/* Advance tax alert */}
          {nextQ && (
            <div className="au" style={{ background: "rgba(255,69,96,0.06)", border: "1px solid rgba(255,69,96,0.18)", borderRadius: "var(--r)", padding: "14px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", animationDelay: "0.1s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>⏰</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Advance Tax Due — {nextQ.quarter} · {nextQ.deadline}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{nextQ.daysRemaining} days remaining</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, color: "var(--red)" }}>{fmtFull(nextQ.amountDueThisQuarter)}</div>
                <a href="https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp" target="_blank" rel="noopener" className="btn btn-primary" style={{ fontSize: 12 }}>Pay Now →</a>
              </div>
            </div>
          )}

          {/* Main stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Income", value: fmt(totalIncome), sub: `${incomes.length} sources`, delay: 0 },
              { label: "Tax Payable", value: taxResult ? fmtFull(taxResult.taxPayable) : "—", sub: taxResult ? `Rate: ${taxResult.effectiveTaxRate}%` : "", accent: "amber", delay: 60 },
              { label: "TDS Deducted", value: fmtFull(totalTDS), sub: "Credited with IT dept", delay: 120 },
              { label: taxResult?.refundDue && taxResult.refundDue > 0 ? "Refund Due" : "Balance Due", value: taxResult ? fmtFull(taxResult.refundDue > 0 ? taxResult.refundDue : Math.max(0, taxResult.taxPayable - advanceTaxPaid)) : "—", sub: taxResult?.refundDue > 0 ? "After advance tax" : "Pay by March 15", accent: taxResult?.refundDue > 0 ? "green" : "red", delay: 180 },
            ].map(s => (
              <div key={s.label} className="au card" style={{ animationDelay: `${s.delay}ms` }}>
                <p className="label">{s.label}</p>
                <p className="stat-num" style={{ color: s.accent === "amber" ? "var(--amber)" : s.accent === "green" ? "var(--green)" : s.accent === "red" ? "var(--red)" : "var(--text)" }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Main content grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

            {/* AI nudge card */}
            <div className="au card" style={{ background: "linear-gradient(135deg,rgba(157,111,255,0.08),rgba(157,111,255,0.02))", borderColor: "rgba(157,111,255,0.18)", animationDelay: "0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>✦</span>
                  <span style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600 }}>What to do this month</span>
                </div>
                <Link href="/advisor" style={{ fontSize: 11, color: "var(--purple)" }}>Ask more →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {remaining80C > 0 && (
                  <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "rgba(157,111,255,0.06)", borderRadius: 10, border: "1px solid rgba(157,111,255,0.12)" }}>
                    <span style={{ fontSize: 18 }}>💰</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Invest {fmt(remaining80C)} more in 80C</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>ELSS or PPF before March 31 → saves up to {fmt(remaining80C * 0.312)} in tax</div>
                    </div>
                  </div>
                )}
                {remainingNPS > 0 && (
                  <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "rgba(157,111,255,0.06)", borderRadius: 10, border: "1px solid rgba(157,111,255,0.12)" }}>
                    <span style={{ fontSize: 18 }}>📈</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Add {fmt(remainingNPS)} to NPS (80CCD)</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Extra ₹50K deduction over 80C limit → saves {fmtFull(remainingNPS * 0.312)}</div>
                    </div>
                  </div>
                )}
                {remaining80D > 0 && (
                  <div style={{ display: "flex", gap: 12, padding: "12px 14px", background: "rgba(157,111,255,0.06)", borderRadius: 10, border: "1px solid rgba(157,111,255,0.12)" }}>
                    <span style={{ fontSize: 18 }}>🏥</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Health insurance premium (80D)</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{fmt(remaining80D)} remaining limit → buy health cover and claim deduction</div>
                    </div>
                  </div>
                )}
                {remaining80C === 0 && remainingNPS === 0 && remaining80D === 0 && (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--green)", fontSize: 14 }}>
                    ✓ All deductions maximised — great work!
                  </div>
                )}
              </div>
            </div>

            {/* Tax health + regime */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Health score */}
              <div className="au card" style={{ animationDelay: "0.25s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600 }}>Tax Health Score</span>
                  <span style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: scoreColor }}>{taxHealthScore ?? "—"}</span>
                </div>
                <div className="progress" style={{ marginBottom: 12 }}>
                  <div className="progress-fill" style={{ width: `${taxHealthScore ?? 0}%`, background: scoreColor }} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {taxResult?.is44ADAEligible && <span className="badge badge-green">44ADA ✓</span>}
                  {taxResult?.recommendedRegime === "new" && <span className="badge badge-amber">Best Regime ✓</span>}
                  {advanceTaxPaid > 0 && <span className="badge badge-blue">Advance Tax ✓</span>}
                  {(deductions?.section_80c ?? 0) > 0 && <span className="badge badge-purple">Deductions ✓</span>}
                </div>
              </div>

              {/* Regime comparison */}
              {taxResult && (
                <div className="au card" style={{ animationDelay: "0.3s" }}>
                  <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Regime Comparison</p>
                  {[
                    { label: "New Regime", tax: taxResult.newRegimeTax, winner: taxResult.recommendedRegime === "new" },
                    { label: "Old Regime", tax: taxResult.oldRegimeTax, winner: taxResult.recommendedRegime === "old" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ width: 82, fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
                      <div className="progress" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${Math.round(r.tax / Math.max(taxResult.newRegimeTax, taxResult.oldRegimeTax, 1) * 100)}%`, background: r.winner ? "var(--amber)" : "var(--dim)" }} />
                      </div>
                      <span style={{ width: 76, textAlign: "right", fontSize: 12, fontWeight: r.winner ? 600 : 400 }}>{fmtFull(r.tax)}</span>
                      {r.winner && <span className="badge badge-green" style={{ fontSize: 9 }}>SAVE {fmt(taxResult.regimeSavings)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deduction progress */}
          <div className="au card" style={{ marginBottom: 20, animationDelay: "0.35s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600 }}>Deduction Limits</p>
              <Link href="/deductions" style={{ fontSize: 12, color: "var(--amber)" }}>Manage →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {[
                { label: "80C — PPF/ELSS/LIC", used: deductions?.section_80c ?? 0, limit: 150000 },
                { label: "80D — Health Insurance", used: deductions?.section_80d ?? 0, limit: 25000 },
                { label: "NPS 80CCD(1B)", used: deductions?.section_80ccd ?? 0, limit: 50000 },
              ].map(d => {
                const pct = Math.min(100, Math.round(d.used / d.limit * 100));
                return (
                  <div key={d.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{d.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{fmtFull(d.used)} / {fmt(d.limit)}</span>
                    </div>
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--green)" : pct >= 60 ? "var(--amber)" : "var(--blue)" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{pct}% used · {fmt(d.limit - d.used)} remaining</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent income */}
          <div className="au card" style={{ padding: 0, overflow: "hidden", animationDelay: "0.4s" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600 }}>Recent Income</span>
              <Link href="/income" style={{ fontSize: 12, color: "var(--amber)" }}>View all →</Link>
            </div>
            <table className="table">
              <thead><tr><th>Date</th><th>Client / Source</th><th>Type</th><th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "right" }}>TDS</th></tr></thead>
              <tbody>
                {incomes.slice(0, 5).map(inc => (
                  <tr key={inc.id}>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{inc.date}</td>
                    <td style={{ fontWeight: 500 }}>{inc.client_name ?? inc.description ?? "—"}</td>
                    <td><span className="badge badge-muted" style={{ fontSize: 9 }}>{inc.type.replace(/_/g," ")}</span></td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--green)" }}>+{fmtFull(inc.amount)}</td>
                    <td style={{ textAlign: "right", color: inc.tds_deducted > 0 ? "var(--amber)" : "var(--dim)" }}>{inc.tds_deducted > 0 ? fmtFull(inc.tds_deducted) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </>)}
      </div>
    </AppLayout>
  );
}
