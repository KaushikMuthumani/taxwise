"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, Profile } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ user: null, session: null, profile: null, loading: true, signOut: async () => {}, refreshProfile: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setProfile(data as Profile);
  }

  async function refreshProfile() { if (user) await fetchProfile(user.id); }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session); setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() { await supabase.auth.signOut(); router.push("/auth/login"); }

  return <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
