"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

export default function AdvanceTaxPage() {
  const { user } = useAuth();
  const { taxResult, advanceTax, loading, refetch, totalIncome, advanceTaxPaid } = useTaxData();
  const [paying, setPaying] = useState<string | null>(null);
  const [challan, setChallan] = useState("");
  const [amount, setAmount] = useState("");

  async function markPaid(quarter: string) {
    if (!user || !amount) return;
    const existing = advanceTax.find(a => a.quarter === quarter);
    if (existing) {
      await supabase.from("advance_tax_payments").update({ amount_paid: parseFloat(amount), paid_on: new Date().toISOString().split("T")[0], challan_number: challan || null }).eq("id", existing.id);
    } else {
      await supabase.from("advance_tax_payments").insert({ user_id: user.id, financial_year: "2024-25", quarter, amount_paid: parseFloat(amount), paid_on: new Date().toISOString().split("T")[0], challan_number: challan || null });
    }
    await refetch(); setPaying(null); setChallan(""); setAmount("");
  }

  const schedule = taxResult?.advanceTaxSchedule ?? [];
  const totalDue = schedule.reduce((s, q) => s + q.amountDueThisQuarter, 0);
  const shortfall = Math.max(0, totalDue - advanceTaxPaid);

  return (
    <AppLayout>
      <div style={{ padding: "40px 48px", maxWidth: 900 }}>

        <div className="au" style={{ marginBottom: 32 }}>
          <h1 className="page-title">Advance Tax</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>FY 2024–25 · Pay in 4 quarterly instalments</p>
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Tax Due", value: fmt(totalDue), sub: "All 4 quarters" },
            { label: "Paid So Far", value: fmt(advanceTaxPaid), sub: `${advanceTax.filter(a => a.amount_paid > 0).length} quarters paid`, color: "var(--green)" },
            { label: "Balance Remaining", value: fmt(shortfall), sub: shortfall > 0 ? "Pay to avoid interest" : "You're all caught up ✓", color: shortfall > 0 ? "var(--red)" : "var(--green)" },
          ].map((s, i) => (
            <div key={i} className="au card" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="label">{s.label}</p>
              <p className="stat-num" style={{ color: s.color ?? "var(--text)" }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* No income state */}
        {!loading && totalIncome === 0 && (
          <div className="au card" style={{ textAlign: "center", padding: "48px", borderStyle: "dashed" }}>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>Add income to see your advance tax schedule</p>
          </div>
        )}

        {/* Quarter cards */}
        {schedule.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 28 }}>
            {schedule.map((q, i) => {
              const paid = advanceTax.find(a => a.quarter === q.quarter);
              const paidAmt = paid?.amount_paid ?? 0;
              const isDone = paidAmt >= q.amountDueThisQuarter && q.amountDueThisQuarter > 0;
              const isOverdue = q.isPast && !isDone && q.amountDueThisQuarter > 0;
              const borderColor = isDone ? "var(--green-border)" : isOverdue ? "rgba(255,69,96,0.25)" : q.amountDueThisQuarter > 0 ? "var(--amber-border)" : "var(--border)";
              return (
                <div key={q.quarter} className="au card" style={{ borderColor, animationDelay: `${i * 80}ms` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700 }}>{q.quarter}</span>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: isDone ? "var(--green)" : isOverdue ? "var(--red)" : "var(--amber)" }} />
                      </div>
                      <p style={{ fontSize: 12, color: "var(--muted)" }}>Due: {q.deadline}</p>
                      {q.daysRemaining !== null && !q.isPast && <p style={{ fontSize: 12, color: "var(--amber)", marginTop: 2 }}>{q.daysRemaining} days remaining</p>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className="stat-num" style={{ fontSize: 22 }}>{fmt(q.amountDueThisQuarter)}</p>
                      {paidAmt > 0 && <p style={{ fontSize: 11, color: "var(--green)", marginTop: 2 }}>✓ Paid {fmt(paidAmt)}</p>}
                      {paid?.challan_number && <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{paid.challan_number}</p>}
                    </div>
                  </div>

                  {paying === q.quarter ? (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <p className="label">Amount Paid</p>
                          <input className="input" type="number" placeholder={fmt(q.amountDueThisQuarter)} value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                        <div>
                          <p className="label">Challan No. (optional)</p>
                          <input className="input" placeholder="ITNS280-..." value={challan} onChange={e => setChallan(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary" disabled={!amount} onClick={() => markPaid(q.quarter)} style={{ flex: 1 }}>Confirm Payment</button>
                        <button className="btn btn-ghost" onClick={() => { setPaying(null); setAmount(""); setChallan(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                      {!isDone && (
                        <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => { setPaying(q.quarter); setAmount(q.amountDueThisQuarter.toString()); }}>
                          Mark as Paid
                        </button>
                      )}
                      <a href="https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp" target="_blank" rel="noopener" className="btn btn-primary" style={{ flex: isDone ? 2 : 1, fontSize: 12, textDecoration: "none" }}>
                        Pay on IT Portal →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* How to pay guide */}
        <div className="au card" style={{ animationDelay: "0.35s" }}>
          <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 18 }}>How to Pay Advance Tax (Challan 280)</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { n: "1", title: "Go to IT Portal", desc: "Visit onlineservices.tin.egov-nsdl.com and click 'e-Payment of Taxes'" },
              { n: "2", title: "Select Challan 280", desc: "Choose ITNS 280 — for Income Tax payment" },
              { n: "3", title: "Select Advance Tax", desc: "Assessment Year: 2025-26 · Type of Payment: (100) Advance Tax" },
              { n: "4", title: "Enter PAN & amount", desc: "PAN, bank details, exact amount from above schedule" },
              { n: "5", title: "Save the challan", desc: "Download and save the Challan 280 receipt — enter number above to track" },
            ].map(s => (
              <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--amber-dim)", border: "1px solid var(--amber-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 11, color: "var(--amber)" }}>{s.n}</div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 13 }}>{s.title}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
