// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

/* ================================
   ENV VALIDATION
================================ */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/* ================================
   CLIENT (BROWSER SAFE)
================================ */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage:
      typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

/* ================================
   ADMIN (SERVER ONLY)
================================ */
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

/* ================================
   TYPES
================================ */

export type Profile = {
  id: string;
  full_name: string | null;
  pan: string | null;
  profession: string;
  financial_year: string;
  preferred_regime: "new" | "old";
  onboarded: boolean;
  is_pro: boolean;
  created_at: string;
};

export type IncomeSource = {
  id: string;
  user_id: string;
  financial_year: string;
  type: string;
  description: string | null;
  amount: number;
  tds_deducted: number;
  date: string;
  client_name: string | null;
  invoice_number: string | null;
  source: string;
  raw_description: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  financial_year: string;
  category: string;
  description: string | null;
  amount: number;
  date: string;
  receipt_url: string | null;
  source: string;
  raw_description: string | null;
  created_at: string;
};

export type Deduction = {
  id: string;
  user_id: string;
  financial_year: string;
  section_80c: number;
  section_80d: number;
  section_80ccd: number;
  hra: number;
  home_loan_interest: number;
  other: number;
  updated_at: string;
};

export type AdvanceTaxPayment = {
  id: string;
  user_id: string;
  financial_year: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  amount_paid: number;
  paid_on: string | null;
  challan_number: string | null;
};

export type AdvisorMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type RawTransaction = {
  id: string;
  user_id: string;
  statement_id: string;
  date: string | null;
  description: string;
  amount: number;
  type: "credit" | "debit";
  balance: number | null;
  classification: string | null;
  classification_confidence: number | null;
  classification_reason: string | null;
  suggested_category: string | null;
  suggested_income_type: string | null;
  user_confirmed: boolean;
  created_at: string;
};