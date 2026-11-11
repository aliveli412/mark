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
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_member_roster (
  id uuid primary key default gen_random_uuid(),
  lodge_slug text not null,
  full_name text not null,
  email text not null,
  membership_no text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lodge_member_roster_slug_email_idx
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

alter table public.lodge_membership_settings enable row level security;
alter table public.lodge_member_roster enable row level security;
alter table public.lodge_memberships enable row level security;

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

-- Seed default plans for known Mark Sites (safe upsert).
insert into public.lodge_membership_settings (lodge_slug, monthly_pence, yearly_pence, standing_order_pence)
values
  ('gallipoli', 1500, 15000, 1500),
  ('namik-kemal', 1500, 15000, 1500),
  ('anadolu', 1500, 15000, 1500),
  ('freemasons-without-borders', 1500, 15000, 1500),
  ('ata', 1500, 15000, 1500),
  ('khalsa', 1500, 15000, 1500),
  ('mark-enterprise', 1500, 15000, 1500),
  ('phoenix', 1500, 15000, 1500),
  ('roentgen', 1500, 15000, 1500)
on conflict (lodge_slug) do nothing;
