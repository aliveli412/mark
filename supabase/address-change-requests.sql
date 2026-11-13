-- Member address-change requests (member submits → admin approves).
-- Safe to re-run. Requires lodge_memberships + lodge_member_roster.

create table if not exists public.lodge_address_change_requests (
  id uuid primary key default gen_random_uuid(),
  lodge_slug text not null,
  membership_id uuid not null references public.lodge_memberships (id) on delete cascade,
  roster_id uuid not null references public.lodge_member_roster (id) on delete cascade,
  member_name text not null default '',
  member_email text not null default '',
  current_address text not null default '',
  current_address2 text not null default '',
  current_address3 text not null default '',
  current_city text not null default '',
  current_county text not null default '',
  current_postcode text not null default '',
  current_country text not null default '',
  requested_address text not null default '',
  requested_address2 text not null default '',
  requested_address3 text not null default '',
  requested_city text not null default '',
  requested_county text not null default '',
  requested_postcode text not null default '',
  requested_country text not null default '',
  member_note text not null default '',
  admin_note text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by text not null default '',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lodge_address_change_requests_lodge_status_idx
  on public.lodge_address_change_requests (lodge_slug, status, created_at desc);

create index if not exists lodge_address_change_requests_membership_idx
  on public.lodge_address_change_requests (membership_id, created_at desc);

alter table public.lodge_address_change_requests enable row level security;

drop policy if exists "Admins manage address change requests" on public.lodge_address_change_requests;
create policy "Admins manage address change requests" on public.lodge_address_change_requests
  for all using (public.is_admin()) with check (public.is_admin());
