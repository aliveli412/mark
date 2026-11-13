# Private file placeholders (committed)

These tiny stubs are **not** the real member documents. They exist so local Downloads smoke tests work without copying multi‑MB/GB binaries into git.

| File | Purpose |
|---|---|
| `FWB-Consecration-Summon.placeholder.pdf` | Tiny PDF copied to `private-media/.../pdfs/` by `npm run seed:private-media` |
| `FWB_Consecration.placeholder.rar` | Tiny stub copied to `private-media/.../archives/` for local stream smoke |

**Production**

1. Upload the real Consecration Summon PDF to Supabase Storage bucket `member-files` at  
   `freemasons-without-borders/pdfs/FWB-Consecration-Summon.pdf`
2. On Hostinger, replace the RAR stub under `PRIVATE_MEDIA_ROOT` with the real ~1.5GB archive.
