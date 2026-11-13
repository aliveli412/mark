# Freemasons Without Borders — private files

| File | Backend | Path |
|---|---|---|
| Consecration Summon PDF | Supabase (`member-files`) | `pdfs/FWB-Consecration-Summon.pdf` |
| Consecration photos ZIP | Hostinger disk | `archives/FWB_Consecration.zip` (~1.3GB) |
| Year photo packs | Hostinger disk | `archives/<year>/freemasons-without-borders-photos-<year>.zip` |
| Summons / minutes PDFs | Supabase | `pdfs/<year>/…` |

Migrated from `public_html/fwb/wp-content/uploads` (WxH variants skipped). Catalog: `content/member-files/fwb.json`.

```bash
npm run seed:private-media
PRIVATE_MEDIA_ROOT=… npm run migrate:upload-pdfs
```
