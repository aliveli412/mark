-- Lodge membership: roster, applications, plans and Stripe subscriptions.
-- Safe to re-run.

create table if not exists public.lodge_membership_settings (
  lodge_slug text primary key,
  monthly_pence integer not null default 1500 check (monthly_pence >= 0),
  yearly_pence integer not null default 15000 check (yearly_pence >= 0),
  standing_order_pence integer not null default 1500 check (standing_order_pence >= 0),
  currency text not null default 'gbp',
  bank_name text not null default '',
  bank_account_name text not null default '',
  bank_sort_code text not null default '',
  bank_account_number text not null default '',
  bank_reference_hint text not null default '',
  is_pilot boolean not null default false,
  roster_source text not null default '',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_member_roster (
  id uuid primary key default gen_random_uuid(),
  lodge_slug text not null,
  full_name text not null,
  email text not null default '',
  membership_no text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade path: older installs created the table without Excel fields.
-- CREATE TABLE IF NOT EXISTS will not add columns, so alter explicitly.
alter table public.lodge_membership_settings
  add column if not exists is_pilot boolean not null default false,
  add column if not exists roster_source text not null default '';

alter table public.lodge_member_roster
  add column if not exists brother_no text not null default '',
  add column if not exists surname text not null default '',
  add column if not exists given_names text not null default '',
  add column if not exists prefix text not null default '',
  add column if not exists initials text not null default '',
  add column if not exists title text not null default '',
  add column if not exists suffix text not null default '',
  add column if not exists home_phone text not null default '',
  add column if not exists mobile text not null default '',
  add column if not exists postcode text not null default '',
  add column if not exists address text not null default '',
  add column if not exists address2 text not null default '',
  add column if not exists address3 text not null default '',
  add column if not exists city text not null default '',
  add column if not exists county text not null default '',
  add column if not exists country text not null default '',
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists grand_rank text not null default '',
  add column if not exists prov_rank text not null default '',
  add column if not exists unit_rank text not null default '',
  add column if not exists grand_rank_id text not null default '',
  add column if not exists prov_rank_id text not null default '',
  add column if not exists unit_rank_id text not null default '',
  add column if not exists unit_rank_start date,
  add column if not exists prov_rank_start date,
  add column if not exists grand_rank_start date,
  add column if not exists unit_prefix text not null default '',
  add column if not exists prov_prefix text not null default '',
  add column if not exists grand_prefix text not null default '',
  add column if not exists activity text not null default '';

-- Ensure email has a default for inserts that omit it.
alter table public.lodge_member_roster
  alter column email set default '';

drop index if exists lodge_member_roster_slug_email_idx;
create unique index if not exists lodge_member_roster_slug_brother_idx
  on public.lodge_member_roster (lodge_slug, brother_no)
  where brother_no <> '';
create index if not exists lodge_member_roster_slug_email_idx
  on public.lodge_member_roster (lodge_slug, lower(email));
create index if not exists lodge_member_roster_slug_idx
  on public.lodge_member_roster (lodge_slug);

create table if not exists public.lodge_memberships (
  id uuid primary key default gen_random_uuid(),
  lodge_slug text not null,
  roster_id uuid references public.lodge_member_roster (id) on delete set null,
  full_name text not null,
  email text not null,
  membership_no text not null default '',
  status text not null default 'pending_match'
    check (status in ('pending_match', 'matched', 'active', 'past_due', 'cancelled')),
  plan text
    check (plan is null or plan in ('monthly', 'yearly', 'standing_order')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_session_id text,
  access_code text not null default encode(gen_random_bytes(6), 'hex'),
  matched_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lodge_memberships_slug_email_idx
  on public.lodge_memberships (lodge_slug, lower(email));
create index if not exists lodge_memberships_slug_status_idx
  on public.lodge_memberships (lodge_slug, status);
create index if not exists lodge_memberships_access_code_idx
  on public.lodge_memberships (access_code);

create table if not exists public.lodge_membership_payments (
  id uuid primary key default gen_random_uuid(),
  lodge_slug text not null,
  membership_id uuid references public.lodge_memberships (id) on delete cascade,
  roster_id uuid references public.lodge_member_roster (id) on delete set null,
  year integer not null check (year >= 1990 and year <= 2100),
  amount_pence integer not null check (amount_pence >= 0),
  method text not null default 'admin'
    check (method in ('stripe', 'bank', 'cash', 'standing_order', 'admin', 'other')),
  status text not null default 'paid'
    check (status in ('paid', 'partial', 'due', 'waived')),
  paid_on date,
  note text not null default '',
  recorded_by text not null default '',
  stripe_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lodge_membership_payments_membership_idx
  on public.lodge_membership_payments (membership_id, year);
create index if not exists lodge_membership_payments_lodge_idx
  on public.lodge_membership_payments (lodge_slug, year);

alter table public.lodge_membership_settings enable row level security;
alter table public.lodge_member_roster enable row level security;
alter table public.lodge_memberships enable row level security;
alter table public.lodge_membership_payments enable row level security;

drop policy if exists "Public read active membership settings" on public.lodge_membership_settings;
create policy "Public read active membership settings" on public.lodge_membership_settings
  for select using (active = true or public.is_admin());

drop policy if exists "Admins manage membership settings" on public.lodge_membership_settings;
create policy "Admins manage membership settings" on public.lodge_membership_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage member roster" on public.lodge_member_roster;
create policy "Admins manage member roster" on public.lodge_member_roster
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage lodge memberships" on public.lodge_memberships;
create policy "Admins manage lodge memberships" on public.lodge_memberships
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage membership payments" on public.lodge_membership_payments;
create policy "Admins manage membership payments" on public.lodge_membership_payments
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed default plans for known Mark Sites (safe upsert).
insert into public.lodge_membership_settings (
  lodge_slug, monthly_pence, yearly_pence, standing_order_pence, is_pilot, roster_source
)
values
  ('gallipoli', 1500, 15000, 1500, false, ''),
  ('namik-kemal', 1500, 15000, 1500, false, ''),
  ('anadolu', 1500, 15000, 1500, false, ''),
  ('freemasons-without-borders', 1500, 15000, 1500, true, 'As of 06-06-2022.xlsx'),
  ('ata', 1500, 15000, 1500, false, ''),
  ('khalsa', 1500, 15000, 1500, false, ''),
  ('mark-enterprise', 1500, 15000, 1500, false, ''),
  ('phoenix', 1500, 15000, 1500, false, ''),
  ('roentgen', 1500, 15000, 1500, false, '')
on conflict (lodge_slug) do nothing;
