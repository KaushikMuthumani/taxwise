"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function fmtFull(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

const INCOME_TYPES = [
  { value: "freelance_indian", label: "Freelance — Indian Client" },
  { value: "freelance_foreign", label: "Freelance — Foreign Client" },
  { value: "gig", label: "Gig Work (Swiggy / Zomato)" },
  { value: "creator", label: "Creator (YouTube / Instagram)" },
  { value: "salary", label: "Salary" },
  { value: "capital_gains", label: "Capital Gains" },
  { value: "other", label: "Other" },
];

const TYPE_COLORS: Record<string, [string, string]> = {
  freelance_foreign: ["var(--purple2)", "var(--purple-bg)"],
  freelance_indian: ["var(--green-text)", "var(--green-card)"],
  gig: ["var(--amber-text)", "var(--amber)"],
  creator: ["#0891b2", "#e0f2fe"],
  salary: ["var(--ink2)", "var(--bg)"],
  capital_gains: ["#7c3aed", "#f3e8ff"],
  other: ["var(--ink3)", "var(--bg)"],
};

const EMPTY: {
  type: string; description: string; client_name: string;
  amount: string; tds_deducted: string; date: string; invoice_number: string;
} = {
  type: "freelance_indian", description: "", client_name: "",
  amount: "", tds_deducted: "", date: new Date().toISOString().split("T")[0],
  invoice_number: "",
};

export default function IncomePage() {
  const { user } = useAuth();
  const { incomes, loading, refetch, totalIncome, totalTDS } = useTaxData();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.amount || !user) return;
    setSaving(true);
    const { error } = await supabase.from("income_sources").insert({
      user_id: user.id, financial_year: "2024-25",
      type: form.type,
      description: form.description || null,
      client_name: form.client_name || null,
      invoice_number: form.invoice_number || null,
      amount: parseFloat(form.amount),
      tds_deducted: parseFloat(form.tds_deducted || "0"),
      date: form.date,
      source: "manual",
    });
    if (!error) {
      await refetch();
      setForm({ ...EMPTY });
      setShowForm(false);
    }
    setSaving(false);
  }

  function handleEdit(id: string) {
    const inc = incomes.find(i => i.id === id);
    if (!inc) return;
    setEditForm({
      type: inc.type,
      description: inc.description ?? "",
      client_name: inc.client_name ?? "",
      amount: inc.amount.toString(),
      tds_deducted: inc.tds_deducted.toString(),
      date: inc.date,
      invoice_number: inc.invoice_number ?? "",
    });
    setEditingId(id);
    setShowForm(false);
  }

  async function handleUpdate() {
    if (!editingId || !user) return;
    setSaving(true);
    const { error } = await supabase.from("income_sources").update({
      type: editForm.type,
      description: editForm.description || null,
      client_name: editForm.client_name || null,
      invoice_number: editForm.invoice_number || null,
      amount: parseFloat(editForm.amount),
      tds_deducted: parseFloat(editForm.tds_deducted || "0"),
      date: editForm.date,
    }).eq("id", editingId).eq("user_id", user.id);
    if (!error) {
      await refetch();
      setEditingId(null);
      setEditForm({ ...EMPTY });
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("income_sources").delete().eq("id", id).eq("user_id", user!.id);
    await refetch();
    setDeleting(null);
  }

  const netReceived = totalIncome - totalTDS;

  return (
    <AppLayout title="Income" subtitle={`FY 2024–25 · ${incomes.length} source${incomes.length !== 1 ? "s" : ""}`}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Income", val: fmtFull(totalIncome), sub: `${incomes.length} entries`, bg: "var(--purple-bg)", color: "var(--purple2)" },
          { label: "TDS Deducted", val: fmtFull(totalTDS), sub: "Already with Govt", bg: "var(--amber)", color: "var(--amber-text)" },
          { label: "Net Received", val: fmtFull(netReceived), sub: "In your bank account", bg: "var(--green-card)", color: "var(--green-text)" },
        ].map((s, i) => (
          <div key={i} className="au" style={{ background: s.bg, borderRadius: "var(--r-lg)", padding: "18px 20px", boxShadow: "var(--shadow-sm)", animationDelay: `${i * 60}ms` }}>
            <div style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.5px" }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>All Income Sources</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/import" className="btn btn-ghost" style={{ textDecoration: "none", fontSize: 13 }}>⬆ Import PDF</Link>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingId(null); }} style={{ fontSize: 13 }}>+ Add Income</button>
        </div>
      </div>

      {/* Edit Form */}
      {editingId && (
        <div className="card au" style={{ marginBottom: 20, border: "1.5px solid var(--amber)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Edit Income Entry</div>
            <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 14 }} onClick={() => setEditingId(null)}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Income Type</label>
              <select className="input" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Client / Source Name</label>
              <input className="input" placeholder="Acme Corp, Stripe, etc." value={editForm.client_name} onChange={e => setEditForm({ ...editForm, client_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input className="input" placeholder="Website development project" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Invoice No. (optional)</label>
              <input className="input" placeholder="INV-001" value={editForm.invoice_number} onChange={e => setEditForm({ ...editForm, invoice_number: e.target.value })} />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}>₹</span>
                <input className="input" type="number" placeholder="0" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} style={{ paddingLeft: 24 }} />
              </div>
            </div>
            <div>
              <label className="label">TDS Deducted (₹)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}>₹</span>
                <input className="input" type="number" placeholder="0" value={editForm.tds_deducted} onChange={e => setEditForm({ ...editForm, tds_deducted: e.target.value })} style={{ paddingLeft: 24 }} />
              </div>
            </div>
            <div>
              <label className="label">Date Received</label>
              <input className="input" type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleUpdate} disabled={saving || !editForm.amount}>
              {saving ? "Saving..." : "Update Entry"}
            </button>
            <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="card au" style={{ marginBottom: 20, border: "1.5px solid var(--purple3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Add Income Entry</div>
            <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 14 }} onClick={() => setShowForm(false)}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Income Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Client / Source Name</label>
              <input className="input" placeholder="Acme Corp, Stripe, etc." value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input className="input" placeholder="Website development project" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Invoice No. (optional)</label>
              <input className="input" placeholder="INV-001" value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
            </div>
            <div>
              <label className="label">Amount (₹)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}>₹</span>
                <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ paddingLeft: 24 }} />
              </div>
            </div>
            <div>
              <label className="label">TDS Deducted (₹)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink3)" }}>₹</span>
                <input className="input" type="number" placeholder="0" value={form.tds_deducted} onChange={e => setForm({ ...form, tds_deducted: e.target.value })} style={{ paddingLeft: 24 }} />
              </div>
            </div>
            <div>
              <label className="label">Date Received</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.amount}>
              {saving ? "Saving..." : "Save Entry"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Income table */}
      <div className="card au" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink4)" }}>Loading...</div>
        ) : incomes.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No income yet</div>
            <div style={{ fontSize: 13, color: "var(--ink3)", marginBottom: 20 }}>Add manually or import your bank statement</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Manually</button>
              <Link href="/import" className="btn btn-ghost" style={{ textDecoration: "none" }}>⬆ Import PDF</Link>
            </div>
          </div>
        ) : (
          <table className="tw-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Client / Source</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th style={{ textAlign: "right" }}>TDS</th>
                <th style={{ textAlign: "right" }}>Net</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(inc => {
                const [clr, bg] = TYPE_COLORS[inc.type] ?? ["var(--ink3)", "var(--bg)"];
                return (
                  <tr key={inc.id}>
                    <td style={{ color: "var(--ink4)", fontSize: 12, whiteSpace: "nowrap" }}>{inc.date}</td>
                    <td>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: bg, color: clr, whiteSpace: "nowrap" }}>
                        {inc.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{inc.client_name ?? "—"}</div>
                      {inc.description && <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 1 }}>{inc.description}</div>}
                      {inc.source === "pdf_import" && (
                        <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 10, background: "var(--bg2)", color: "var(--ink4)" }}>PDF Import</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--green-text)", fontSize: 13 }}>{fmtFull(inc.amount)}</td>
                    <td style={{ textAlign: "right", color: inc.tds_deducted > 0 ? "var(--amber-text)" : "var(--ink4)", fontSize: 13 }}>
                      {inc.tds_deducted > 0 ? fmtFull(inc.tds_deducted) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontSize: 13 }}>{fmtFull(inc.amount - inc.tds_deducted)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleEdit(inc.id)}
                          title="Edit"
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--ink4)", padding: "4px 7px", borderRadius: "var(--r-xs)", transition: "color 0.14s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--purple2)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ink4)"}
                        >✎</button>
                        <button
                          onClick={() => handleDelete(inc.id)}
                          disabled={deleting === inc.id}
                          title="Delete"
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ink4)", padding: "4px 7px", borderRadius: "var(--r-xs)", transition: "color 0.14s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--red-text)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--ink4)"}
                        >
                          {deleting === inc.id ? "…" : "×"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppLayout>
  );
}
