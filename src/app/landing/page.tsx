"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WAITLIST_COUNT, ITR_FORMS } from "@/lib/demoData";

const FEATURES = [
  { icon: "🤖", title: "AI reads your bank statement", desc: "Upload any PDF — AI classifies every transaction in seconds. No manual entry.", tag: "Unique" },
  { icon: "📊", title: "All 4 ITR forms covered", desc: "ITR-1, 2, 3, 4. Salaried to freelancer to investor. One tool.", tag: "Complete" },
  { icon: "⚡", title: "44ADA auto-applied", desc: "Freelancers automatically get presumptive taxation — pay tax on 50% of income.", tag: "Saves ₹₹" },
  { icon: "📅", title: "Year-round tax tracking", desc: "Not just April filing. Know your tax liability every month.", tag: "Proactive" },
  { icon: "🏦", title: "AIS / 26AS import", desc: "Import your Annual Information Statement directly. Pre-filled ITR in minutes.", tag: "New" },
  { icon: "💡", title: "Save before March 31 nudges", desc: "AI tells you exactly what to invest to reduce your tax bill before year end.", tag: "Smart" },
];

const COMPARE = [
  { feature: "AI bank statement import", us: true, them: false },
  { feature: "Year-round tax tracking", us: true, them: false },
  { feature: "44ADA auto-detection", us: true, them: false },
  { feature: "AIS / 26AS import", us: true, them: true },
  { feature: "All ITR forms (1–4)", us: true, them: true },
  { feature: "Tax saving nudges", us: true, them: false },
  { feature: "Built for freelancers", us: true, them: false },
  { feature: "Free to start", us: true, them: true },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "UX Designer, Bangalore", text: "Finally a tool that understands freelancers. Imported 11 months of HDFC statements in one go.", avatar: "PS" },
  { name: "Karan M.", role: "Full-stack Dev, Pune", text: "44ADA saved me ₹80,000 last year. I had no idea I was eligible until Taxwise told me.", avatar: "KM" },
  { name: "Ananya R.", role: "Content Creator, Mumbai", text: "ClearTax made me feel like a CA. Taxwise feels like WhatsApp — just works.", avatar: "AR" },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(WAITLIST_COUNT);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    } catch {}
    setCount((c) => c + 1);
    setSubmitted(true);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; color: #f0f0fa; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        a { color: inherit; text-decoration: none; }

        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 48px; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s; }
        .nav.scrolled { background: rgba(8,8,16,0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 14px 48px; }
        .logo { font-family: 'Syne',sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .logo span { color: #f0a500; }

        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 80px; position: relative; overflow: hidden; }
        .hero-glow { position: absolute; top: 20%; left: 50%; transform: translateX(-50%); width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(240,165,0,0.08) 0%, transparent 70%); pointer-events: none; }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent); }

        .pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(240,165,0,0.1); border: 1px solid rgba(240,165,0,0.2); border-radius: 100px; font-size: 12px; font-weight: 500; color: #f0a500; margin-bottom: 28px; animation: fadeUp 0.4s ease both; }
        .pill-dot { width: 6px; height: 6px; background: #f0a500; border-radius: 50%; animation: pulse 2s ease infinite; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes spin { to { transform: rotate(360deg); } }

        .hero h1 { font-family: 'Syne',sans-serif; font-size: clamp(42px,6vw,76px); font-weight: 800; letter-spacing: -2px; line-height: 1.05; margin-bottom: 24px; animation: fadeUp 0.5s 0.1s ease both; }
        .hero h1 .gold { color: #f0a500; }
        .hero h1 .dim { color: #3a3a55; }
        .hero p { font-size: clamp(16px,2vw,20px); color: #8888aa; max-width: 560px; line-height: 1.7; margin: 0 auto 40px; font-weight: 300; animation: fadeUp 0.5s 0.2s ease both; }

        .waitlist-form { display: flex; gap: 10px; animation: fadeUp 0.5s 0.3s ease both; }
        .waitlist-input { width: 300px; padding: 13px 18px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #f0f0fa; font-family:'DM Sans',sans-serif; font-size: 15px; outline: none; transition: all 0.15s; }
        .waitlist-input:focus { border-color: #f0a500; background: rgba(240,165,0,0.04); }
        .waitlist-btn { padding: 13px 24px; background: #f0a500; color: #080810; font-family:'DM Sans',sans-serif; font-size: 15px; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
        .waitlist-btn:hover { background: #ffb820; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(240,165,0,0.3); }

        .count { margin-top: 16px; font-size: 13px; color: #6b6b90; animation: fadeUp 0.5s 0.4s ease both; }
        .count strong { color: #f0a500; }

        .demo-btn { margin-top: 32px; display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #c0c0d8; font-size: 14px; background: rgba(255,255,255,0.03); transition: all 0.15s; animation: fadeUp 0.5s 0.5s ease both; }
        .demo-btn:hover { border-color: rgba(255,255,255,0.2); color: #f0f0fa; background: rgba(255,255,255,0.06); }

        .section { padding: 100px 48px; max-width: 1140px; margin: 0 auto; }
        .section-label { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #f0a500; margin-bottom: 16px; }
        .section-title { font-family: 'Syne',sans-serif; font-size: clamp(28px,4vw,44px); font-weight: 700; letter-spacing: -1px; line-height: 1.15; margin-bottom: 16px; }
        .section-sub { font-size: 17px; color: #8888aa; font-weight: 300; max-width: 500px; line-height: 1.7; }

        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 56px; }
        .feature-card { background: #111120; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 28px; transition: all 0.2s; }
        .feature-card:hover { border-color: rgba(240,165,0,0.2); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
        .feature-icon { font-size: 28px; margin-bottom: 16px; display: block; }
        .feature-tag { display: inline-block; padding: 2px 8px; background: rgba(240,165,0,0.1); border: 1px solid rgba(240,165,0,0.2); border-radius: 4px; font-size: 10px; font-weight: 700; color: #f0a500; letter-spacing: 0.5px; margin-bottom: 12px; }
        .feature-title { font-family:'Syne',sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: #8888aa; line-height: 1.6; }

        .itr-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 56px; }
        .itr-card { background: #111120; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; transition: all 0.2s; cursor: default; }
        .itr-card.highlighted { border-color: rgba(240,165,0,0.3); background: rgba(240,165,0,0.04); }
        .itr-card:hover { transform: translateY(-2px); }
        .itr-icon { font-size: 28px; margin-bottom: 14px; }
        .itr-form-name { font-family:'Syne',sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 4px; }
        .itr-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
        .itr-desc { font-size: 12px; color: #8888aa; line-height: 1.6; margin-bottom: 16px; }
        .itr-who { display: flex; flex-direction: column; gap: 4px; }
        .itr-who-item { font-size: 11px; color: #6b6b90; display: flex; align-items: center; gap: 6px; }
        .itr-who-item::before { content:'✓'; color: #00d97e; font-size: 10px; }

        .compare-table { margin-top: 56px; background: #111120; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; overflow: hidden; }
        .compare-header { display: grid; grid-template-columns: 1fr 140px 140px; padding: 20px 28px; background: #181828; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .compare-header-cell { font-size: 13px; font-weight: 600; text-align: center; }
        .compare-header-cell.us { color: #f0a500; }
        .compare-row { display: grid; grid-template-columns: 1fr 140px 140px; padding: 16px 28px; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; }
        .compare-row:last-child { border-bottom: none; }
        .compare-check { text-align: center; font-size: 16px; }

        .testimonials { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px; }
        .testimonial { background: #111120; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; }
        .testimonial-text { font-size: 14px; color: #c0c0d8; line-height: 1.7; margin-bottom: 20px; font-style: italic; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar { width: 36px; height: 36px; background: rgba(240,165,0,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #f0a500; flex-shrink: 0; }
        .testimonial-name { font-size: 13px; font-weight: 600; }
        .testimonial-role { font-size: 11px; color: #6b6b90; }

        .cta-section { padding: 100px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; height: 300px; background: radial-gradient(ellipse, rgba(240,165,0,0.06) 0%, transparent 70%); pointer-events: none; }

        .footer { padding: 32px 48px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; max-width: 1140px; margin: 0 auto; }
        .footer-logo { font-family:'Syne',sans-serif; font-size: 18px; font-weight: 700; }
        .footer-links { display: flex; gap: 28px; font-size: 13px; color: #6b6b90; }

        @media (max-width: 900px) {
          .features-grid { grid-template-columns: 1fr 1fr; }
          .itr-grid { grid-template-columns: 1fr 1fr; }
          .compare-header, .compare-row { grid-template-columns: 1fr 100px 100px; }
          .testimonials { grid-template-columns: 1fr; }
          .section { padding: 60px 24px; }
          .nav { padding: 16px 24px; }
          .waitlist-form { flex-direction: column; }
          .waitlist-input { width: 100%; }
          .footer { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* Nav */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="logo"><span>tax</span>wise</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/demo" style={{ fontSize: 13, color: "#8888aa", padding: "8px 16px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, transition: "all 0.15s" }}>
            View Demo
          </Link>
          <Link href="/auth/login" style={{ fontSize: 13, fontWeight: 600, color: "#080810", background: "#f0a500", padding: "8px 18px", borderRadius: 8 }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid" />

        <div className="pill">
          <span className="pill-dot" />
          <strong>{count.toLocaleString()}</strong>&nbsp;freelancers on waitlist
        </div>

        <h1>
          Tax filing that actually<br />
          <span className="gold">understands freelancers</span><br />
          <span className="dim">not just salaried employees</span>
        </h1>

        <p>
          Upload your bank statement. AI classifies every transaction.
          Your ITR is ready in minutes — not days.
        </p>

        {!submitted ? (
          <form className="waitlist-form" onSubmit={handleWaitlist}>
            <input className="waitlist-input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="waitlist-btn" type="submit">Get Early Access</button>
          </form>
        ) : (
          <div style={{ padding: "14px 28px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.2)", borderRadius: 12, color: "#00d97e", fontSize: 14, fontWeight: 500 }}>
            ✓ You're on the list! We'll reach out soon.
          </div>
        )}

        <p className="count">Join <strong>{count.toLocaleString()}</strong> freelancers already waiting · Free forever for early users</p>

        <Link href="/demo" className="demo-btn">
          <span>▶</span> See live demo — no signup needed
        </Link>
      </section>

      {/* ITR Forms */}
      <section className="section">
        <p className="section-label">Who it's for</p>
        <h2 className="section-title">Every ITR form.<br />One intelligent tool.</h2>
        <p className="section-sub">Whether you're salaried, a freelancer, investor, or business owner — Taxwise handles your exact form.</p>
        <div className="itr-grid">
          {ITR_FORMS.map((f) => (
            <div key={f.form} className={`itr-card ${f.highlighted ? "highlighted" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span className="itr-icon">{f.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: f.highlighted ? "rgba(240,165,0,0.15)" : "rgba(255,255,255,0.06)", color: f.highlighted ? "#f0a500" : "#6b6b90" }}>{f.badge}</span>
              </div>
              <div className="itr-form-name" style={{ color: f.color }}>{f.form}</div>
              <div className="itr-title">{f.title}</div>
              <div className="itr-desc">{f.desc}</div>
              <div className="itr-who">
                {f.who.map((w) => <div key={w} className="itr-who-item">{w}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section" style={{ paddingTop: 0 }}>
        <p className="section-label">Features</p>
        <h2 className="section-title">Built different.<br />Not just another ITR tool.</h2>
        <p className="section-sub">ClearTax built for CAs. We built for you.</p>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <span className="feature-tag">{f.tag}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Compare */}
      <section className="section" style={{ paddingTop: 0 }}>
        <p className="section-label">Comparison</p>
        <h2 className="section-title">Taxwise vs ClearTax</h2>
        <p className="section-sub">We're not trying to replace ClearTax for everyone. We're replacing it for the 9 crore freelancers they ignored.</p>
        <div className="compare-table">
          <div className="compare-header">
            <div style={{ fontSize: 12, color: "#6b6b90" }}>Feature</div>
            <div className="compare-header-cell us">Taxwise</div>
            <div className="compare-header-cell" style={{ color: "#6b6b90" }}>ClearTax</div>
          </div>
          {COMPARE.map((row) => (
            <div key={row.feature} className="compare-row">
              <div style={{ fontSize: 13, color: "#c0c0d8" }}>{row.feature}</div>
              <div className="compare-check">{row.us ? "✅" : "❌"}</div>
              <div className="compare-check">{row.them ? "✅" : "❌"}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="section" style={{ paddingTop: 0 }}>
        <p className="section-label">Early users</p>
        <h2 className="section-title">What people are saying</h2>
        <div className="testimonials">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testimonial">
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="pill" style={{ margin: "0 auto 28px" }}>
          <span className="pill-dot" />
          Free forever for early users
        </div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(32px,5vw,56px)", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 20, lineHeight: 1.1 }}>
          Stop overpaying.<br /><span style={{ color: "#f0a500" }}>Start in 2 minutes.</span>
        </h2>
        <p style={{ fontSize: 17, color: "#8888aa", marginBottom: 36, fontWeight: 300 }}>No CA needed. No jargon. Just your taxes, done right.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/signup" style={{ padding: "14px 28px", background: "#f0a500", color: "#080810", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15, borderRadius: 10, transition: "all 0.15s" }}>
            Create Free Account →
          </Link>
          <Link href="/demo" style={{ padding: "14px 28px", background: "rgba(255,255,255,0.04)", color: "#c0c0d8", fontFamily: "'DM Sans',sans-serif", fontSize: 15, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s" }}>
            View Live Demo
          </Link>
        </div>
      </section>

      {/* Footer */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 48px" }}>
        <div className="footer">
          <div className="footer-logo"><span style={{ color: "#f0a500" }}>tax</span>wise</div>
          <div className="footer-links">
            <span>For Freelancers</span>
            <span>Privacy Policy</span>
            <span>Contact</span>
          </div>
          <div style={{ fontSize: 12, color: "#6b6b90" }}>© 2025 Taxwise. Made in India 🇮🇳</div>
        </div>
      </div>
    </>
  );
}
