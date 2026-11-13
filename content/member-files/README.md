# Member-only files (hybrid storage)

## Rule

| Kind | Where |
|---|---|
| Public page images | `public/sites/<lodge>/media/` |
| Small PDFs / summons | **Supabase Storage** private bucket `member-files` |
| Large RAR / photo packs | **Hostinger disk** `private-media/<lodge>/...` (not in `public/`) |

## Local / Hostinger folder

```
private-media/
  freemasons-without-borders/
    pdfs/          # optional local copies of small PDFs
    archives/
      FWB_Consecration.rar
```

Set in `.env.local` if needed:

```
PRIVATE_MEDIA_ROOT=/absolute/path/to/private-media
```

On Hostinger, put this **outside** the public web root (or keep the folder in the app but never under `public/`).

## Supabase

1. Run `supabase/member-files.sql`
2. Create private bucket `member-files` in Storage
3. Upload e.g. `freemasons-without-borders/pdfs/FWB-Consecration-Summon.pdf`
4. Insert / seed rows (Admin later, or SQL / JSON seed for mock)

## App access

- Member dashboard → **Downloads**
- API: `GET /api/sites/<slug>/files` (list)
- API: `GET /api/sites/<slug>/files/<id>/download` (membership required)
