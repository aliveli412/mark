#!/usr/bin/env python3
"""Re-import Mark Sites content from markmastermasons.com WordPress lodge microsites.

This script is intentionally conservative: it overwrites content/sites/<slug>.json
and downloads media into public/sites/<slug>/media/.

Run: python3 scripts/import-mark-sites.py
"""
print("Use the Cloud Agent migration scraper or restore scripts/import-mark-sites.py from the branch history if you need a full re-crawl.")
print("Imported JSON already lives in content/sites/ and media in public/sites/.")
