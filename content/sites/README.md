# Mark Sites imported content

JSON under this folder was imported from the live WordPress lodge microsites on markmastermasons.com.

**Full playbook** (importer internals, render path, district reuse, province slugs, Hostinger SSH): [`WP-IMPORT.md`](./WP-IMPORT.md).

- Media files live in `public/sites/<slug>/media/`
- Re-run the importer with: `python3 scripts/import-mark-sites.py`

Imported during migration:

- gallipoli, namik-kemal, anadolu, freemasons-without-borders, ata, khalsa

Not publicly reachable at import time (placeholders remain in the app):

- mark-enterprise, phoenix (403), roentgen

District/country WP sites use the same URL pattern (`markmastermasons.com/{slug}/`) and can reuse the importer; portal stubs already exist at `/districts/[slug]` (see `lib/site.ts` provinces + `WP-IMPORT.md` §5).
