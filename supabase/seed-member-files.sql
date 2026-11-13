-- Seed FWB member-file catalog rows (metadata only — binaries live in Storage / Hostinger).
-- Prerequisites:
--   1. supabase/member-files.sql
--   2. Private Storage bucket `member-files` (Public OFF)
--   3. Upload PDF object: freemasons-without-borders/pdfs/FWB-Consecration-Summon.pdf
--   4. Place archive on Hostinger: $PRIVATE_MEDIA_ROOT/freemasons-without-borders/archives/FWB_Consecration.zip
-- Prefer supabase/seed-member-files-all.sql after a full WP migrate (all lodges).
-- Safe to re-run (upsert on lodge_slug + slug).

insert into public.lodge_member_files (
  lodge_slug,
  slug,
  title,
  description,
  file_name,
  mime_type,
  size_bytes,
  storage_backend,
  storage_path,
  visibility,
  sort_order,
  active
) values
  (
    'freemasons-without-borders',
    'consecration-summon',
    'Consecration Summon',
    'Member-only PDF previously behind WordPress download login.',
    'FWB-Consecration-Summon.pdf',
    'application/pdf',
    2243952,
    'supabase',
    'freemasons-without-borders/pdfs/FWB-Consecration-Summon.pdf',
    'members',
    10,
    true
  ),
  (
    'freemasons-without-borders',
    'consecration-photos-archive',
    'Consecration photos archive',
    'Large photo pack (~1.3GB zip of filtered WP originals). Keep on Hostinger private disk, not Supabase.',
    'FWB_Consecration.zip',
    'application/zip',
    1319014834,
    'local',
    'freemasons-without-borders/archives/FWB_Consecration.zip',
    'members',
    20,
    true
  )
on conflict (lodge_slug, slug) do update set
  title = excluded.title,
  description = excluded.description,
  file_name = excluded.file_name,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  storage_backend = excluded.storage_backend,
  storage_path = excluded.storage_path,
  visibility = excluded.visibility,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();
