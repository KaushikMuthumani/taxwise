"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!loading && !user) router.push("/auth/login"); }, [user, loading, router]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 22, color: "var(--amber)", marginBottom: 20 }}>taxwise</div>
        <div style={{ width: 28, height: 28, border: "2px solid var(--border)", borderTopColor: "var(--amber)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "auto", minHeight: "100vh", background: "var(--bg)" }}>
        {children}
      </main>
    </div>
  );
}
