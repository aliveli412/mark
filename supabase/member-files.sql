-- Member-only files (PDFs, archives, private galleries).
-- Small PDFs → Supabase Storage private bucket `member-files`.
-- Large archives → Hostinger disk under PRIVATE_MEDIA_ROOT (default ./private-media).
-- Safe to re-run.

create table if not exists public.lodge_member_files (
  id uuid primary key default gen_random_uuid(),
  lodge_slug text not null,
  slug text not null,
  title text not null,
  description text not null default '',
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  -- local = Hostinger/private-media disk; supabase = private Storage bucket
  storage_backend text not null default 'local'
    check (storage_backend in ('local', 'supabase')),
  -- local: relative path under PRIVATE_MEDIA_ROOT
  -- supabase: object path inside bucket `member-files`
  storage_path text not null,
  visibility text not null default 'members'
    check (visibility in ('members', 'matched', 'active')),
  sort_order integer not null default 0,
  download_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lodge_slug, slug)
);

create index if not exists lodge_member_files_lodge_idx
  on public.lodge_member_files (lodge_slug, active, sort_order);

alter table public.lodge_member_files enable row level security;

drop policy if exists "Admins manage member files" on public.lodge_member_files;
create policy "Admins manage member files" on public.lodge_member_files
  for all using (public.is_admin()) with check (public.is_admin());

-- Optional: create Storage bucket in Dashboard named `member-files` (private).
-- SQL helper (run if you use Storage API policies via SQL later):
-- insert into storage.buckets (id, name, public) values ('member-files', 'member-files', false)
-- on conflict (id) do nothing;
--
-- After this file, run supabase/seed-member-files.sql for FWB catalog rows.
-- Disk layout: private-media/README.md (Hostinger PRIVATE_MEDIA_ROOT).
