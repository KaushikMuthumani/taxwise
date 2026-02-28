"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    if (!email || !password || !name) return;
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/onboarding");
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

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 28, fontWeight: 700, color: "#f5a623" }}>
              tax<span style={{ color: "#e8e8f0" }}>wise</span>
            </div>
            <p style={{ fontSize: 14, color: "#6b6b80", marginTop: 8 }}>Create your free account</p>
          </div>

          <div style={{ background: "#111118", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#ef4444", marginBottom: 16 }}>
                {error}
              </div>
            )}

            {[
              { label: "Full Name", value: name, set: setName, type: "text", placeholder: "Arjun Mehta" },
              { label: "Email", value: email, set: setEmail, type: "email", placeholder: "you@email.com" },
              { label: "Password", value: password, set: setPassword, type: "password", placeholder: "Min 6 characters" },
            ].map((f) => (
              <div key={f.label} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6b6b80", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" }}>{f.label}</label>
                <input className="input" type={f.type} placeholder={f.placeholder} value={f.value} onChange={(e) => f.set(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSignup()} />
              </div>
            ))}

            <button className="btn btn-primary" onClick={handleSignup} disabled={loading || !email || !password || !name} style={{ width: "100%", padding: "12px", fontSize: 15, marginTop: 8 }}>
              {loading ? "Creating account..." : "Create Free Account"}
            </button>

            <p style={{ fontSize: 12, color: "#6b6b80", marginTop: 14, textAlign: "center" }}>
              By signing up you agree to our Terms and Privacy Policy.
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: 14, color: "#6b6b80", marginTop: 20 }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#f5a623", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
