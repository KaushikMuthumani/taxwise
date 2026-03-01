"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTaxData } from "@/hooks/useTaxData";

function fmtFull(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

const SECTIONS = [
  {
    key: "section_80c", label: "Section 80C", limit: 150000,
    color: "var(--purple)", bg: "var(--purple-bg)",
    desc: "PPF, ELSS, LIC, 5-yr FD, home loan principal",
    examples: ["PPF contribution", "ELSS mutual fund", "LIC premium", "5-year FD", "NSC", "Sukanya Samriddhi"],
  },
  {
    key: "section_80d", label: "Section 80D", limit: 25000,
    color: "var(--green-text)", bg: "var(--green-card)",
    desc: "Health insurance premium for self + family",
    examples: ["Mediclaim premium", "Star Health", "HDFC ERGO", "Family floater policy"],
  },
  {
    key: "section_80ccd", label: "NPS 80CCD(1B)", limit: 50000,
    color: "var(--amber-text)", bg: "var(--amber)",
    desc: "Extra NPS contribution — over and above 80C",
    examples: ["NPS Tier 1 contribution", "Atal Pension Yojana"],
  },
  {
    key: "hra", label: "HRA Exemption", limit: 0,
    color: "var(--purple2)", bg: "var(--purple-bg2)",
    desc: "House rent allowance — salaried employees only",
    examples: ["Monthly rent receipts", "Landlord PAN if rent > ₹1L/yr"],
  },
  {
    key: "home_loan_interest", label: "Home Loan Interest", limit: 200000,
    color: "#0891b2", bg: "#e0f2fe",
    desc: "Interest on home loan — Section 24(b)",
    examples: ["Bank interest certificate", "Home loan statement"],
  },
  {
    key: "other", label: "Other Deductions", limit: 0,
    color: "var(--ink3)", bg: "var(--bg2)",
    desc: "80E (education loan), 80G (donations), etc.",
    examples: ["Education loan interest", "80G donations", "80U disability"],
  },
];

function DonutRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg2)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${pct/100*circ} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}/>
    </svg>
  );
}

export default function DeductionsPage() {
  const { user } = useAuth();
  const { refetch } = useTaxData();
  const [vals, setVals] = useState<Record<string, number>>({
    section_80c: 0, section_80d: 0, section_80ccd: 0, hra: 0, home_loan_interest: 0, other: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase.from("deductions").select("*").eq("user_id", user.id).eq("financial_year", "2024-25").single();
      if (data) {
        setVals({
          section_80c: data.section_80c ?? 0,
          section_80d: data.section_80d ?? 0,
          section_80ccd: data.section_80ccd ?? 0,
          hra: data.hra ?? 0,
          home_loan_interest: data.home_loan_interest ?? 0,
          other: data.other ?? 0,
        });
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from("deductions").upsert({
      user_id: user.id,
      financial_year: "2024-25",
      ...vals,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,financial_year" });
    await refetch();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  }

  // Calculate realistic marginal rate from taxEngine instead of flat 30%
  // New regime slab: 0-3L=0%, 3-7L=5%, 7-10L=10%, 10-12L=15%, 12-15L=20%, 15L+=30%
  function getMarginalRate(income: number): number {
    if (income <= 300000) return 0;
    if (income <= 700000) return 0.05;
    if (income <= 1000000) return 0.10;
    if (income <= 1200000) return 0.15;
    if (income <= 1500000) return 0.20;
    return 0.30;
  }

  const totalSavings = SECTIONS.reduce((sum, s) => {
    if (!s.limit) return sum;
    return sum + Math.min(vals[s.key] ?? 0, s.limit) * getMarginalRate(Object.values(vals).reduce((a, b) => a + (b ?? 0), 0));
  }, 0);

  return (
    <AppLayout title="Deductions" subtitle="Maximise your savings before March 31, 2025">
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 20 }}/>)}
        </div>
      ) : (<>
        {/* Summary banner */}
        <div className="au" style={{ marginBottom: 24, padding: "18px 24px", background: "var(--purple-bg)", border: "1px solid rgba(152,139,238,0.2)", borderRadius: "var(--r-xl)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--purple2)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Your Estimated Tax Savings</div>
            <div style={{ fontSize: 13, color: "var(--ink3)" }}>From the deductions you've entered so far</div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--purple2)", letterSpacing: "-1px" }}>
            {fmtFull(Math.round(totalSavings))}
          </div>
        </div>

        {/* Deduction cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {SECTIONS.map(s => {
            const used = vals[s.key] ?? 0;
            const pct = s.limit > 0 ? Math.min(100, Math.round(used / s.limit * 100)) : 0;
            const remaining = s.limit > 0 ? Math.max(0, s.limit - used) : null;
            const marginalRate = getMarginalRate(Object.values(vals).reduce((a, b) => a + (b ?? 0), 0));
            const saving = s.limit > 0 ? Math.round(Math.min(used, s.limit) * marginalRate) : null;

            return (
              <div key={s.key} className="card au" style={{ transition: "all 0.2s", cursor: "default" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "var(--ink4)" }}>{s.desc}</div>
                  </div>
                  {s.limit > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, whiteSpace: "nowrap", marginLeft: 10 }}>
                      Max {fmtFull(s.limit)}
                    </span>
                  )}
                </div>

                {/* Donut + input */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                  {s.limit > 0 && (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <DonutRing pct={pct} color={s.color} size={60}/>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: s.color }}>{pct}%</div>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <label className="label">Amount Invested / Paid (₹)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)", fontSize: 14 }}>₹</span>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        max={s.limit || 9999999}
                        placeholder="0"
                        value={used || ""}
                        onChange={e => setVals(v => ({ ...v, [s.key]: Math.max(0, parseFloat(e.target.value) || 0) }))}
                        style={{ paddingLeft: 28 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {s.limit > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: s.color }}/>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ fontSize: 11, color: "var(--ink4)" }}>{fmtFull(used)} used</span>
                      {remaining !== null && remaining > 0 && <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{fmtFull(remaining)} left</span>}
                    </div>
                  </div>
                )}

                {/* Tax saving callout */}
                {saving !== null && saving > 0 && (
                  <div style={{ padding: "8px 12px", background: "var(--green-card)", borderRadius: "var(--r-sm)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--ink3)" }}>Saves you</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-text)" }}>~{fmtFull(saving)}</span>
                  </div>
                )}

                {/* Examples */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {s.examples.map(ex => (
                    <span key={ex} style={{ fontSize: 10, padding: "2px 8px", background: "var(--bg)", borderRadius: 20, color: "var(--ink3)" }}>{ex}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {saved && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--green-text)", fontSize: 14, fontWeight: 500 }}>
              <span>✓</span> Deductions saved!
            </div>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "11px 32px" }}>
            {saving ? "Saving..." : "Save Deductions"}
          </button>
        </div>
      </>)}
    </AppLayout>
  );
}
