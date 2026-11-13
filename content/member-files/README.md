# Member-only files (hybrid storage)

## Rule (locked)

| Kind | Where |
|---|---|
| Public page images | `public/sites/<lodge>/media/` |
| Small PDFs / summons | **Supabase Storage** private bucket `member-files` |
| Large RAR / photo packs | **Hostinger disk** `$PRIVATE_MEDIA_ROOT/<lodge>/archives/` (not in `public/`) |

Canonical disk layout + Hostinger notes: `private-media/README.md` and `private-media/MANIFEST.json`.

## Catalog seeds

| Lodge | Offline JSON | SQL |
|---|---|---|
| Freemasons Without Borders | `content/member-files/fwb.json` | `supabase/seed-member-files.sql` |
| Gallipoli (yearly WP uploads) | `content/member-files/gallipoli.json` | add rows when files are triaged |

WordPress File Manager playbook: `content/member-files/WP-MIGRATION.md`.

Offline mode (no Supabase env) reads the JSON catalog. Live mode reads `lodge_member_files`.

## Local / Hostinger folder

```
private-media/
  freemasons-without-borders/
    pdfs/FWB-Consecration-Summon.pdf
    archives/FWB_Consecration.rar
```

```bash
npm run seed:private-media
```

`.env.local`:

```
PRIVATE_MEDIA_ROOT=/absolute/path/to/private-media
```

On Hostinger, keep this **outside** the public web root.

## Supabase

1. Create private bucket `member-files` (Public OFF) — if not already done.
2. Run `supabase/member-files.sql`
3. Run `supabase/seed-member-files.sql`
4. Upload `freemasons-without-borders/pdfs/FWB-Consecration-Summon.pdf` into the bucket (same object key as `storage_path`).

## App access

- Member dashboard → **Downloads**
- `GET /api/sites/<slug>/files` (list; membership required)
- `GET /api/sites/<slug>/files/<id>/download` (membership required)

If Supabase is not configured, PDF rows still stream from disk when the placeholder/real file exists under `PRIVATE_MEDIA_ROOT` at the same relative path.
