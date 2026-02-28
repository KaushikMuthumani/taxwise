"use client";
import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { useTaxData } from "@/hooks/useTaxData";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string; id: string };

const SUGGESTIONS = [
  "How much should I invest in NPS to save tax?",
  "Should I switch to old regime?",
  "How much advance tax do I owe this quarter?",
  "Is my MacBook deductible as an expense?",
  "How can I reduce my tax before March 31?",
  "What's the best 80C investment for me?",
  "How much have I saved with 44ADA?",
  "Forecast my tax for the rest of the year",
];

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.*$)/gm, '<div style="font-family:var(--font-head);font-size:14px;font-weight:600;margin:12px 0 6px">$1</div>')
    .replace(/^## (.*$)/gm, '<div style="font-family:var(--font-head);font-size:15px;font-weight:700;margin:14px 0 8px">$1</div>')
    .replace(/^- (.*$)/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--amber);margin-top:2px">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="height:8px"></div>')
    .replace(/\n/g, '<br>');
}

export default function AdvisorPage() {
  const { profile } = useAuth();
  const { totalIncome, taxResult, taxHealthScore, loading } = useTaxData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user, profile: p } = useAuth();

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      const { data } = await supabase.from("advisor_messages").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(40);
      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({ role: m.role, content: m.content, id: m.id })));
      }
      setLoadingHistory(false);
    }
    loadHistory();
  }, [user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text?: string) {
    const msg = text ?? input.trim();
    if (!msg || sending) return;
    setInput("");
    const userMsg: Message = { role: "user", content: msg, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages.slice(-8) }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, id: (Date.now() + 1).toString() }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", id: (Date.now() + 1).toString() }]);
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const isPro = p?.is_pro;

  return (
    <AppLayout>
      <div style={{ display: "flex", height: "100vh", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "24px 36px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,var(--amber-dim),rgba(240,165,0,0.05))", border: "1px solid var(--amber-border)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
              <div>
                <h1 className="page-title" style={{ fontSize: 20 }}>AI Advisor</h1>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Your personal financial co-pilot — knows your full tax picture</p>
              </div>
            </div>
          </div>
          {!isPro && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>3 of 5 free questions used</span>
              <button className="btn btn-pro" style={{ padding: "8px 16px", fontSize: 12 }}>Upgrade to Pro ₹999/yr</button>
            </div>
          )}
        </div>

        {/* Context bar */}
        {!loading && totalIncome > 0 && (
          <div style={{ padding: "10px 36px", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, background: "var(--surface)", flexShrink: 0 }}>
            {[
              { label: "Income", value: `₹${(totalIncome / 100000).toFixed(1)}L` },
              { label: "Tax Payable", value: taxResult ? `₹${taxResult.taxPayable.toLocaleString("en-IN")}` : "—" },
              { label: "Regime", value: taxResult?.recommendedRegime === "new" ? "New ✓" : "Old ✓" },
              { label: "Health Score", value: taxHealthScore ? `${taxHealthScore}/100` : "—" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Welcome state */}
          {messages.length === 0 && !loadingHistory && (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>✦</div>
              <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                Hey {profile?.full_name?.split(" ")[0] ?? "there"} 👋
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>
                I know your full financial picture — income, deductions, advance tax, everything. Ask me anything.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 580, margin: "0 auto", textAlign: "left" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 13, color: "var(--text2)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", transition: "all 0.14s", lineHeight: 1.5 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--amber-border)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text2)"; }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column" }} className="au">
              {msg.role === "user" ? (
                <div style={{ alignSelf: "flex-end", maxWidth: "70%" }}>
                  <div className="bubble-user">{msg.content}</div>
                </div>
              ) : (
                <div style={{ alignSelf: "flex-start", maxWidth: "85%", display: "flex", gap: 10 }}>
                  <div style={{ width: 28, height: 28, background: "var(--amber-dim)", border: "1px solid var(--amber-border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, marginTop: 2 }}>✦</div>
                  <div className="bubble-ai" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, background: "var(--amber-dim)", border: "1px solid var(--amber-border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13 }}>✦</div>
              <div className="bubble-ai" style={{ display: "flex", gap: 5, alignItems: "center", padding: "14px 18px" }}>
                {[0, 1, 2].map((i) => <div key={i} style={{ width: 6, height: 6, background: "var(--amber)", borderRadius: "50%", animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 36px 20px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", transition: "border-color 0.15s" }}
            onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--amber-border)"}
            onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about your taxes, investments, or finances..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, resize: "none", lineHeight: 1.5, maxHeight: 120, minHeight: 22 }}
              rows={1}
            />
            <button onClick={() => send()} disabled={!input.trim() || sending} className="btn btn-primary" style={{ alignSelf: "flex-end", padding: "8px 16px", fontSize: 13 }}>
              {sending ? "..." : "Send"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--dim)", marginTop: 8, textAlign: "center" }}>
            Taxwise AI knows your financial data. Shift+Enter for new line. Not a substitute for professional CA advice.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
