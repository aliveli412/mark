# WordPress → portal import (lodges & districts)

How lodge WordPress microsites were imported into this repo, how `/sites/[slug]` renders that content, and how the same pipeline extends to district/country sites (`/districts/[slug]`).

## 1. Import scripts

### Page + public media importer

| Item | Path / detail |
|---|---|
| Script | `scripts/import-mark-sites.py` |
| Run | `python3 scripts/import-mark-sites.py` (from repo root) |
| How it fetches WP | HTTPS GET of each curated page URL under `https://(www.)markmastermasons.com/<wp-path>/` with `User-Agent: MarkPortalMigrator/1.0`. Follows redirects. Does **not** require SSH. WP REST (`/wp-json/wp/v2/pages`) exists on the same sites and is useful for discovery, but the committed import scraped **rendered HTML**. |
| HTML extract | Prefer largest Visual Composer main column `vc_col-sm-9` (fallback `wpb_text_column`, `vc_col-sm-8`, generic content div) via balanced-div extraction. |
| Media | Images rewritten to `/sites/<slug>/media/<sha1-16><ext>` under `public/sites/<slug>/media/`. |
| JSON out | `content/sites/<slug>.json` |
| Index out | `content/sites/manifest.json` (per-page status/chars/source) and `content/sites/site-meta.json` (home meta summary) |

**Output shape** (`content/sites/<slug>.json`):

```json
{
  "slug": "gallipoli",
  "base": "https://markmastermasons.com/gallipoli/",
  "pages": {
    "home": {
      "title": "…",
      "source": "https://…",
      "status": 200,
      "html": "<div class=\"vc_col-sm-9 …\">…</div>",
      "text_chars": 456,
      "meta": {
        "countdown_label": "Countdown to our next…",
        "posts": [{ "title": "…", "category": "…", "image": "/sites/gallipoli/media/….jpg", "source": "https://…" }],
        "phone": "",
        "address_lines": ["C/O Gallipoli", "…"]
      }
    },
    "history/oration": { "title": "The Oration", "source": "…", "status": 200, "html": "…", "text_chars": 6465, "meta": {} },
    "contact": { "…" : "…" },
    "posts/…": { "…" : "…" }
  }
}
```

Page keys are portal routes, not WP slugs. Examples:

| Portal key | Typical WP path |
|---|---|
| `home` | `/` |
| `history/oration` | `/the-oration` |
| `members/honorary-members` | `/hononary-members` (WP typo preserved) |
| `meetings/regular-meetings` | `/meetings` |
| `masters-charities/mcf` | `/masonic-charitable-foundation` |
| `contact` | `/contact-us` or `/contact` |
| `posts/<id>` | `/*.html` articles |

**Lodge WP path → portal slug** (hardcoded in the importer `SITES` map):

| Portal slug | Live WP base |
|---|---|
| `gallipoli` | `…/gallipoli/` |
| `namik-kemal` | `…/namikkemal/` |
| `anadolu` | `…/anadolu/` |
| `freemasons-without-borders` | `…/fwb/` |
| `ata` | `…/ata/` |
| `khalsa` | `…/khalsa/` |

Imported successfully (JSON in repo): the six above.  
Not publicly reachable at import time (placeholders only in `lib/mark-sites.ts`): `mark-enterprise`, `phoenix` (403), `roentgen`.

History note: commit `2d9c248` landed the JSON + media but left `scripts/import-mark-sites.py` as a stub. The working scraper lived in the Cloud Agent session that produced that commit; it is restored in-tree as the script above.

### Member uploads / private media (separate pipeline)

| Item | Path / detail |
|---|---|
| Script | `scripts/migrate-wp-uploads.py` (runs **on Hostinger** next to WP) |
| Filter helper | `scripts/filter-wp-media.mjs` / `npm run filter:wp-media` |
| Catalog apply | `scripts/apply-migration-catalogs.mjs` / `npm run migrate:apply-catalogs` |
| PDF upload | `scripts/upload-member-pdfs-to-supabase.mjs` / `npm run migrate:upload-pdfs` |
| Playbook | `content/member-files/WP-MIGRATION.md` |

This path copies member PDFs and year photo zips from  
`~/domains/markmastermasons.com/public_html/<wp>/wp-content/uploads`  
into `$PRIVATE_MEDIA_ROOT/<lodge-slug>/{pdfs,archives}/`. It does **not** write `content/sites/*.json`.

---

## 2. How rendering works

```
content/sites/<slug>.json
        │
        ▼
lib/site-content.ts          loadSiteContent / getSitePage / listContentKeys / localizeHtml
        │
        ▼
lib/mark-sites-server.ts     getEnrichedMarkSite(slug)
        │  merges JSON into static MarkSite from lib/mark-sites.ts
        │  rebuilds nav from content keys; overlays phone/address/posts/fullName
        ▼
app/sites/[slug]/layout.tsx  → LodgeShell(site)
app/sites/[slug]/page.tsx    → LodgeHome (meetings UI; not raw home HTML)
app/sites/[slug]/[section]/[page]/page.tsx → LodgeContent (imported HTML)
app/sites/[slug]/contact/page.tsx → LodgeContent or fallback
app/sites/[slug]/posts/[post]/page.tsx → LodgeContent
```

### `getEnrichedMarkSite`

1. Load static site from `markSites` (`lib/mark-sites.ts`).
2. If `content/sites/<slug>.json` exists, merge:
   - `fullName`, `phone`, `addressLines`, `nextMeetingLabel` from `pages.home.meta` / title
   - `nav` rebuilt by `navFromContent` (History / Members / Meetings / Master’s Charities groups from keys like `history/oration`)
   - `posts` from home meta (with known Gallipoli post-key remaps)
   - `hasImportedContent: true`
3. If no JSON, return the static site (placeholders / `sourceNote`).

### `LodgeShell`

Client chrome for every lodge route: brand header, primary nav + hamburger (Members sign-in), title bar/breadcrumbs, left sidebar from `site.nav`, footer. Children are the page body.

### Content JSON → HTML pages

`LodgeContent` runs `localizeHtml` (rewrite absolute WP URLs to `/sites/<slug>/…`) then `dangerouslySetInnerHTML` inside `.lodge-rich`. Empty text shows `sourceNote` or a “no published body” message.

Home is **not** the scraped home HTML: `LodgeHome` is a portal-native countdown + event panel + post cards from enriched `site.posts`.

---

## 3. Can district/country WP sites reuse the same importer?

**Yes.** Districts are the same Hostinger multisite pattern:

- Live URL: `https://www.markmastermasons.com/{slug}/` (matches `Province.liveUrl` in `lib/site.ts`)
- Same theme / Visual Composer markup
- Public WP REST: e.g. Belgium reports `X-WP-Total: 57` pages at `/belgium/wp-json/wp/v2/pages`

What changes for districts:

1. **Page map** — lodge nav keys (`history/oration`, …) are lodge-specific. District sites need either:
   - REST-driven discovery (`wp/v2/pages` + `wp/v2/media`), or
   - A per-district curated key ↔ WP-path table.
2. **Storage path** — prefer `content/districts/<slug>.json` + `public/districts/<slug>/media/` (keep lodges under `content/sites/`), **or** reuse `content/sites/` with a `kind: "district"` field.
3. **Render shell** — today’s `/districts/[slug]` is a thin portal stub (name, map link, “Open legacy live site”). After import, either enrich that page or add a district shell analogous to `LodgeShell`.

No SSH is required for public page HTML/media; SSH is only for bulk private uploads migration.

---

## 4. Province slugs (`lib/site.ts`)

`href` for each is `/districts/<slug>`; `liveUrl` is `https://www.markmastermasons.com/<slug>/`.

| Name | Slug |
|---|---|
| Belgium | `belgium` |
| Bolivia | `bolivia` |
| Bombay | `bombay` |
| Brazil | `brazil` |
| Channel Islands | `channelislands` |
| Cyprus | `cyprus` |
| East Africa | `eastafrica` |
| England | `england` |
| Germany | `germany` |
| Ghana | `ghana` |
| Gibraltar | `gibraltar` |
| Hong Kong | `hongkong` |
| Italy | `italy` |
| Jamaica & Cayman | `jamaica-cayman` |
| Madras | `madras` |
| Natal | `natal` |
| Netherlands | `netherlands` |
| New Zealand | `new-zealand` |
| Nigeria | `nigeria` |
| River Plate | `river-plate` |
| Romania | `romania` |
| Singapore | `singapore` |
| South Africa (Eastern Division) | `safricaeasterndivision` |
| South and East Caribbean | `southandeastcaribbean` |
| Spain | `spain` |
| Sri Lanka | `srilanka` |
| The Transvaal | `thetransvaal` |
| Zimbabwe | `zimbabwe` |

**28** provinces in the array (portal stats still say “33 Districts” — a few live WP districts may be missing from this list).

UI entry points: `/grand-lodges` → `ProvinceDirectory` / `DistrictMap` → `/districts/[slug]`.

---

## 5. Practical plan: import ALL district sites into the portal

### Phase A — Discover (no SSH)

1. For each slug in `provinces`, GET  
   `https://www.markmastermasons.com/{slug}/wp-json/wp/v2/pages?per_page=100`  
   (paginate with `X-WP-TotalPages`) and optionally `/wp/v2/media`.
2. Write `content/districts/_discovery/<slug>.json` (id, slug, link, title, parent, menu_order).
3. Spot-check HTML of home + 2–3 deep pages for `vc_col-sm-9` (confirm same extractors).
4. Record 403/empty sites like the lodge placeholders.

### Phase B — Import pages + public media

1. Generalize `scripts/import-mark-sites.py` → e.g. `scripts/import-wp-sites.py` with:
   - `--kind lodge|district`
   - `--slugs belgium,cyprus` or `--all-districts` reading `lib/site.ts` / a JSON export of province slugs
   - Page list from discovery (map WP slug → portal key `pages/<wp-slug>` or nested by parent)
2. Output:
   - `content/districts/<slug>.json` (same schema as lodge files)
   - `public/districts/<slug>/media/…`
   - `content/districts/manifest.json`
3. Rate-limit (~0.1–0.2s/page); ~28 × ~57 pages ≈ 1.5k HTML fetches plus images.

### Phase C — Render in-portal

1. Add `lib/district-content.ts` (or reuse `site-content.ts` with a root folder param).
2. Enrich `app/districts/[slug]/page.tsx`:
   - If JSON present → render home/overview + nav of imported pages
   - Else keep current stub + legacy link
3. Add nested routes, e.g. `app/districts/[slug]/[...page]/page.tsx`, mirroring lodge `LodgeContent` + `localizeHtml`.
4. Optional: light `DistrictShell` (brand + nav) without lodge membership chrome.
5. Keep `liveUrl` as secondary “legacy site” until parity is verified.

### Phase D — Private media (optional, SSH)

Only if districts have member PDFs / large photo packs under  
`public_html/<slug>/wp-content/uploads`:

1. Extend `LODGES` map in `scripts/migrate-wp-uploads.py` (or add `DISTRICTS`).
2. SCP script to Hostinger; run with `PRIVATE_MEDIA_ROOT=…/private-media`.
3. Catalog → `content/member-files/` / Supabase as for lodges.

### Phase E — Cutover

1. Map markers / province grid already point at `/districts/[slug]` (in-portal).
2. Smoke: one small district (e.g. Gibraltar) end-to-end, then batch.
3. Commit JSON + media in chunks if git size is large; LFS only if needed.

---

## 6. Hostinger SSH / env vars (historical)

Used by the WP **uploads** migration Cloud Agent (not by the HTML page scraper).

### Cloud Agent secrets

| Secret | Purpose |
|---|---|
| `HOSTINGER_SSH_HOST` | SSH host |
| `HOSTINGER_SSH_USER` | SSH user (Hostinger account, historically `u557964768`) |
| `HOSTINGER_SSH_PORT` | Non-default SSH port (historically `65002`) |
| `HOSTINGER_SSH_PASSWORD` | Password auth via `sshpass -e` |

Typical remote session:

```bash
export SSHPASS="$HOSTINGER_SSH_PASSWORD"
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -p ${HOSTINGER_SSH_PORT}"
sshpass -e scp $SSH_OPTS scripts/migrate-wp-uploads.py "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}:~/migrate-wp-uploads.py"
sshpass -e ssh $SSH_OPTS "${HOSTINGER_SSH_USER}@${HOSTINGER_SSH_HOST}" 'python3 ~/migrate-wp-uploads.py'
```

### Paths on the server

```
/home/u557964768/domains/markmastermasons.com/
  public_html/                 # WP multisite roots: gallipoli/, fwb/, belgium/, …
  private-media/               # sibling of public_html — NOT web-served
```

### App / migrate env vars

| Variable | Role |
|---|---|
| `PRIVATE_MEDIA_ROOT` | Absolute path to private-media tree (live: `…/markmastermasons.com/private-media`; local default `./private-media`) |
| `SUPABASE_URL` | PDF upload + membership APIs |
| `SUPABASE_SERVICE_ROLE_KEY` | `npm run migrate:upload-pdfs` |
| `SUPABASE_ANON_KEY` | App client |
| `SITE_URL` | Stripe / absolute links |
| `MEMBERSHIP_DEV_ACCESS_CODE` | Local member access (default `111111`) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Shop (unrelated to WP import) |
| `ADMIN_BOOTSTRAP_EMAIL` | Local admin promote |

See also: `.env.example`, `private-media/README.md`, `content/member-files/WP-MIGRATION.md`.

---

## Current district pages (status)

`app/districts/[slug]/page.tsx` is already static for every province slug. It shows portal metadata and a button to the legacy live WP site. It does **not** yet load imported JSON. Lodges remain the only content type with full in-portal WP HTML under `/sites/[slug]/…`.
