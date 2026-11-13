# WordPress uploads → new site (all Mark lodges)

SSH playbook for: `gallipoli`, `namik-kemal`, `anadolu`, `freemasons-without-borders`, `ata`, `khalsa`.

## Locked storage split

| WP’de ne? | Yeni site | Nereye |
|---|---|---|
| Sayfa görseli, banner, public galeri | Public | `public/sites/<lodge>/media/` |
| Üye PDF (summon, minutes, circular) | Private Supabase | bucket `member-files` → `<lodge>/pdfs/<year>/...` |
| Büyük foto arşivi / ZIP / RAR | Private Hostinger | `$PRIVATE_MEDIA_ROOT/<lodge>/archives/<year>/...` |

Üye dosyaları **asla** `public/` veya `public_html` altına konmaz.

Live Hostinger root (sibling of `public_html`):

```
PRIVATE_MEDIA_ROOT=/home/u557964768/domains/markmastermasons.com/private-media
```

## WordPress foto kuralı (zorunlu)

WP her foto için `-150x150`, `-300x300`, `-768x1024`, `-scaled`, … üretir.

**Foto başına yalnızca bir büyük dosya** (normal / “member gallery” photos):

| Al | Atlama |
|---|---|
| `photo.jpg` (orijinal) | `photo-150x150.jpg`, … |
| Orijinal yoksa `photo-scaled.jpg` | Orijinal varken `-scaled` |
| Sibling `.webp` when the raster original exists | — |
| PDF / ZIP / RAR | — |

Filtered originals are zipped into `$PRIVATE_MEDIA_ROOT/<lodge>/archives/<year>/<lodge>-photos-<year>.zip` (Hostinger disk, member download — not Supabase, not `public_html`).

```bash
npm run filter:wp-media -- /path/to/wp-folder
# or on Hostinger (full migrate):
python3 ~/migrate-wp-uploads.py --all-photo-years
```

`--all-photo-years` also archives smaller years (not only 80MB+ packs). Existing zips are reused.

## Bulk migrate (SSH)

1. Cloud Agent secrets: `HOSTINGER_SSH_HOST|USER|PORT|PASSWORD`
2. Copy `scripts/migrate-wp-uploads.py` to the server and run:

```bash
python3 ~/migrate-wp-uploads.py
# report → $PRIVATE_MEDIA_ROOT/migration-report.json
# catalogs → $PRIVATE_MEDIA_ROOT/_catalogs/<lodge>.json
```

3. Pull catalogs into the repo:

```bash
npm run migrate:apply-catalogs -- /path/to/_catalogs
```

4. Upload PDFs to Supabase (needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Cloud Agent secrets):

```bash
PRIVATE_MEDIA_ROOT=/path/to/private-media npm run migrate:upload-pdfs
```

Until step 4 runs, the download API falls back to disk when the same relative path exists under `PRIVATE_MEDIA_ROOT`.

5. Run SQL: `supabase/member-files.sql` then `supabase/seed-member-files-all.sql`.

## What was migrated (2026-11-13)

| Lodge | PDFs → private-media (Supabase path) | Photo archives → private-media (1 large original / photo) |
|---|---|---|
| freemasons-without-borders | 27 summons/minutes (+ canonical Consecration Summon) | 2021–2025 + `FWB_Consecration.zip` |
| gallipoli | — (no member PDFs outside invoices) | 2022 (~126MB, 111 files) |
| khalsa | — | 2022 (~870MB, 254 files) |
| anadolu | Consecration Summon V1 | 2022 (~3MB, 18 files) |
| namik-kemal | — | 2022 (~3MB, 13 files) |
| ata | — | 2022 (~3MB, 11 files) |

WxH variants skipped (approx): FWB ~10k, Gallipoli ~1.9k, Khalsa ~2.7k.  
Follow-up: `python3 ~/migrate-wp-uploads.py --all-photo-years` filled smaller years (FWB 2024, Anadolu/ATA/Namık Kemal 2022).

## Katalog

Offline JSON: `content/member-files/<lodge>.json` (FWB → `fwb.json`)  
Live table: `lodge_member_files` via `supabase/seed-member-files-all.sql`
