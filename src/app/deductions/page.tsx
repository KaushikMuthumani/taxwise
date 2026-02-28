"use client";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

const SECTIONS = [
  { key: "section_80c", label: "Section 80C", limit: 150000, color: "var(--amber)", desc: "PPF, ELSS, LIC premium, EPF, home loan principal, tuition fees", examples: ["PPF contribution", "ELSS mutual fund", "LIC premium", "5-year FD", "NSC", "ULIP", "Home loan principal"] },
  { key: "section_80d", label: "Section 80D", limit: 25000, color: "var(--blue)", desc: "Health insurance premium for self, spouse, and children", examples: ["Health insurance premium", "Mediclaim policy", "Preventive health checkup (₹5000 sub-limit)"] },
  { key: "section_80ccd", label: "NPS 80CCD(1B)", limit: 50000, color: "var(--purple)", desc: "Extra NPS contribution — over and above 80C. Most freelancers miss this.", examples: ["NPS Tier 1 contribution", "Atal Pension Yojana"] },
  { key: "hra", label: "HRA Exemption", limit: 0, color: "var(--green)", desc: "House Rent Allowance — only for salaried. If you pay rent, claim this.", examples: ["Monthly rent paid", "Landlord PAN needed if rent > ₹1L/year"] },
  { key: "home_loan_interest", label: "Home Loan Interest (24b)", limit: 200000, color: "var(--red)", desc: "Interest on home loan for self-occupied property", examples: ["Home loan interest certificate from bank"] },
  { key: "other", label: "Other Deductions", limit: 0, color: "var(--muted)", desc: "80E (education loan), 80G (donations), 80TTA (savings interest), etc.", examples: ["Education loan interest (80E)", "Donations to charity (80G)", "Savings account interest (80TTA, max ₹10K)"] },
];

export default function DeductionsPage() {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, number>>({ section_80c: 0, section_80d: 0, section_80ccd: 0, hra: 0, home_loan_interest: 0, other: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase.from("deductions").select("*").eq("user_id", user.id).eq("financial_year", "2024-25").single();
      if (data) setValues({ section_80c: data.section_80c ?? 0, section_80d: data.section_80d ?? 0, section_80ccd: data.section_80ccd ?? 0, hra: data.hra ?? 0, home_loan_interest: data.home_loan_interest ?? 0, other: data.other ?? 0 });
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from("deductions").upsert({ user_id: user.id, financial_year: "2024-25", ...values, updated_at: new Date().toISOString() }, { onConflict: "user_id,financial_year" });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalDeductions = Object.values(values).reduce((s, v) => s + v, 0);
  const capped80C = Math.min(values.section_80c, 150000);
  const capped80D = Math.min(values.section_80d, 25000);
  const cappedNPS = Math.min(values.section_80ccd, 50000);
  const totalCapped = capped80C + capped80D + cappedNPS + values.hra + Math.min(values.home_loan_interest, 200000) + values.other;

  return (
    <AppLayout>
      <div style={{ padding: "40px 48px", maxWidth: 900 }}>

        <div className="au" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 className="page-title">Deductions</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>FY 2024–25 · Old regime deductions</p>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Deductions"}
          </button>
        </div>

        {/* Summary bar */}
        <div className="au card" style={{ marginBottom: 28, background: "var(--surface2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            <div>
              <p className="label">Total Entered</p>
              <p className="stat-num">{fmt(totalDeductions)}</p>
            </div>
            <div>
              <p className="label">Effective After Caps</p>
              <p className="stat-num" style={{ color: "var(--amber)" }}>{fmt(totalCapped)}</p>
            </div>
            <div>
              <p className="label">Est. Tax Saved (30%)</p>
              <p className="stat-num" style={{ color: "var(--green)" }}>{fmt(Math.round(totalCapped * 0.3))}</p>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Approximate, old regime only</p>
            </div>
          </div>
        </div>

        {/* Deduction sections */}
        {!loading && SECTIONS.map((s, i) => {
          const val = values[s.key] ?? 0;
          const pct = s.limit > 0 ? Math.min(100, Math.round(val / s.limit * 100)) : 0;
          const overLimit = s.limit > 0 && val > s.limit;
          return (
            <div key={s.key} className="au card" style={{ marginBottom: 16, animationDelay: `${i * 50}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600 }}>{s.label}</span>
                    {s.limit > 0 && <span className="badge badge-muted" style={{ fontSize: 9 }}>MAX {fmt(s.limit)}</span>}
                    {overLimit && <span className="badge badge-amber" style={{ fontSize: 9 }}>Capped at {fmt(s.limit)}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{s.desc}</p>
                </div>
                <div style={{ marginLeft: 20, textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>₹</span>
                    <input
                      type="number"
                      value={val || ""}
                      onChange={e => setValues(prev => ({ ...prev, [s.key]: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      style={{ width: 120, padding: "8px 12px", background: "var(--surface2)", border: `1px solid ${overLimit ? "var(--amber-border)" : "var(--border)"}`, borderRadius: 8, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, textAlign: "right", outline: "none" }}
                    />
                  </div>
                  {s.limit > 0 && val > 0 && !overLimit && (
                    <p style={{ fontSize: 11, color: "var(--green)", marginTop: 4 }}>{fmt(s.limit - val)} remaining</p>
                  )}
                </div>
              </div>

              {s.limit > 0 && val > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: overLimit ? "var(--amber)" : s.color }} />
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{pct}% of limit used</p>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {s.examples.map(ex => (
                  <span key={ex} style={{ fontSize: 11, padding: "3px 8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--muted)" }}>{ex}</span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Old regime note */}
        <div className="au card" style={{ background: "var(--surface2)", borderColor: "var(--border2)", marginTop: 8, animationDelay: "0.3s" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>New Regime vs Old Regime</p>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                Deductions like 80C, 80D, and NPS only apply in the <strong>Old Regime</strong>. The New Regime has lower tax rates but doesn't allow these deductions. 
                Go to your Dashboard to see which regime saves you more with your actual numbers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
