"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useTaxData } from "@/hooks/useTaxData";

const NAV = [
  { href: "/dashboard",    icon: "▦",  label: "Dashboard" },
  { href: "/advisor",      icon: "✦",  label: "AI Advisor",    pro: true },
  { href: "/income",       icon: "↓",  label: "Income" },
  { href: "/deductions",   icon: "◈",  label: "Deductions" },
  { href: "/import",       icon: "⬆",  label: "Import" },
  { href: "/advance-tax",  icon: "◷",  label: "Advance Tax" },
  { href: "/file-itr",     icon: "⬒",  label: "File ITR" },
];

export default function Sidebar() {
  const path = usePathname();
  const { profile, signOut } = useAuth();
  const { taxHealthScore } = useTaxData();

  const scoreColor = taxHealthScore === null ? "var(--dim)" : taxHealthScore >= 75 ? "var(--green)" : taxHealthScore >= 50 ? "var(--amber)" : "var(--red)";

  return (
    <aside style={{ width: "var(--sidebar-w)", flexShrink: 0, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "28px 0", position: "sticky", top: 0, height: "100vh" }}>
      {/* Logo */}
      <div style={{ fontFamily: "var(--font-head)", fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px", padding: "0 22px 32px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--amber)" }}>tax</span><span style={{ color: "var(--text)" }}>wise</span>
        {profile?.is_pro && <span className="badge badge-pro" style={{ fontSize: 8 }}>PRO</span>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 22px", fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "var(--amber)" : "var(--muted)", textDecoration: "none", borderLeft: `2px solid ${active ? "var(--amber)" : "transparent"}`, background: active ? "rgba(240,165,0,0.05)" : "transparent", transition: "all 0.14s" }}>
              <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.pro && !profile?.is_pro && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--purple)", background: "var(--purple-dim)", padding: "1px 5px", borderRadius: 3 }}>PRO</span>}
            </Link>
          );
        })}
      </nav>

      {/* Tax health score */}
      {taxHealthScore !== null && (
        <div style={{ margin: "0 14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Tax Health Score</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 4, background: "var(--surface3)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${taxHealthScore}%`, background: scoreColor, borderRadius: 2, transition: "width 0.8s ease" }} />
            </div>
            <span style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, color: scoreColor }}>{taxHealthScore}</span>
          </div>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: "16px 22px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{profile?.full_name ?? "Your Account"}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>{profile?.pan ? `PAN: ${profile.pan}` : "PAN not set"}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="badge badge-amber" style={{ fontSize: 9 }}>FY 2024–25</span>
          <button onClick={signOut} style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}>Sign out</button>
        </div>
      </div>
    </aside>
  );
}
