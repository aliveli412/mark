# Private media (Hostinger / local disk)

Member-only binaries. **Never** put these under `public/` or the Hostinger `public_html` web root.

## Final layout

```
$PRIVATE_MEDIA_ROOT/                          # default: ./private-media
  MANIFEST.json                               # expected files (in git)
  freemasons-without-borders/
    pdfs/
      FWB-Consecration-Summon.pdf             # local fallback / optional Hostinger copy
    archives/
      FWB_Consecration.rar                    # REQUIRED on Hostinger (~1.5GB)
  gallipoli/{pdfs,archives}/
  namik-kemal/{pdfs,archives}/
  anadolu/{pdfs,archives}/
  ata/{pdfs,archives}/
  khalsa/{pdfs,archives}/
```

Path convention: `<lodge-slug>/<pdfs|archives>/<file-name>`  
Same relative path is used in `lodge_member_files.storage_path` and in the Supabase Storage object key for small PDFs.

## Storage split (locked)

| Kind | Backend | Where |
|---|---|---|
| Public page images | public URL | `public/sites/<lodge>/media/` |
| Small PDFs / summons | `supabase` | Private bucket `member-files` |
| Large RAR / photo packs | `local` | `$PRIVATE_MEDIA_ROOT/<lodge>/archives/` |

Access is always via membership-gated API (`/api/sites/<slug>/files/.../download`). No direct public PDF/RAR URLs.

## Local seed

```bash
npm run seed:private-media          # copy placeholders into this tree
npm run seed:private-media -- --check
```

Without Supabase keys, the download API **falls back** to disk for `storage_backend = supabase` when the same relative path exists here.

## Hostinger

Recommended (outside web root):

```
/home/<user>/domains/markmastermasons.com/
  public_html/                 # or Next.js deploy directory (web-facing)
  private-media/               # sibling — NOT web-accessible
    freemasons-without-borders/
      archives/FWB_Consecration.rar
```

`.env` / hosting env:

```
PRIVATE_MEDIA_ROOT=/home/<user>/domains/markmastermasons.com/private-media
```

Checklist:

1. Create the folder tree (or rsync from a seeded local copy).
2. Place the real `FWB_Consecration.rar` under `.../archives/`.
3. Set `PRIVATE_MEDIA_ROOT` to the absolute path.
4. Run `supabase/member-files.sql` + `supabase/seed-member-files.sql`.
5. Upload the real PDF to Supabase bucket `member-files`.
6. Sign in as a member → Downloads → verify PDF (signed URL) and RAR (stream).

## Git

Binaries under this folder are gitignored. Only `README.md`, `MANIFEST.json`, and `.gitkeep` markers are tracked.
