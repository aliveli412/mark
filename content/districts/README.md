# District / country Mark Sites (imported)

JSON under this folder is scraped from the live WordPress district microsites on
`https://www.markmastermasons.com/{slug}/`.

Media lands in `public/districts/{slug}/media/` and is committed so GitHub deploys
include everything.

Empty title-only stubs, demo template pages (e.g. Gallery images that 404 on the
live host, “Hello world” posts, Product/Service placeholders) are dropped so the
portal only keeps publishable content.

## Re-import

```bash
python3 scripts/import-district-sites.py
# or one district:
python3 scripts/import-district-sites.py --only belgium,hongkong
```

Requires network access to `markmastermasons.com`. Uses BeautifulSoup (`pip install beautifulsoup4 lxml`).
