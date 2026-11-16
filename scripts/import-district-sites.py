#!/usr/bin/env python3
"""Import Grand/District Mark Sites from markmastermasons.com into content/districts/.

Discovers pages + posts via WP REST, scrapes rendered HTML (VC shortcodes expanded),
downloads images into public/districts/<slug>/media/, writes content/districts/<slug>.json.

Usage:
  python3 scripts/import-district-sites.py
  python3 scripts/import-district-sites.py --only belgium,hongkong
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html import unescape
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content" / "districts"
PUBLIC_DIR = ROOT / "public" / "districts"
ORIGIN = "https://www.markmastermasons.com"

# Keep in sync with lib/site.ts provinces[].slug
DISTRICT_SLUGS = [
    "belgium",
    "bolivia",
    "bombay",
    "brazil",
    "channelislands",
    "cyprus",
    "eastafrica",
    "england",
    "germany",
    "ghana",
    "gibraltar",
    "hongkong",
    "italy",
    "jamaica-cayman",
    "madras",
    "natal",
    "netherlands",
    "new-zealand",
    "nigeria",
    "river-plate",
    "romania",
    "singapore",
    "safricaeasterndivision",
    "southandeastcaribbean",
    "spain",
    "srilanka",
    "thetransvaal",
    "zimbabwe",
]

SKIP_SLUG_RE = re.compile(
    r"^(sample-page|shop|basket|cart|checkout|my-account|wishlist|"
    r"donation-|give-|recurring-donations|wp-|"
    r".*-confirmation$|.*-failed$|donation-history)",
    re.I,
)

UA = "MarkPortalDistrictImporter/1.0 (+https://github.com/aliveli412/mark)"


def fetch(url: str, timeout: int = 90) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.getcode() or 200, resp.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read() if err.fp else b""
    except Exception as err:  # noqa: BLE001
        print(f"  ! fetch failed {url}: {err}", file=sys.stderr)
        return 0, b""


def fetch_json(url: str):
    status, body = fetch(url)
    if status != 200 or not body:
        return None
    try:
        return json.loads(body.decode("utf-8", errors="replace"))
    except json.JSONDecodeError:
        return None


def strip_tags(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def page_key_from_link(slug: str, link: str, is_front: bool = False) -> str:
    if is_front:
        return "home"
    parsed = urllib.parse.urlparse(link)
    path = parsed.path or "/"
    prefix = f"/{slug}/"
    if path.startswith(prefix):
        rest = path[len(prefix) :].strip("/")
    elif path.strip("/") == slug:
        rest = ""
    else:
        rest = path.strip("/")
    if not rest:
        return "home"
    return rest


def should_skip(wp_slug: str, key: str) -> bool:
    if SKIP_SLUG_RE.search(wp_slug or ""):
        return True
    if SKIP_SLUG_RE.search(key.replace("/", "-")):
        return True
    parts = key.split("/")
    if any(SKIP_SLUG_RE.search(part) for part in parts):
        return True
    if key.startswith("posts/hello-world") or wp_slug.startswith("hello-world"):
        return True
    return False


DEMO_CONTENT_RE = re.compile(
    r"Product\s*/\s*Service|Your Main Message|Whatever your company|"
    r"Hello world|Talk about some of the products|Project Name|"
    r"Learn More Learn More Learn More|This is your first post",
    re.I,
)


def scrub_demo_blocks(html: str) -> str:
    """Remove Hello-world / first-post cards left in homepage carousels."""
    soup = BeautifulSoup(html or "", "lxml")
    for item in list(soup.select(".item, .post-content-wrapper, article, .coblocks-gallery--item, li")):
        blob = item.get_text(" ", strip=True)
        raw = str(item)
        if re.search(r"Hello world|This is your first post", raw, re.I) and (
            "Hello world" in blob or "first post" in blob.lower()
        ):
            item.decompose()
    return str(soup)


def is_publishable_page(key: str, title: str, html: str) -> bool:
    """Drop empty stubs, demo template pages, and media-less galleries."""
    if key == "home":
        return True
    text = strip_tags(html)
    if DEMO_CONTENT_RE.search(f"{html} {text}"):
        return False
    if "district-missing-media" in html and "/districts/" not in html:
        return False
    body = DEMO_CONTENT_RE.sub("", text)
    body = re.sub(re.escape(title or ""), "", body, flags=re.I)
    body = re.sub(r"\bHome\b", "", body)
    body = re.sub(r"\[[^\]]+\]", "", body).strip()
    has_local = "/districts/" in html and "<img" in html
    if has_local and len(body) >= 40:
        return True
    if len(body) >= 140:
        return True
    return False


def extract_main_html(soup: BeautifulSoup) -> str:
    # Prefer main content regions; avoid full page chrome (header/footer/menus).
    for sel in [
        "div.vc_col-sm-9",
        "#main_content",
        "div.main-content-holder",
        "div.content_holder",
        "main article",
        "article.post",
        "div.entry-content",
        "div#content",
        "main",
    ]:
        nodes = soup.select(sel)
        best = None
        best_len = 0
        for node in nodes:
            text_len = len(strip_tags(str(node)))
            # Skip tiny blog widgets / empty columns.
            if text_len > best_len:
                best = node
                best_len = text_len
        if best and best_len >= 40:
            return str(best)

    # Fallback: largest content_row that is not footer/header.
    best = None
    best_len = 0
    for node in soup.select("div.content_row, section.content_row, div.wpb_wrapper"):
        classes = " ".join(node.get("class") or [])
        if "footer" in classes or "header" in classes:
            continue
        text_len = len(strip_tags(str(node)))
        if text_len > best_len:
            best = node
            best_len = text_len
    if best and best_len >= 40:
        return str(best)

    # Keep title/breadcrumb shell when the live page body is empty (common on district stubs).
    main = soup.select_one("#main_content")
    if main:
        return str(main)
    return ""


def download_media(html: str, slug: str, media_dir: Path) -> str:
    media_dir.mkdir(parents=True, exist_ok=True)
    soup = BeautifulSoup(html, "lxml")

    def rewrite(url: str) -> str | None:
        if not url or url.startswith("data:"):
            return None
        abs_url = urllib.parse.urljoin(f"{ORIGIN}/{slug}/", url)
        if "markmastermasons.com" not in abs_url:
            return None
        # Prefer full-size over -scaled / WxH when possible later; keep original URL for now.
        path = urllib.parse.urlparse(abs_url).path
        ext = Path(path).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}:
            return None
        digest = hashlib.sha1(abs_url.encode("utf-8")).hexdigest()[:16]
        filename = f"{digest}{ext}"
        dest = media_dir / filename
        local = f"/districts/{slug}/media/{filename}"
        if not dest.exists():
            status, data = fetch(abs_url, timeout=120)
            if status == 200 and data:
                dest.write_bytes(data)
            else:
                return None
        return local

    for tag in list(soup.find_all(["img", "a", "source"])):
        failed_img = False
        for attr in ("src", "href", "data-src", "data-lazy-src"):
            val = tag.get(attr)
            if not val:
                continue
            # Only rewrite media-like URLs; leave normal page links alone.
            path = urllib.parse.urlparse(urllib.parse.urljoin(f"{ORIGIN}/{slug}/", val)).path
            ext = Path(path).suffix.lower()
            is_media = ext in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
            if not is_media and attr != "src":
                continue
            local = rewrite(val)
            if local:
                tag[attr] = local
            elif tag.name == "img" and attr in {"src", "data-src", "data-lazy-src"} and "markmastermasons.com" in val:
                # Live host often 404s demo gallery files — drop broken icons.
                failed_img = True
        if tag.name == "img" and tag.get("srcset"):
            parts = []
            for chunk in tag["srcset"].split(","):
                chunk = chunk.strip()
                if not chunk:
                    continue
                bits = chunk.split()
                url = bits[0]
                local = rewrite(url)
                if local:
                    bits[0] = local
                    parts.append(" ".join(bits))
            if parts:
                tag["srcset"] = ", ".join(parts)
            else:
                tag.attrs.pop("srcset", None)
        if failed_img:
            remove_node = tag
            for cand in (tag.parent, getattr(tag.parent, "parent", None)):
                if not cand or not getattr(cand, "name", None):
                    continue
                classes = " ".join(cand.get("class") or [])
                if cand.name in {"figure", "li"} or "coblocks-gallery--item" in classes or "coblocks-gallery--figure" in classes:
                    remove_node = cand
            remove_node.decompose()

    return str(soup)


def list_rest_collection(base: str, resource: str) -> list[dict]:
    items: list[dict] = []
    page = 1
    while True:
        url = (
            f"{base}/wp-json/wp/v2/{resource}"
            f"?per_page=100&page={page}&_fields=id,slug,link,title,parent,type,status"
        )
        data = fetch_json(url)
        if not data:
            break
        if isinstance(data, dict) and data.get("code"):
            break
        if not isinstance(data, list) or not data:
            break
        items.extend(data)
        if len(data) < 100:
            break
        page += 1
        time.sleep(0.15)
    return items


def import_district(slug: str) -> dict:
    base = f"{ORIGIN}/{slug}"
    print(f"\n=== {slug} ===")
    site_meta = fetch_json(f"{base}/wp-json/")
    if not site_meta:
        print("  ! site unreachable")
        return {
            "slug": slug,
            "base": f"{base}/",
            "name": slug,
            "status": "unreachable",
            "pages": {},
        }

    name = site_meta.get("name") or slug
    front_id = site_meta.get("page_on_front")
    pages_rest = list_rest_collection(base, "pages")
    posts_rest = list_rest_collection(base, "posts")
    print(f"  REST pages={len(pages_rest)} posts={len(posts_rest)} name={name!r}")

    media_dir = PUBLIC_DIR / slug / "media"
    out_pages: dict[str, dict] = {}

    # Always scrape the site root as home.
    status, home_html = fetch(f"{base}/")
    if status == 200 and home_html:
        soup = BeautifulSoup(home_html, "lxml")
        title_el = soup.find("title")
        title = unescape(title_el.get_text(" ", strip=True)) if title_el else name
        title = re.sub(r"\s*[|\-–].*$", "", title).strip() or name
        main = extract_main_html(soup)
        main = download_media(main, slug, media_dir)
        main = scrub_demo_blocks(main)
        out_pages["home"] = {
            "title": title,
            "source": f"{base}/",
            "status": status,
            "html": main,
            "text_chars": len(strip_tags(main)),
            "meta": {},
        }
        print(f"  + home ({out_pages['home']['text_chars']} chars)")

    def ingest(link: str, wp_slug: str, title_raw: str, key_hint: str | None = None, is_front: bool = False):
        key = key_hint or page_key_from_link(slug, link, is_front=is_front)
        if key == "home" and "home" in out_pages and not is_front:
            return
        if should_skip(wp_slug, key):
            return
        if key in out_pages:
            return
        st, raw = fetch(link if link.endswith("/") or "." in Path(urllib.parse.urlparse(link).path).name else link.rstrip("/") + "/")
        # try without forced slash if failed
        if st != 200:
            st, raw = fetch(link)
        if st != 200 or not raw:
            print(f"  - skip {key} status={st}")
            return
        soup = BeautifulSoup(raw, "lxml")
        title = unescape(BeautifulSoup(title_raw, "lxml").get_text(" ", strip=True)) if title_raw else key
        main = extract_main_html(soup)
        text_len = len(strip_tags(main)) if main else 0
        if text_len < 40:
            print(f"  ~ skip empty {key}")
            time.sleep(0.05)
            return
        main = download_media(main, slug, media_dir)
        text_len = len(strip_tags(main))
        if not is_publishable_page(key, title, main):
            print(f"  ~ skip thin/demo {key}")
            time.sleep(0.05)
            return
        print(f"  + {key} ({text_len} chars)")
        out_pages[key] = {
            "title": title,
            "source": link,
            "status": st,
            "html": main,
            "text_chars": text_len,
            "meta": {},
        }
        time.sleep(0.12)

    for item in pages_rest:
        link = item.get("link") or ""
        wp_slug = item.get("slug") or ""
        title = (item.get("title") or {}).get("rendered") or wp_slug
        is_front = bool(front_id and item.get("id") == front_id)
        if is_front:
            continue  # already scraped root
        ingest(link, wp_slug, title, is_front=False)

    for item in posts_rest:
        link = item.get("link") or ""
        wp_slug = item.get("slug") or ""
        title = (item.get("title") or {}).get("rendered") or wp_slug
        key = f"posts/{wp_slug}" if wp_slug else None
        if not key:
            continue
        ingest(link, wp_slug, title, key_hint=key)

    return {
        "slug": slug,
        "base": f"{base}/",
        "name": name,
        "status": "ok",
        "page_count": len(out_pages),
        "pages": out_pages,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", default="", help="Comma-separated slugs to import")
    args = parser.parse_args()
    only = {s.strip() for s in args.only.split(",") if s.strip()}
    slugs = [s for s in DISTRICT_SLUGS if not only or s in only]
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    for slug in slugs:
        data = import_district(slug)
        out = CONTENT_DIR / f"{slug}.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Always rebuild the full manifest from on-disk JSON so --only merges cleanly.
    districts = []
    for path in sorted(CONTENT_DIR.glob("*.json")):
        if path.name == "manifest.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        districts.append(
            {
                "slug": data.get("slug") or path.stem,
                "name": data.get("name"),
                "status": data.get("status"),
                "page_count": data.get("page_count", len(data.get("pages") or {})),
                "file": f"content/districts/{path.name}",
            }
        )
    manifest = {
        "imported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "districts": districts,
    }
    (CONTENT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("\nWrote", CONTENT_DIR / "manifest.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
