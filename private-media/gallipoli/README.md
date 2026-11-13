# Gallipoli — private files

Yearly WordPress File Manager uploads land here (member-only), not under `public/`.

```
gallipoli/
  pdfs/
    2023/
    2024/
    2025/
  archives/
    2023/
    2024/
    2025/
```

| Kind | Backend | Path pattern |
|---|---|---|
| Summons / minutes PDF | Supabase `member-files` | `gallipoli/pdfs/<year>/<file>.pdf` |
| Photo packs / zip / rar | Hostinger disk | `gallipoli/archives/<year>/<file>.zip` |

Catalog: `content/member-files/gallipoli.json`  
Playbook: `content/member-files/WP-MIGRATION.md`

```bash
npm run seed:private-media   # creates year folders from MANIFEST
```
