-- =============================================
-- TAXWISE — COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- PROFILES
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  pan text,
  profession text default 'software_developer',
  financial_year text default '2024-25',
  preferred_regime text default 'new',
  is_pro boolean default false,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- INCOME SOURCES
create table if not exists income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  financial_year text not null default '2024-25',
  type text not null,
  description text,
  client_name text,
  invoice_number text,
  amount numeric not null default 0,
  tds_deducted numeric not null default 0,
  date date not null,
  source text default 'manual',
  raw_description text,
  created_at timestamptz default now()
);
alter table income_sources enable row level security;
create policy "Users manage own income" on income_sources for all using (auth.uid() = user_id);

-- EXPENSES
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  financial_year text not null default '2024-25',
  category text not null,
  description text,
  amount numeric not null default 0,
  date date not null,
  receipt_url text,
  source text default 'manual',
  raw_description text,
  created_at timestamptz default now()
);
alter table expenses enable row level security;
create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id);

-- DEDUCTIONS
create table if not exists deductions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  financial_year text not null default '2024-25',
  section_80c numeric default 0,
  section_80d numeric default 0,
  section_80ccd numeric default 0,
  hra numeric default 0,
  home_loan_interest numeric default 0,
  other numeric default 0,
  updated_at timestamptz default now(),
  unique (user_id, financial_year)
);
alter table deductions enable row level security;
create policy "Users manage own deductions" on deductions for all using (auth.uid() = user_id);

-- ADVANCE TAX PAYMENTS
create table if not exists advance_tax_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  financial_year text not null default '2024-25',
  quarter text not null check (quarter in ('Q1','Q2','Q3','Q4')),
  amount_paid numeric not null default 0,
  paid_on date,
  challan_number text,
  created_at timestamptz default now(),
  unique (user_id, financial_year, quarter)
);
alter table advance_tax_payments enable row level security;
create policy "Users manage own advance tax" on advance_tax_payments for all using (auth.uid() = user_id);

-- ADVISOR MESSAGES (AI chat history)
create table if not exists advisor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
alter table advisor_messages enable row level security;
create policy "Users manage own messages" on advisor_messages for all using (auth.uid() = user_id);

-- PARSED STATEMENTS (PDF bank imports)
create table if not exists parsed_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  filename text,
  bank_name text,
  status text default 'pending',
  total_transactions integer default 0,
  classified_transactions integer default 0,
  created_at timestamptz default now()
);
alter table parsed_statements enable row level security;
create policy "Users manage own statements" on parsed_statements for all using (auth.uid() = user_id);

-- RAW TRANSACTIONS (from PDF parsing)
create table if not exists raw_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  statement_id uuid references parsed_statements(id) on delete cascade,
  date date,
  description text not null,
  amount numeric not null,
  type text check (type in ('credit', 'debit')),
  balance numeric,
  classification text,
  classification_confidence numeric,
  classification_reason text,
  suggested_category text,
  suggested_income_type text,
  user_confirmed boolean default false,
  linked_income_id uuid,
  linked_expense_id uuid,
  created_at timestamptz default now()
);
alter table raw_transactions enable row level security;
create policy "Users manage own transactions" on raw_transactions for all using (auth.uid() = user_id);

-- WAITLIST
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('statements', 'statements', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict do nothing;

create policy "Users upload own statements" on storage.objects for insert with check (bucket_id = 'statements' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users view own statements" on storage.objects for select using (bucket_id = 'statements' and auth.uid()::text = (storage.foldername(name))[1]);

-- INDEXES for performance
create index if not exists idx_income_user_fy on income_sources(user_id, financial_year);
create index if not exists idx_expenses_user_fy on expenses(user_id, financial_year);
create index if not exists idx_advisor_messages_user on advisor_messages(user_id, created_at);
create index if not exists idx_raw_transactions_user on raw_transactions(user_id);
