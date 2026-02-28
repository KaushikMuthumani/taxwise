"use client";

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/taxEngine";

const INCOME_TYPES = [
  { value: "freelance_indian", label: "Freelance — Indian Client" },
  { value: "freelance_foreign", label: "Freelance — Foreign Client" },
  { value: "gig", label: "Gig Work (Swiggy/Zomato)" },
  { value: "creator", label: "Creator (YouTube/Instagram)" },
  { value: "salary", label: "Salary" },
  { value: "other", label: "Other" },
];

export default function IncomePage() {
  const { user } = useAuth();
  const { incomes, taxResult, loading, refetch } = useTaxData();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: "freelance_indian", description: "", client_name: "", amount: "", tds_deducted: "", date: new Date().toISOString().split("T")[0] });

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalTDS = incomes.reduce((s, i) => s + i.tds_deducted, 0);

  async function handleAdd() {
    if (!form.amount || !user) return;
    setSaving(true);
    await supabase.from("income_sources").insert({
      user_id: user.id, financial_year: "2024-25",
      type: form.type, description: form.description,
      client_name: form.client_name, amount: parseFloat(form.amount),
      tds_deducted: parseFloat(form.tds_deducted || "0"), date: form.date,
    });
    await refetch();
    setForm({ type: "freelance_indian", description: "", client_name: "", amount: "", tds_deducted: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("income_sources").delete().eq("id", id);
    await refetch();
  }

  return (
    <AppLayout>
      <div style={{ padding: "40px 48px" }}>
        <div className="animate-fadeUp" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px" }}>Income</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>FY 2024–25</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="/import" className="btn btn-ghost" style={{ textDecoration: "none" }}>⬆ Import PDF</a>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Income</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Income", value: formatINR(totalIncome), sub: `${incomes.length} entries` },
            { label: "TDS Deducted", value: formatINR(totalTDS), sub: "Already with govt" },
            { label: "Net Received", value: formatINR(totalIncome - totalTDS), sub: "In your account" },
          ].map((s, i) => (
            <div key={i} className="card animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="label">{s.label}</p>
              <p style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 600 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="card animate-fadeUp" style={{ marginBottom: 24, borderColor: "rgba(245,166,35,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 600 }}>Add Income Entry</h3>
              <button className="btn btn-ghost" style={{ padding: "6px 12px" }} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Income Type", key: "type", type: "select" },
                { label: "Client / Source", key: "client_name", type: "text", placeholder: "Acme Corp" },
                { label: "Description", key: "description", type: "text", placeholder: "Website development" },
                { label: "Date", key: "date", type: "date" },
                { label: "Amount (₹)", key: "amount", type: "number", placeholder: "0" },
                { label: "TDS Deducted (₹)", key: "tds_deducted", type: "number", placeholder: "0" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  {f.type === "select" ? (
                    <select className="input" value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      {INCOME_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  ) : (
                    <input className="input" type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? "Saving..." : "Save Entry"}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card animate-fadeUp" style={{ padding: 0, overflow: "hidden", animationDelay: "200ms" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 600 }}>All Income</h3>
            <span className="badge badge-muted">{incomes.length} entries</span>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>Loading...</div>
          ) : incomes.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>No income entries yet. Add one above or import a bank statement.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Client / Description</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>TDS</th>
                  <th style={{ textAlign: "right" }}>Net</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((inc) => (
                  <tr key={inc.id}>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{inc.date}</td>
                    <td><span className="badge badge-amber" style={{ fontSize: 10 }}>{inc.type.replace(/_/g, " ")}</span></td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{inc.client_name ?? "—"}</div>
                      {inc.description && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{inc.description}</div>}
                      {inc.source === "pdf_import" && <span className="badge badge-muted" style={{ fontSize: 9, marginTop: 3 }}>PDF Import</span>}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 500 }}>{formatINR(inc.amount)}</td>
                    <td style={{ textAlign: "right", color: inc.tds_deducted > 0 ? "var(--green)" : "var(--muted)" }}>
                      {inc.tds_deducted > 0 ? formatINR(inc.tds_deducted) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>{formatINR(inc.amount - inc.tds_deducted)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-danger" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => handleDelete(inc.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
