"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const PROFESSIONS = [
  { value: "software_developer", label: "Software Developer / Engineer" },
  { value: "designer", label: "Designer / Creative" },
  { value: "consultant", label: "Consultant / Coach" },
  { value: "content_creator", label: "Content Creator / Influencer" },
  { value: "doctor", label: "Doctor / Healthcare" },
  { value: "lawyer", label: "Lawyer / Legal" },
  { value: "architect", label: "Architect / Engineer" },
  { value: "salaried", label: "Salaried Employee" },
  { value: "investor", label: "Investor / Trader" },
  { value: "other", label: "Other / Freelancer" },
];

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [pan, setPan] = useState(profile?.pan ?? "");
  const [profession, setProfession] = useState(profile?.profession ?? "");
  const [regime, setRegime] = useState(profile?.preferred_regime ?? "new");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!profile) return;
    setSaving(true); setError("");
    const { error: e } = await supabase.from("profiles").update({
      full_name: name, pan: pan.toUpperCase() || null,
      profession, preferred_regime: regime, updated_at: new Date().toISOString(),
    }).eq("id", profile.id);
    if (e) { setError(e.message); setSaving(false); return; }
    await refreshProfile();
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppLayout>
      <div style={{ padding: "40px 48px", maxWidth: 720 }}>

        <div className="au" style={{ marginBottom: 36 }}>
          <h1 className="page-title">Settings</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Profile, tax preferences, and account</p>
        </div>

        {error && <div style={{ marginBottom: 20, padding: "12px 16px", background: "var(--red-dim)", border: "1px solid rgba(255,69,96,0.2)", borderRadius: 10, color: "var(--red)", fontSize: 13 }}>{error}</div>}

        {/* Plan banner */}
        {!profile?.is_pro && (
          <div className="au card" style={{ marginBottom: 28, background: "linear-gradient(135deg,rgba(157,111,255,0.08),rgba(157,111,255,0.03))", borderColor: "rgba(157,111,255,0.2)", animationDelay: "0.05s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="badge badge-muted">FREE PLAN</span>
                </div>
                <p style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Upgrade to Taxwise Pro</p>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>AI Advisor (unlimited), cashflow forecasting, ITR download, unlimited bank imports</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}>
                <p style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: "var(--purple)" }}>₹999<span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>/yr</span></p>
                <button className="btn btn-pro" style={{ marginTop: 10, fontSize: 12 }}>Upgrade Now</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(157,111,255,0.12)", flexWrap: "wrap" }}>
              {["✦ AI Advisor (unlimited)", "📊 Cashflow forecasting", "⬆ Unlimited bank imports", "⬒ ITR summary download", "📅 Tax deadline reminders", "📈 Investment planner"].map(f => (
                <span key={f} style={{ fontSize: 12, color: "var(--text2)" }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Profile */}
        <div className="au card" style={{ marginBottom: 20, animationDelay: "0.1s" }}>
          <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Profile</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input className="input" value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} style={{ letterSpacing: 3, fontWeight: 500 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="label">Profession</label>
              <select className="input" value={profession} onChange={e => setProfession(e.target.value)}>
                {PROFESSIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Financial Year</label>
              <select className="input" value="2024-25" disabled>
                <option value="2024-25">2024–25 (Current)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tax regime */}
        <div className="au card" style={{ marginBottom: 20, animationDelay: "0.15s" }}>
          <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Tax Regime Preference</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>Your dashboard always shows both — this sets the default for filing</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { value: "new", label: "New Regime", desc: "Lower rates, no deductions. Best for most freelancers.", recommended: true },
              { value: "old", label: "Old Regime", desc: "Higher rates but 80C, 80D, HRA deductions allowed." },
            ].map(r => (
              <button key={r.value} onClick={() => setRegime(r.value)} style={{ padding: "16px 18px", background: regime === r.value ? "var(--amber-dim)" : "var(--surface2)", border: `1px solid ${regime === r.value ? "var(--amber-border)" : "var(--border)"}`, borderRadius: "var(--r)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", transition: "all 0.14s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: regime === r.value ? "var(--amber)" : "var(--text)" }}>{r.label}</span>
                  {r.recommended && <span className="badge badge-amber" style={{ fontSize: 9 }}>RECOMMENDED</span>}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="au card" style={{ marginBottom: 24, animationDelay: "0.2s" }}>
          <p style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Account</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500 }}>Financial Year</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Currently tracking FY 2024–25</p>
            </div>
            <span className="badge badge-amber">2024–25</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500 }}>Plan</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>{profile?.is_pro ? "Taxwise Pro — all features unlocked" : "Free plan — upgrade for AI advisor and more"}</p>
            </div>
            <span className={`badge ${profile?.is_pro ? "badge-green" : "badge-muted"}`}>{profile?.is_pro ? "PRO" : "FREE"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500 }}>Data & Privacy</p>
              <p style={{ fontSize: 12, color: "var(--muted)" }}>Your data is encrypted and never sold</p>
            </div>
            <span style={{ fontSize: 12, color: "var(--green)" }}>🔒 Secure</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "12px" }}>
            {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
          </button>
          <Link href="/dashboard" className="btn btn-ghost" style={{ padding: "12px 24px" }}>Cancel</Link>
        </div>
      </div>
    </AppLayout>
  );
}
