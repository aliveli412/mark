-- Membership dues ledger (paid / outstanding by year).
-- Safe to re-run. Also appended into memberships.sql for new installs.

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

alter table public.lodge_membership_payments enable row level security;

drop policy if exists "Admins manage membership payments" on public.lodge_membership_payments;
create policy "Admins manage membership payments" on public.lodge_membership_payments
  for all using (public.is_admin()) with check (public.is_admin());
