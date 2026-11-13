# Gallipoli — private files

```
gallipoli/
  pdfs/
  archives/
    2022/gallipoli-photos-2022.zip   # filtered WP originals (~126MB)
```

| Kind | Backend | Path pattern |
|---|---|---|
| Summons / minutes PDF | Supabase `member-files` | `gallipoli/pdfs/<year>/<file>.pdf` |
| Photo packs | Hostinger disk | `gallipoli/archives/<year>/<file>.zip` |

2026-11-13 migrate: no member PDFs outside Woo invoices; 2022 photo archive created.  
Catalog: `content/member-files/gallipoli.json` · Playbook: `content/member-files/WP-MIGRATION.md`
