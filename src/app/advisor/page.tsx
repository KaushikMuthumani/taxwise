"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string; id: string };

const SUGGESTIONS = [
  "How much should I invest in NPS to save max tax?",
  "Should I switch to old regime?",
  "How much advance tax do I owe this quarter?",
  "How can I reduce my tax before March 31?",
  "Is my MacBook deductible as an expense?",
  "Forecast my year-end tax liability",
];

function renderMD(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/^- (.*$)/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:var(--purple)">•</span><span>$1</span></div>').replace(/\n\n/g, '<div style="height:6px"></div>').replace(/\n/g, "<br>");
}

export default function AdvisorPage() {
  const { user, profile } = useAuth();
  const { totalIncome, taxResult, taxHealthScore, incomes } = useTaxData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase.from("advisor_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(40);
      if (data && data.length > 0) setMessages(data.map((m: any) => ({ role: m.role, content: m.content, id: m.id })));
      setLoadingHistory(false);
    }
    load();
  }, [user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg, id: Date.now().toString() }]);
    setSending(true);
    try {
      const res = await fetch("/api/advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, history: messages.slice(-8) }) });
      const data = await res.json();
      if (data.reply) setMessages(prev => [...prev, { role: "assistant", content: data.reply, id: (Date.now() + 1).toString() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", id: (Date.now() + 1).toString() }]);
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const isPro = profile?.is_pro;

  return (
    <AppLayout title="AI Advisor" subtitle="Your personal financial co-pilot — knows your full tax picture">
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>

        {/* Context bar */}
        {totalIncome > 0 && (
          <div className="au" style={{ display: "flex", gap: 20, padding: "12px 20px", background: "var(--purple-bg2)", borderRadius: "var(--r-lg)", marginBottom: 16, flexWrap: "wrap", border: "1px solid var(--purple-bg)" }}>
            {[
              { label: "Income", val: `₹${(totalIncome / 100000).toFixed(1)}L` },
              { label: "Tax Payable", val: taxResult ? `₹${taxResult.taxPayable.toLocaleString("en-IN")}` : "—" },
              { label: "Regime", val: taxResult?.recommendedRegime === "new" ? "New ✓" : "Old ✓" },
              ...(taxResult?.is44ADAEligible ? [{ label: "44ADA", val: "Active ✓" }] : []),
              { label: "Health Score", val: taxHealthScore ? `${taxHealthScore}/100` : "—" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, color: "var(--ink4)" }}>{s.label}:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--purple2)" }}>{s.val}</span>
              </div>
            ))}
            {!isPro && (
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "var(--ink4)" }}>3 of 5 free questions used</span>
                <button className="btn btn-primary" style={{ fontSize: 11, padding: "5px 14px" }}>Upgrade Pro ₹999/yr</button>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 16, paddingRight: 4 }}>

          {/* Welcome */}
          {messages.length === 0 && !loadingHistory && (
            <div className="ac" style={{ textAlign: "center", paddingTop: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: "var(--r-xl)", background: "var(--purple-bg)", border: "1px solid var(--purple-bg2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 18px" }}>✦</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Hey {profile?.full_name?.split(" ")[0] ?? "there"} 👋</h2>
              <p style={{ fontSize: 14, color: "var(--ink3)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7 }}>
                I know your full financial picture — income, deductions, advance tax, everything. Ask me anything.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 560, margin: "0 auto", textAlign: "left" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} style={{ padding: "12px 16px", background: "var(--white)", border: "1.5px solid var(--bg2)", borderRadius: "var(--r)", fontSize: 13, color: "var(--ink2)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font)", transition: "all 0.14s", lineHeight: 1.5, boxShadow: "var(--shadow-xs)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--purple3)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--bg2)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)"; }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map(msg => (
            <div key={msg.id} className="asi" style={{ display: "flex", flexDirection: "column" }}>
              {msg.role === "user" ? (
                <div style={{ alignSelf: "flex-end", maxWidth: "70%" }}>
                  <div className="bubble-user">{msg.content}</div>
                </div>
              ) : (
                <div style={{ alignSelf: "flex-start", maxWidth: "82%", display: "flex", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--purple-bg)", border: "1px solid var(--purple-bg2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, marginTop: 2, color: "var(--purple2)" }}>✦</div>
                  <div className="bubble-ai" dangerouslySetInnerHTML={{ __html: renderMD(msg.content) }} />
                </div>
              )}
            </div>
          ))}

          {/* Typing */}
          {sending && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--purple-bg)", border: "1px solid var(--purple-bg2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, color: "var(--purple2)" }}>✦</div>
              <div className="bubble-ai" style={{ display: "flex", gap: 4, alignItems: "center", padding: "14px 18px" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, background: "var(--purple3)", borderRadius: "50%", animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 10, background: "var(--white)", border: "1.5px solid var(--bg2)", borderRadius: "var(--r-xl)", padding: "10px 14px", boxShadow: "var(--shadow-sm)", transition: "border-color 0.15s" }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--purple)"}
            onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--bg2)"}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about your taxes, investments, or finances..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--ink)", fontFamily: "var(--font)", fontSize: 14, resize: "none", lineHeight: 1.5, maxHeight: 100, minHeight: 22 }}
              rows={1}
            />
            <button onClick={() => send()} disabled={!input.trim() || sending} className="btn btn-primary" style={{ alignSelf: "flex-end", padding: "7px 18px", fontSize: 13 }}>
              {sending ? "..." : "Send"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--ink4)", marginTop: 7, textAlign: "center" }}>
            Shift+Enter for new line · Not a substitute for professional CA advice
          </p>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </AppLayout>
  );
}
