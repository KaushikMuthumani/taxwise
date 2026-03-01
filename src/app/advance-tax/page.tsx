"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTaxData } from "@/hooks/useTaxData";

function fmtFull(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

const now = new Date();
const QUARTERS = [
  { q: "Q1", label: "First Quarter", deadline: "15 Jun 2024", pct: 15, dueDate: new Date("2024-06-15") },
  { q: "Q2", label: "Second Quarter", deadline: "15 Sep 2024", pct: 45, dueDate: new Date("2024-09-15") },
  { q: "Q3", label: "Third Quarter", deadline: "15 Dec 2024", pct: 75, dueDate: new Date("2024-12-15") },
  { q: "Q4", label: "Fourth Quarter", deadline: "15 Mar 2025", pct: 100, dueDate: new Date("2025-03-15") },
].map(q => ({ ...q, isPast: q.dueDate < now }));

export default function AdvanceTaxPage() {
  const { user } = useAuth();
  const { taxResult, advanceTax, advanceTaxPaid, refetch, loading } = useTaxData();
  const [payments, setPayments] = useState<Record<string, { amount_paid: number; paid_on: string; challan_number: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);

  useEffect(() => {
    const map: Record<string, any> = {};
    advanceTax.forEach(a => { map[a.quarter] = { amount_paid: a.amount_paid, paid_on: a.paid_on ?? "", challan_number: a.challan_number ?? "" }; });
    setPayments(map);
  }, [advanceTax]);

  const totalTax = taxResult?.taxPayable ?? 0;

  async function markPaid(quarter: string) {
    if (!user) return;
    const p = payments[quarter];
    if (!p?.amount_paid) return;
    setSaving(quarter);
    await supabase.from("advance_tax_payments").upsert({
      user_id: user.id,
      financial_year: "2024-25",
      quarter,
      amount_paid: p.amount_paid,
      paid_on: p.paid_on || new Date().toISOString().split("T")[0],
      challan_number: p.challan_number || null,
    }, { onConflict: "user_id,financial_year,quarter" });
    await refetch();
    setShowForm(null);
    setSaving(null);
  }

  // Per-quarter amounts
  const scheduleAmounts = QUARTERS.map((q, i) => {
    const prevPct = i > 0 ? QUARTERS[i - 1].pct : 0;
    return Math.round(totalTax * (q.pct - prevPct) / 100);
  });

  const totalPaid = Object.values(payments).reduce((s, p) => s + (p.amount_paid || 0), 0);

  return (
    <AppLayout title="Advance Tax" subtitle="Quarterly schedule · FY 2024–25">
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Annual Tax Liability", val: fmtFull(totalTax), bg: "var(--purple-bg)", color: "var(--purple2)" },
          { label: "Total Advance Tax Paid", val: fmtFull(totalPaid), bg: "var(--green-card)", color: "var(--green-text)" },
          { label: "Remaining", val: fmtFull(Math.max(0, totalTax - totalPaid)), bg: "var(--amber)", color: "var(--amber-text)" },
        ].map(c => (
          <div key={c.label} className="au" style={{ background: c.bg, borderRadius: "var(--r-lg)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 500, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: c.color, letterSpacing: "-0.5px" }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Quarter cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {QUARTERS.map((q, i) => {
          const paid = payments[q.q];
          const isDone = paid && paid.amount_paid > 0;
          const due = scheduleAmounts[i];
          const now = new Date();
          const daysLeft = Math.ceil((q.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isShowingForm = showForm === q.q;

          return (
            <div key={q.q} className={`quarter-card ${isDone ? "done" : q.isPast ? "late" : "due"}`}>
              {/* Quarter header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{q.q}</span>
                  <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>{q.pct}% cumulative</div>
                </div>
                <div style={{
                  width: 9, height: 9, borderRadius: "50%", marginTop: 6,
                  background: isDone ? "var(--green-text)" : q.isPast ? "var(--red-text)" : "var(--purple)",
                  boxShadow: isDone ? "0 0 6px var(--green-text)" : q.isPast ? "0 0 6px var(--red-text)" : "0 0 6px var(--purple)",
                }}/>
              </div>

              <div style={{ fontSize: 11, color: "var(--ink4)", marginBottom: 8 }}>{q.deadline}</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>{fmtFull(due)}</div>

              {/* Status */}
              {isDone ? (
                <div style={{ fontSize: 12, color: "var(--green-text)", fontWeight: 600, marginBottom: 12 }}>
                  ✓ Paid {fmtFull(paid.amount_paid)}
                  {paid.paid_on && <div style={{ fontSize: 10, color: "var(--ink4)", fontWeight: 400, marginTop: 1 }}>{paid.paid_on}</div>}
                </div>
              ) : q.isPast ? (
                <div style={{ fontSize: 12, color: "var(--red-text)", fontWeight: 500, marginBottom: 12 }}>⚠ Overdue</div>
              ) : (
                <div style={{ fontSize: 12, color: daysLeft <= 7 ? "var(--red-text)" : "var(--purple)", fontWeight: 500, marginBottom: 12 }}>
                  {daysLeft > 0 ? `${daysLeft} days left` : "Due today"}
                </div>
              )}

              {/* Form or button */}
              {!isDone && (
                isShowingForm ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input className="input" type="number" placeholder="Amount paid (₹)" style={{ fontSize: 12, padding: "7px 10px" }}
                      value={payments[q.q]?.amount_paid || ""} onChange={e => setPayments(prev => ({ ...prev, [q.q]: { ...prev[q.q], amount_paid: parseFloat(e.target.value) || 0, paid_on: prev[q.q]?.paid_on ?? "", challan_number: prev[q.q]?.challan_number ?? "" } }))}/>
                    <input className="input" type="date" style={{ fontSize: 12, padding: "7px 10px" }}
                      value={payments[q.q]?.paid_on || new Date().toISOString().split("T")[0]} onChange={e => setPayments(prev => ({ ...prev, [q.q]: { ...prev[q.q], paid_on: e.target.value } }))}/>
                    <input className="input" type="text" placeholder="Challan no. (optional)" style={{ fontSize: 12, padding: "7px 10px" }}
                      value={payments[q.q]?.challan_number || ""} onChange={e => setPayments(prev => ({ ...prev, [q.q]: { ...prev[q.q], challan_number: e.target.value } }))}/>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-primary" style={{ flex: 1, fontSize: 11, padding: "7px 10px" }} onClick={() => markPaid(q.q)} disabled={saving === q.q}>
                        {saving === q.q ? "Saving..." : "Mark Paid ✓"}
                      </button>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: "7px 10px" }} onClick={() => setShowForm(null)}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button className="btn btn-primary" style={{ width: "100%", fontSize: 12 }} onClick={() => setShowForm(q.q)}>
                      Mark as Paid
                    </button>
                    <a href="https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp" target="_blank" rel="noopener"
                      className="btn btn-ghost" style={{ width: "100%", fontSize: 11, textAlign: "center", textDecoration: "none" }}>
                      Pay via NSDL →
                    </a>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* How to pay */}
      <div className="card au">
        <div className="section-title">How to pay advance tax</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { step: "1", title: "Go to NSDL Portal", desc: "Visit onlineservices.tin.egov-nsdl.com" },
            { step: "2", title: "Select ITNS 280", desc: "Choose Income Tax → Advance Tax (code 100)" },
            { step: "3", title: "Enter your PAN & Amount", desc: "Assessment year 2025-26, amount from above" },
            { step: "4", title: "Pay & Note Challan No.", desc: "Save the BSR code + challan serial number" },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--purple-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--purple2)", flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <a href="https://onlineservices.tin.egov-nsdl.com/etaxnew/tdsnontds.jsp" target="_blank" rel="noopener" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Open NSDL Portal →
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
