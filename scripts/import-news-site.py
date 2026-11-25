#!/usr/bin/env python3
"""Import Mark News (markmastermasons.com/news/) into content/news.json.

Fetches posts via WP REST, scrapes rendered article HTML, downloads images into
public/news/media/, and writes a single content/news.json catalog.

Usage:
  python3 scripts/import-news-site.py
"""

from __future__ import annotations

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
CONTENT_PATH = ROOT / "content" / "news.json"
PUBLIC_DIR = ROOT / "public" / "news" / "media"
ORIGIN = "https://www.markmastermasons.com/news"
UA = "MarkPortalNewsImporter/1.0 (+https://github.com/aliveli412/mark)"


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
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def plain_title(raw: str) -> str:
    return unescape(BeautifulSoup(raw or "", "lxml").get_text(" ", strip=True))


def download_url(url: str, media_dir: Path) -> str | None:
    if not url or url.startswith("data:"):
        return None
    abs_url = urllib.parse.urljoin(f"{ORIGIN}/", url)
    if "markmastermasons.com" not in abs_url:
        return None
    path = urllib.parse.urlparse(abs_url).path
    ext = Path(path).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}:
        return None
    digest = hashlib.sha1(abs_url.encode("utf-8")).hexdigest()[:16]
    filename = f"{digest}{ext}"
    dest = media_dir / filename
    local = f"/news/media/{filename}"
    if not dest.exists():
        status, data = fetch(abs_url, timeout=120)
        if status == 200 and data:
            dest.write_bytes(data)
        else:
            return None
    return local


def rewrite_media(html: str, media_dir: Path) -> str:
    media_dir.mkdir(parents=True, exist_ok=True)
    soup = BeautifulSoup(html or "", "lxml")

    for tag in list(soup.find_all(["img", "a", "source"])):
        failed_img = False
        for attr in ("src", "href", "data-src", "data-lazy-src"):
            val = tag.get(attr)
            if not val:
                continue
            path = urllib.parse.urlparse(urllib.parse.urljoin(f"{ORIGIN}/", val)).path
            ext = Path(path).suffix.lower()
            is_media = ext in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
            if not is_media and attr != "src":
                continue
            local = download_url(val, media_dir)
            if local:
                tag[attr] = local
            elif tag.name == "img" and attr in {"src", "data-src", "data-lazy-src"} and "markmastermasons.com" in val:
                failed_img = True
        if tag.name == "img" and tag.get("srcset"):
            parts = []
            for chunk in tag["srcset"].split(","):
                chunk = chunk.strip()
                if not chunk:
                    continue
                bits = chunk.split()
                local = download_url(bits[0], media_dir)
                if local:
                    bits[0] = local
                    parts.append(" ".join(bits))
            if parts:
                tag["srcset"] = ", ".join(parts)
            else:
                tag.attrs.pop("srcset", None)
        if failed_img:
            tag.decompose()

    # Drop wrapper html/body if present
    body = soup.body
    if body:
        return "".join(str(c) for c in body.contents)
    return str(soup)


def extract_article_html(soup: BeautifulSoup, fallback_html: str) -> str:
    for sel in [
        "div.entry-content",
        "div.content-inner",
        "article .content-inner",
        "div.post-content",
        "article.post",
        "main article",
        "div#content",
        "main",
    ]:
        nodes = soup.select(sel)
        best = None
        best_len = 0
        for node in nodes:
            # Prefer content without sharing/nav chrome
            clone = BeautifulSoup(str(node), "lxml")
            for junk in clone.select(
                ".jeg_post_meta, .jeg_share_button, .jeg_prevnext_post, "
                ".jeg_authorbox, .jeg_post_tags, .comments-area, nav, "
                ".jeg_ad, .jnews_inline_related_post"
            ):
                junk.decompose()
            text_len = len(strip_tags(str(clone)))
            if text_len > best_len:
                best = clone
                best_len = text_len
        if best and best_len >= 40:
            body = best.body
            return "".join(str(c) for c in body.contents) if body else str(best)

    return fallback_html or ""


def featured_from_embed(post: dict, media_dir: Path) -> str | None:
    embedded = post.get("_embedded") or {}
    media_list = embedded.get("wp:featuredmedia") or []
    if not media_list:
        return None
    media = media_list[0] or {}
    source = media.get("source_url") or ""
    if not source:
        sizes = ((media.get("media_details") or {}).get("sizes") or {})
        for key in ("full", "large", "medium_large", "medium"):
            if key in sizes and sizes[key].get("source_url"):
                source = sizes[key]["source_url"]
                break
    return download_url(source, media_dir) if source else None


def categories_from_embed(post: dict) -> list[dict]:
    embedded = post.get("_embedded") or {}
    terms = embedded.get("wp:term") or []
    cats = terms[0] if terms else []
    out = []
    for cat in cats:
        slug = cat.get("slug") or ""
        name = cat.get("name") or slug
        if not slug:
            continue
        # Skip empty uncategorized noise only when other cats exist — keep if sole cat
        out.append({"slug": slug, "name": unescape(name)})
    return out


def list_posts() -> list[dict]:
    items: list[dict] = []
    page = 1
    while True:
        url = f"{ORIGIN}/wp-json/wp/v2/posts?per_page=50&page={page}&_embed=1"
        data = fetch_json(url)
        if not data or not isinstance(data, list):
            break
        items.extend(data)
        if len(data) < 50:
            break
        page += 1
        time.sleep(0.2)
    return items


def import_news() -> dict:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    posts_rest = list_posts()
    print(f"REST posts={len(posts_rest)}")

    posts_out: list[dict] = []
    for post in posts_rest:
        slug = post.get("slug") or ""
        if not slug:
            continue
        title = plain_title((post.get("title") or {}).get("rendered") or slug)
        link = post.get("link") or f"{ORIGIN}/{slug}.html"
        excerpt_html = (post.get("excerpt") or {}).get("rendered") or ""
        excerpt = unescape(strip_tags(excerpt_html))
        content_html = (post.get("content") or {}).get("rendered") or ""
        date = post.get("date") or post.get("date_gmt") or ""
        modified = post.get("modified") or date

        print(f"  + {slug}")
        st, raw = fetch(link)
        if st == 200 and raw:
            soup = BeautifulSoup(raw, "lxml")
            article_html = extract_article_html(soup, content_html)
        else:
            print(f"    ~ scrape failed status={st}, using REST content")
            article_html = content_html

        article_html = rewrite_media(article_html, PUBLIC_DIR)
        # Also rewrite REST content images if scrape was thin
        if len(strip_tags(article_html)) < 80 and content_html:
            article_html = rewrite_media(content_html, PUBLIC_DIR)

        image = featured_from_embed(post, PUBLIC_DIR)
        if not image:
            # First local img in body
            soup = BeautifulSoup(article_html, "lxml")
            img = soup.find("img", src=True)
            if img and str(img.get("src", "")).startswith("/news/media/"):
                image = img["src"]

        # Avoid duplicating the featured image as the first body image.
        if image:
            soup = BeautifulSoup(article_html, "lxml")
            img = soup.find("img", src=True)
            if img and img.get("src") == image:
                node = img
                parent = img.parent
                if parent and parent.name in {"figure", "p", "a", "div"}:
                    siblings = parent.find_all("img")
                    text = parent.get_text(" ", strip=True)
                    if siblings == [img] and len(text) < 40:
                        node = parent
                node.decompose()
                body = soup.body
                article_html = "".join(str(c) for c in body.contents) if body else str(soup)

        cats = categories_from_embed(post)
        # Prefer a meaningful primary category over Uncategorized
        primary = next((c for c in cats if c["slug"] not in {"uncategorized", "uncategorised"}), None)
        if not primary and cats:
            primary = cats[0]

        posts_out.append(
            {
                "id": f"news-{post.get('id')}",
                "slug": slug,
                "title": title,
                "excerpt": excerpt,
                "html": article_html,
                "image": image,
                "categories": cats,
                "primary_category": primary,
                "tags": [],
                "seo_title": "",
                "seo_description": excerpt[:160],
                "seo_keywords": ", ".join(c["name"] for c in cats),
                "published": True,
                "published_at": date,
                "modified_at": modified,
                "source": link,
                "text_chars": len(strip_tags(article_html)),
            }
        )
        time.sleep(0.15)

    # Newest first
    posts_out.sort(key=lambda p: p.get("published_at") or "", reverse=True)

    return {
        "slug": "news",
        "base": f"{ORIGIN}/",
        "name": "Mark News",
        "imported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "post_count": len(posts_out),
        "posts": posts_out,
    }


def main() -> int:
    data = import_news()
    CONTENT_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTENT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nWrote {CONTENT_PATH} ({data['post_count']} posts)")
    print(f"Media dir {PUBLIC_DIR} ({len(list(PUBLIC_DIR.glob('*')))} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
