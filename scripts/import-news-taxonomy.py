#!/usr/bin/env python3
"""Build content/news-taxonomy.json from live Mark News WP + optional WXR export.

Usage:
  python3 scripts/import-news-taxonomy.py
  python3 scripts/import-news-taxonomy.py --wxr path/to/export.xml
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "news-taxonomy.json"
ORIGIN = "https://www.markmastermasons.com/news"
UA = "MarkPortalNewsTaxonomy/1.0"


def fetch_collection(resource: str) -> list[dict]:
    items: list[dict] = []
    page = 1
    while True:
        url = f"{ORIGIN}/wp-json/wp/v2/{resource}?per_page=100&page={page}"
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
        if not isinstance(data, list) or not data:
            break
        items.extend(data)
        if len(data) < 100:
            break
        page += 1
    return items


def parse_wxr(path: Path) -> tuple[dict[str, str], dict[str, str]]:
    xml = path.read_text(encoding="utf-8", errors="replace")
    cats: dict[str, str] = {}
    tags: dict[str, str] = {}
    for m in re.finditer(
        r'<category domain="([^"]+)" nicename="([^"]+)"><!\[CDATA\[(.*?)\]\]></category>',
        xml,
    ):
        domain, nicename, name = m.group(1), m.group(2), unescape(m.group(3))
        if domain == "category":
            cats[nicename] = name
        elif domain == "post_tag":
            tags[nicename] = name
    return cats, tags


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wxr", default="", help="Optional WordPress WXR export path")
    args = parser.parse_args()

    print("Fetching live categories/tags…")
    cats_api = fetch_collection("categories")
    tags_api = fetch_collection("tags")
    print(f"  API categories={len(cats_api)} tags={len(tags_api)}")

    id_to_slug = {c["id"]: c["slug"] for c in cats_api if c.get("id")}
    by_slug = {
        c["slug"]: {
            "slug": c["slug"],
            "name": unescape(c["name"]),
            "parent": id_to_slug.get(c.get("parent") or 0),
            "description": unescape(c.get("description") or ""),
        }
        for c in cats_api
    }
    tags_by_slug = {
        t["slug"]: {"slug": t["slug"], "name": unescape(t["name"])} for t in tags_api
    }

    if args.wxr:
        wxr = Path(args.wxr)
        if not wxr.exists():
            print(f"WXR not found: {wxr}", file=sys.stderr)
            return 1
        xml_cats, xml_tags = parse_wxr(wxr)
        for slug, name in xml_cats.items():
            if slug not in by_slug:
                by_slug[slug] = {"slug": slug, "name": name, "parent": None, "description": ""}
        for slug, name in xml_tags.items():
            if slug not in tags_by_slug:
                tags_by_slug[slug] = {"slug": slug, "name": name}
        print(f"  Merged WXR categories={len(xml_cats)} tags={len(xml_tags)}")

    out = {
        "imported_at": __import__("time").strftime("%Y-%m-%dT%H:%M:%SZ", __import__("time").gmtime()),
        "source": "live Mark News WP REST" + (" + WXR" if args.wxr else ""),
        "categories": sorted(by_slug.values(), key=lambda c: c["name"].lower()),
        "tags": sorted(tags_by_slug.values(), key=lambda t: t["name"].lower()),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(out['categories'])} categories, {len(out['tags'])} tags)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
