"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; color: #e8e8f0; font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.4s ease both" }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 28, fontWeight: 700, color: "#f5a623" }}>
              tax<span style={{ color: "#e8e8f0" }}>wise</span>
            </div>
            <p style={{ fontSize: 14, color: "#6b6b80", marginTop: 8 }}>Welcome back</p>
          </div>

          {/* Card */}
          <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>

            {/* Google */}
            <button onClick={handleGoogleLogin} style={{
              width: "100%", padding: "11px 18px",
              background: "#17171f", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9, color: "#e8e8f0", fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 24, transition: "all 0.15s",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 12, color: "#6b6b80" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#ef4444", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, color: "#6b6b80", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" }}>Email</label>
              <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, color: "#6b6b80", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            </div>

            <button className="btn btn-primary" onClick={handleLogin} disabled={loading || !email || !password} style={{ width: "100%", padding: "12px", fontSize: 15 }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 14, color: "#6b6b80", marginTop: 20 }}>
            Don't have an account?{" "}
            <Link href="/auth/signup" style={{ color: "#f5a623", textDecoration: "none", fontWeight: 500 }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </>
  );
}
