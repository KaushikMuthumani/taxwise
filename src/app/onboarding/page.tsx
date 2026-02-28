"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PROFESSIONS = [
  { value: "software_developer", label: "Software Developer / Engineer", icon: "💻" },
  { value: "designer", label: "Designer / Creative", icon: "🎨" },
  { value: "consultant", label: "Consultant / Coach", icon: "💼" },
  { value: "content_creator", label: "Content Creator / YouTuber", icon: "🎥" },
  { value: "doctor", label: "Doctor / Healthcare", icon: "🏥" },
  { value: "lawyer", label: "Lawyer / Legal", icon: "⚖️" },
  { value: "architect", label: "Architect / Engineer", icon: "🏗️" },
  { value: "other", label: "Other Freelancer", icon: "🧑‍💻" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [profession, setProfession] = useState("");
  const [pan, setPan] = useState("");
  const [regime, setRegime] = useState("new");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // First try getSession immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });

    // Also listen for auth state change — catches cases where
    // session arrives slightly after component mounts (post-signup redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleFinish() {
    // Re-fetch session at click time as a fallback
    let uid = userId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id ?? null;
    }

    if (!uid) {
      setError("Session not found — please sign in again.");
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    setSaving(true);
    setError("");

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: uid,
        profession: profession || "software_developer",
        pan: pan.toUpperCase() || null,
        preferred_regime: regime,
        financial_year: "2024-25",
        onboarded: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (upsertError) {
      setError(`Error: ${upsertError.message}`);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@600;700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; color: #e8e8f0; font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .ob-input { width:100%; background:#17171f; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 14px; color:#e8e8f0; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; transition:border-color 0.15s; }
        .ob-input:focus { border-color:#f5a623; }
        .ob-btn { display:inline-flex; align-items:center; justify-content:center; border-radius:8px; font-size:14px; font-weight:500; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .ob-primary { background:#f5a623; color:#0a0a0f; font-weight:700; }
        .ob-primary:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
        .ob-primary:disabled { opacity:0.4; cursor:not-allowed; }
        .ob-ghost { background:#17171f; color:#e8e8f0; border:1px solid rgba(255,255,255,0.1); }
        .ob-ghost:hover { border-color:rgba(255,255,255,0.2); }
      `}</style>

      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"#0a0a0f" }}>
        <div style={{ width:"100%", maxWidth:560, animation:"fadeUp 0.4s ease both" }}>

          {/* Logo + steps */}
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:24, fontWeight:700, color:"#f5a623", marginBottom:20 }}>
              tax<span style={{ color:"#e8e8f0" }}>wise</span>
            </div>
            <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
              {[1,2,3].map((s) => (
                <div key={s} style={{ width:s===step?28:8, height:4, borderRadius:2, background:s===step?"#f5a623":s<step?"rgba(245,166,35,0.5)":"rgba(255,255,255,0.1)", transition:"all 0.3s" }} />
              ))}
            </div>
            <p style={{ fontSize:13, color:"#6b6b80", marginTop:10 }}>Step {step} of 3</p>
          </div>

          {error && (
            <div style={{ marginBottom:20, padding:"12px 16px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, color:"#ef4444", fontSize:13 }}>
              {error}
            </div>
          )}

          {/* Step 1: Profession */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:600, marginBottom:8, textAlign:"center" }}>What kind of work do you do?</h2>
              <p style={{ fontSize:14, color:"#6b6b80", textAlign:"center", marginBottom:28 }}>This determines which tax section applies to you</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
                {PROFESSIONS.map((p) => (
                  <button key={p.value} onClick={() => setProfession(p.value)} style={{
                    padding:"14px 16px", borderRadius:10, cursor:"pointer",
                    background: profession===p.value ? "rgba(245,166,35,0.1)" : "#111118",
                    border:`1px solid ${profession===p.value ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`,
                    color:"#e8e8f0", textAlign:"left", fontFamily:"'DM Sans',sans-serif",
                    transition:"all 0.15s", display:"flex", alignItems:"center", gap:10,
                  }}>
                    <span style={{ fontSize:20 }}>{p.icon}</span>
                    <span style={{ fontSize:13, fontWeight:profession===p.value?500:400 }}>{p.label}</span>
                  </button>
                ))}
              </div>
              <button className="ob-btn ob-primary" disabled={!profession} onClick={() => setStep(2)} style={{ width:"100%", padding:"13px" }}>
                Next →
              </button>
            </div>
          )}

          {/* Step 2: PAN */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:600, marginBottom:8, textAlign:"center" }}>What's your PAN?</h2>
              <p style={{ fontSize:14, color:"#6b6b80", textAlign:"center", marginBottom:28 }}>Used to match your TDS records. Never shared.</p>
              <div style={{ background:"#111118", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:28 }}>
                <label style={{ display:"block", fontSize:12, color:"#6b6b80", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.8px" }}>PAN Number</label>
                <input className="ob-input" placeholder="ABCDE1234F" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} style={{ fontSize:18, letterSpacing:4, fontWeight:500, textAlign:"center" }} />
                <p style={{ fontSize:12, color:"#6b6b80", marginTop:10, textAlign:"center" }}>Format: 5 letters + 4 digits + 1 letter</p>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="ob-btn ob-ghost" onClick={() => setStep(1)} style={{ flex:1, padding:"13px" }}>← Back</button>
                <button className="ob-btn ob-primary" onClick={() => setStep(3)} style={{ flex:2, padding:"13px" }}>
                  {pan ? "Next →" : "Skip for now →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Regime */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:22, fontWeight:600, marginBottom:8, textAlign:"center" }}>Which tax regime?</h2>
              <p style={{ fontSize:14, color:"#6b6b80", textAlign:"center", marginBottom:28 }}>Don't worry — we'll calculate both and recommend the better one</p>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
                {[
                  { value:"new", label:"New Regime (Default)", desc:"Lower tax rates, fewer deductions. Best for most freelancers.", recommended:true },
                  { value:"old", label:"Old Regime", desc:"Higher rates but allows 80C, HRA, and other deductions.", recommended:false },
                ].map((r) => (
                  <button key={r.value} onClick={() => setRegime(r.value)} style={{
                    padding:"18px 20px", borderRadius:12, cursor:"pointer", textAlign:"left",
                    background: regime===r.value ? "rgba(245,166,35,0.08)" : "#111118",
                    border:`1px solid ${regime===r.value ? "rgba(245,166,35,0.35)" : "rgba(255,255,255,0.08)"}`,
                    fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s", width:"100%",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:500, color:"#e8e8f0" }}>{r.label}</span>
                      {r.recommended && <span style={{ fontSize:10, background:"rgba(245,166,35,0.15)", color:"#f5a623", padding:"2px 8px", borderRadius:4, fontWeight:600 }}>RECOMMENDED</span>}
                    </div>
                    <p style={{ fontSize:13, color:"#6b6b80" }}>{r.desc}</p>
                  </button>
                ))}
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button className="ob-btn ob-ghost" onClick={() => setStep(2)} style={{ flex:1, padding:"13px" }}>← Back</button>
                <button className="ob-btn ob-primary" onClick={handleFinish} disabled={saving} style={{ flex:2, padding:"13px" }}>
                  {saving ? "Saving..." : "Go to Dashboard →"}
                </button>
              </div>

              {/* Session status indicator */}
              <div style={{ marginTop:16, textAlign:"center", fontSize:11, color: userId ? "#22c55e" : "#ef4444" }}>
                {userId ? `✓ Session ready` : "⏳ Loading session..."}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
