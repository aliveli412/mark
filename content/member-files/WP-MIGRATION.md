# WordPress File Manager → new site

Use this when a lodge (e.g. Gallipoli) has years of summons / minutes / photo packs sitting in WP File Manager.

## 1. Triage (her dosya için bir kova)

| WP’de ne? | Yeni site | Nereye |
|---|---|---|
| Sayfa görseli, banner, public galeri | Public | `public/sites/<lodge>/media/` |
| Üye PDF (summon, minutes, circular) ≈ birkaç MB | Private Supabase | bucket `member-files` → `<lodge>/pdfs/<year>/...` |
| Büyük foto arşivi / RAR / ZIP (yüzlerce MB+) | Private Hostinger | `$PRIVATE_MEDIA_ROOT/<lodge>/archives/<year>/...` |

Üye dosyaları **asla** `public/` veya `public_html` altına konmaz. Üye Dashboard → **Downloads** üzerinden iner.

## 1b. WordPress foto kuralı (zorunlu)

WP her foto için saçma sapan boyutlar üretir (`-150x150`, `-300x300`, `-768x1024`, `-scaled`, …).

**Hepsini alma. Foto başına yalnızca bir büyük dosya:**

| Al | Atlama |
|---|---|
| `photo.jpg` (orijinal) | `photo-150x150.jpg`, `photo-300x300.jpg`, … |
| Orijinal yoksa `photo-scaled.jpg` | Orijinal varken `-scaled` |
| PDF / ZIP / RAR (olduğu gibi) | — |

Filtre:

```bash
node scripts/filter-wp-media.mjs /path/to/wp-folder
# veya kopyala:
node scripts/filter-wp-media.mjs /path/to/wp-folder --copy-to /tmp/gallipoli-clean
```

## 2. Klasör kuralı (yıllık)

```
# Supabase object key = aynı relative path
<lodge>/pdfs/2024/Gallipoli-Summon-2024-11.pdf
<lodge>/pdfs/2023/...

# Hostinger disk
$PRIVATE_MEDIA_ROOT/<lodge>/archives/2024/Gallipoli-Photos-2024.zip
```

Gallipoli örneği:

```
gallipoli/pdfs/2024/...
gallipoli/archives/2024/...
```

## 3. Taşıma adımları (Gallipoli örneği)

1. WP File Manager’dan ilgili klasörü zip’le / indir (yıl yıl veya hepsi).
2. `scripts/filter-wp-media.mjs` ile `-WxH` varyantlarını at; foto başına bir büyük kalsın.
3. Kalanları triage et (tabloya göre ayır).
4. **Public** olanları `public/sites/gallipoli/media/` altına kopyala; sayfa HTML’de path güncelle (gerekirse).
5. **Üye PDF**’leri Supabase Storage → bucket `member-files` → `gallipoli/pdfs/<year>/...` yükle.
6. **Büyük arşiv**leri Hostinger’da `PRIVATE_MEDIA_ROOT/gallipoli/archives/<year>/...` koy.
7. Kataloğa ekle (Downloads’ta görünsün):
   - Local/offline: `content/member-files/gallipoli.json`
   - Live: `lodge_member_files` satırı (SQL veya admin — şimdilik SQL / JSON)
8. Üye girişi ile Gallipoli → Downloads’tan dene.

## 4. Katalog satırı (kopyala-yapıştır)

`content/member-files/gallipoli.json` içinde:

```json
{
  "slug": "summon-2024-11",
  "title": "Summon — November 2024",
  "description": "Migrated from WordPress File Manager.",
  "file_name": "Gallipoli-Summon-2024-11.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 0,
  "storage_backend": "supabase",
  "storage_path": "gallipoli/pdfs/2024/Gallipoli-Summon-2024-11.pdf",
  "visibility": "members",
  "sort_order": 202411
}
```

Büyük arşiv için `storage_backend: "local"` ve `storage_path: "gallipoli/archives/2024/...."`.

`sort_order` için `YYYYMM` kullan → Downloads listesi yıldan yıla düzgün sıralanır.

## 5. Toplu iş (ileride)

Şimdilik manuel triage + upload yeterli. Çok dosya olursa:

1. WP’den bir klasör dump al
2. Script ile dosya listesi çıkar (isim, boyut, uzantı)
3. PDF → Supabase path, büyük zip → Hostinger path öner
4. `gallipoli.json` / SQL satırlarını üret

Admin UI ile sürükle-bırak upload henüz yok; hybrid API + katalog hazır.
