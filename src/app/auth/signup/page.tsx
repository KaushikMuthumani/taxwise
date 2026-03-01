"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSignup() {
    if (!name || !email || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (authError) {
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile immediately
      await supabase.from("profiles").upsert(
        { id: data.user.id, full_name: name, onboarded: false },
        { onConflict: "id" }
      );

      if (data.session) {
        // Email confirmation OFF — AuthContext onAuthStateChange will redirect to /onboarding
        // Just leave loading = true so button shows "Creating account..."
      } else {
        // Email confirmation ON — show "check your email" screen
        setEmailSent(true);
        setLoading(false);
      }
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (emailSent) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font)" }}>
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📧</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Check your email</h1>
          <p style={{ fontSize: 14, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 24 }}>
            We sent a confirmation link to <strong>{email}</strong>.<br />
            Click it to activate your account, then sign in.
          </p>
          <Link href="/auth/login" className="btn btn-primary" style={{ textDecoration: "none", padding: "12px 32px" }}>
            Go to Sign In
          </Link>
          <p style={{ fontSize: 12, color: "var(--ink4)", marginTop: 20 }}>
            Didn&apos;t get it? Check spam, or{" "}
            <button onClick={() => setEmailSent(false)} style={{ background: "none", border: "none", color: "var(--purple)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font)" }}>
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font)" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.5px", marginBottom: 6 }}>
            tax<span style={{ color: "var(--purple)" }}>wise</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--ink4)" }}>Your Indian tax co-pilot</p>
        </div>

        <div style={{ background: "var(--white)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-md)", padding: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: "var(--ink)" }}>Create your account</h1>
          <p style={{ fontSize: 13, color: "var(--ink4)", marginBottom: 24 }}>Free for Indian freelancers and consultants</p>

          <button onClick={handleGoogle} disabled={loading} style={{
            width: "100%", padding: "11px 18px",
            background: "var(--white)", border: "1.5px solid var(--bg2)",
            borderRadius: 40, color: "var(--ink)", fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "var(--font)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            marginBottom: 20, boxShadow: "var(--shadow-xs)",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "var(--bg2)" }}/>
            <span style={{ fontSize: 12, color: "var(--ink4)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--bg2)" }}/>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--red)", borderRadius: "var(--r-sm)", color: "var(--red-text)", fontSize: 13, border: "1px solid rgba(217,55,81,0.15)" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label className="label">Full Name</label>
            <input className="input" placeholder="Arjun Mehta" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="arjun@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min. 6 characters" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSignup()} />
          </div>

          <button className="btn btn-primary" onClick={handleSignup} disabled={loading} style={{ width: "100%", padding: "12px", fontSize: 14 }}>
            {loading ? "Creating account..." : "Create Free Account"}
          </button>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--ink4)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--purple)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--ink4)" }}>
          By signing up you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
