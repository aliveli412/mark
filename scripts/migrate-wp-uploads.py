#!/usr/bin/env python3
"""
Migrate WordPress uploads for all Mark lodges into the hybrid layout.

Rules (locked):
  - Photos: keep ONE large file per image (skip -WxH variants; prefer original over -scaled)
  - Member PDFs → $PRIVATE_MEDIA_ROOT/<slug>/pdfs/<year>/…  (Supabase object key = same path)
  - Large archives / photo packs → $PRIVATE_MEDIA_ROOT/<slug>/archives/<year>/…
  - Never write member files under public_html

Usage on Hostinger:
  python3 migrate-wp-uploads.py [--dry-run] [--skip-archives]
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

WP_ROOT = Path.home() / "domains/markmastermasons.com/public_html"
DEFAULT_PRIVATE_ROOT = Path.home() / "domains/markmastermasons.com/private-media"
PRIVATE_ROOT = DEFAULT_PRIVATE_ROOT

# WP path segment → lodge slug used by the Next.js portal
LODGES = {
    "gallipoli": "gallipoli",
    "namikkemal": "namik-kemal",
    "anadolu": "anadolu",
    "fwb": "freemasons-without-borders",
    "ata": "ata",
    "khalsa": "khalsa",
}

SIZE_VARIANT = re.compile(r"-\d+x\d+(?=\.[^.]+$)", re.I)
SCALED = re.compile(r"-scaled(?=\.[^.]+$)", re.I)
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}
ARCHIVE_EXT = {".zip", ".rar", ".7z"}
PDF_EXT = {".pdf"}

# Skip plugin / commerce junk when walking uploads
SKIP_DIR_PARTS = {
    "pdf-invoices",
    "woocommerce_uploads",
    "wc-logs",
    "wpdm-cache",
    "wpdm-custom-tags",
    "wpdm-file-type-icons",
    "wpdm-assets",
    "js_composer",
    "smile_fonts",
    "thwec_templates",
    "businesslounge",
    "memberships_csv_exports",
    "memberships_profile_fields",
    "smack_uci_uploads",
    "menus-exportimport",
    "useanyfont",
    "welaunch",
    "pgs-woo-api",
    "wpdesk-logs",
    "aioseo",
    "aioseo-logs",
    "backup",
    "rsssl",
    "mepr",
    "sim-wp-uploads",
    "sites",
    "download-manager-files",  # handled separately as member PDFs
}

PLUGIN_ARCHIVE_HINTS = re.compile(
    r"(codecanyon|woocommerce|businesslounge|plugin|theme|extensions|checkout|myaccount)",
    re.I,
)
JUNK_PDF_HINTS = re.compile(
    r"(license|codecanyon|nokri|screenshot|invoice|woocommerce)",
    re.I,
)

# Year folders whose filtered originals exceed this become a private photo archive zip
PHOTO_ARCHIVE_MIN_BYTES = 80 * 1024 * 1024  # 80 MB
# Or many files AND at least 40 MB (avoid tiny icon packs)
PHOTO_ARCHIVE_MIN_FILES = 40
PHOTO_ARCHIVE_MIN_BYTES_WITH_COUNT = 40 * 1024 * 1024
# With --all-photo-years: archive any year that has at least one kept original
# above this tiny floor (skips empty / icon-only folders).
PHOTO_ARCHIVE_ALL_YEARS_MIN_BYTES = 256 * 1024  # 256 KB


def is_size_variant(name: str) -> bool:
    return bool(SIZE_VARIANT.search(name))


def is_scaled(name: str) -> bool:
    return bool(SCALED.search(name))


def original_from_scaled(path: Path) -> Path:
    return path.with_name(SCALED.sub("", path.name))


def should_skip_dir(path: Path) -> bool:
    return any(part in SKIP_DIR_PARTS for part in path.parts)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:80] or "file"


def guess_year(path: Path, fallback: str = "misc") -> str:
    for part in path.parts:
        if re.fullmatch(r"20\d{2}", part):
            return part
    # filename hint
    m = re.search(r"(20\d{2})", path.name)
    if m:
        return m.group(1)
    try:
        return str(datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).year)
    except OSError:
        return fallback


def title_from_name(name: str) -> str:
    stem = Path(name).stem
    stem = stem.replace("_", " ").replace("-", " ")
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem[:120] or name


def filter_keep_images(files: list[Path]) -> tuple[list[Path], list[tuple[Path, str]]]:
    names = {p.resolve() for p in files}
    kept: list[Path] = []
    skipped: list[tuple[Path, str]] = []
    for f in files:
        name = f.name
        if is_size_variant(name):
            skipped.append((f, "wp-size-variant"))
            continue
        if is_scaled(name):
            original = original_from_scaled(f)
            # also try swapping extension variants
            candidates = [original]
            for ext in IMAGE_EXT:
                candidates.append(original.with_suffix(ext))
            if any(c.resolve() in names for c in candidates):
                skipped.append((f, "scaled-original-exists"))
                continue
        kept.append(f)
    return kept, skipped


def ensure_dir(path: Path, dry_run: bool) -> None:
    if dry_run:
        return
    path.mkdir(parents=True, exist_ok=True)


def copy_file(src: Path, dest: Path, dry_run: bool) -> None:
    ensure_dir(dest.parent, dry_run)
    if dry_run:
        print(f"  COPY {src} → {dest}")
        return
    if dest.exists() and dest.stat().st_size == src.stat().st_size:
        return
    shutil.copy2(src, dest)


def zip_files(sources: list[Path], zip_path: Path, root_for_arcname: Path, dry_run: bool) -> int:
    """Create zip of sources; returns total bytes of sources."""
    total = sum(p.stat().st_size for p in sources)
    if dry_run:
        print(f"  ZIP {len(sources)} files ({total} bytes) → {zip_path}")
        return total
    ensure_dir(zip_path.parent, dry_run=False)
    # Build file list for zip CLI (handles spaces)
    list_file = zip_path.with_suffix(".filelist.txt")
    with list_file.open("w", encoding="utf-8") as fh:
        for src in sources:
            rel = src.relative_to(root_for_arcname)
            fh.write(str(rel).replace("\\", "/") + "\n")
    try:
        # -@ reads names from stdin; we use -i@list via cwd
        subprocess.run(
            ["zip", "-q", "-r", "-@", str(zip_path)],
            cwd=str(root_for_arcname),
            input=list_file.read_text(encoding="utf-8"),
            text=True,
            check=True,
        )
    finally:
        if list_file.exists():
            list_file.unlink()
    return total


def collect_member_pdfs(uploads: Path) -> list[Path]:
    found: list[Path] = []
    # download-manager member files
    dm = uploads / "download-manager-files"
    if dm.is_dir():
        for p in dm.rglob("*"):
            if p.is_file() and p.suffix.lower() in PDF_EXT and p.name != ".htaccess":
                if not JUNK_PDF_HINTS.search(p.name):
                    found.append(p)
    # year folders
    for year_dir in sorted(uploads.glob("20*")):
        if not year_dir.is_dir():
            continue
        for p in year_dir.rglob("*.pdf"):
            if should_skip_dir(p.parent):
                continue
            if JUNK_PDF_HINTS.search(p.name):
                continue
            found.append(p)
    # de-dupe by name+size
    uniq: dict[tuple[str, int], Path] = {}
    for p in found:
        key = (p.name.lower(), p.stat().st_size)
        uniq[key] = p
    return sorted(uniq.values(), key=lambda p: p.name.lower())


def collect_existing_archives(uploads: Path) -> list[Path]:
    found: list[Path] = []
    for p in uploads.rglob("*"):
        if not p.is_file():
            continue
        if p.suffix.lower() not in ARCHIVE_EXT:
            continue
        if should_skip_dir(p.parent):
            continue
        if PLUGIN_ARCHIVE_HINTS.search(p.name):
            continue
        found.append(p)
    return found


def collect_year_images(uploads: Path) -> dict[str, list[Path]]:
    by_year: dict[str, list[Path]] = {}
    for year_dir in sorted(uploads.glob("20*")):
        if not year_dir.is_dir():
            continue
        year = year_dir.name
        images: list[Path] = []
        for p in year_dir.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix.lower() not in IMAGE_EXT:
                continue
            if should_skip_dir(p.parent):
                continue
            # skip .bk duplicates and woocommerce placeholders
            if ".bk." in p.name or p.name.endswith(".bk"):
                continue
            if p.name.startswith("woocommerce-placeholder"):
                continue
            # Prefer raster original over sibling .webp (photo.jpg.webp next to photo.jpg)
            if p.suffix.lower() == ".webp":
                stem = p.name[: -len(".webp")]
                if (p.parent / stem).exists():
                    continue
            images.append(p)
        kept, _skipped = filter_keep_images(images)
        by_year[year] = kept
    return by_year


def catalog_entry(
    *,
    lodge_slug: str,
    file_name: str,
    storage_path: str,
    storage_backend: str,
    size_bytes: int,
    year: str,
    kind: str,
) -> dict:
    base_slug = slugify(Path(file_name).stem)
    mime = {
        ".pdf": "application/pdf",
        ".zip": "application/zip",
        ".rar": "application/vnd.rar",
        ".7z": "application/x-7z-compressed",
    }.get(Path(file_name).suffix.lower(), "application/octet-stream")
    sort_order = int(f"{year}01") if year.isdigit() else 0
    title = title_from_name(file_name)
    if kind == "photo-archive":
        title = f"Photo archive — {year}"
    return {
        "slug": base_slug if kind != "photo-archive" else f"photos-{year}",
        "title": title,
        "description": f"Migrated from WordPress uploads ({kind}).",
        "file_name": file_name,
        "mime_type": mime,
        "size_bytes": size_bytes,
        "storage_backend": storage_backend,
        "storage_path": storage_path,
        "visibility": "members",
        "sort_order": sort_order,
    }


def migrate_lodge(
    wp_name: str,
    lodge_slug: str,
    dry_run: bool,
    skip_archives: bool,
    all_photo_years: bool = False,
) -> dict:
    uploads = WP_ROOT / wp_name / "wp-content" / "uploads"
    report: dict = {
        "wp": wp_name,
        "lodge_slug": lodge_slug,
        "uploads": str(uploads),
        "pdfs": [],
        "archives": [],
        "photo_archives": [],
        "stats": {},
        "errors": [],
    }
    if not uploads.is_dir():
        report["errors"].append(f"missing uploads: {uploads}")
        return report

    lodge_root = PRIVATE_ROOT / lodge_slug
    pdf_root = lodge_root / "pdfs"
    arch_root = lodge_root / "archives"
    ensure_dir(pdf_root, dry_run)
    ensure_dir(arch_root, dry_run)

    # --- PDFs ---
    pdfs = collect_member_pdfs(uploads)
    pdf_skipped_variants = 0  # N/A for pdf
    for src in pdfs:
        year = guess_year(src)
        dest_name = src.name.replace(" ", "-")
        # normalize double spaces / trailing dashes lightly
        dest_name = re.sub(r"-{2,}", "-", dest_name)
        storage_path = f"{lodge_slug}/pdfs/{year}/{dest_name}"
        dest = PRIVATE_ROOT / storage_path
        try:
            copy_file(src, dest, dry_run)
            size = src.stat().st_size
            entry = catalog_entry(
                lodge_slug=lodge_slug,
                file_name=dest_name,
                storage_path=storage_path,
                storage_backend="supabase",
                size_bytes=size,
                year=year,
                kind="pdf",
            )
            report["pdfs"].append({**entry, "source": str(src)})
        except Exception as exc:  # noqa: BLE001
            report["errors"].append(f"pdf {src}: {exc}")

    # --- Existing non-plugin archives ---
    for src in collect_existing_archives(uploads):
        year = guess_year(src)
        dest_name = src.name.replace(" ", "-")
        storage_path = f"{lodge_slug}/archives/{year}/{dest_name}"
        dest = PRIVATE_ROOT / storage_path
        try:
            copy_file(src, dest, dry_run)
            size = src.stat().st_size
            entry = catalog_entry(
                lodge_slug=lodge_slug,
                file_name=dest_name,
                storage_path=storage_path,
                storage_backend="local",
                size_bytes=size,
                year=year,
                kind="archive",
            )
            report["archives"].append({**entry, "source": str(src)})
        except Exception as exc:  # noqa: BLE001
            report["errors"].append(f"archive {src}: {exc}")

    # --- Photo packs: zip filtered originals per year when large ---
    images_skipped = 0
    images_kept = 0
    if not skip_archives:
        by_year = collect_year_images(uploads)
        for year, kept in by_year.items():
            images_kept += len(kept)
            # recount skipped roughly via walk
            raw = [
                p
                for p in (uploads / year).rglob("*")
                if p.is_file()
                and p.suffix.lower() in IMAGE_EXT
                and not should_skip_dir(p.parent)
                and not p.name.startswith("woocommerce-placeholder")
                and ".bk." not in p.name
            ]
            images_skipped += max(0, len(raw) - len(kept))
            total = sum(p.stat().st_size for p in kept)
            large = total >= PHOTO_ARCHIVE_MIN_BYTES
            many = len(kept) >= PHOTO_ARCHIVE_MIN_FILES and total >= PHOTO_ARCHIVE_MIN_BYTES_WITH_COUNT
            any_year = all_photo_years and len(kept) > 0 and total >= PHOTO_ARCHIVE_ALL_YEARS_MIN_BYTES
            if not (large or many or any_year):
                continue
            zip_name = f"{lodge_slug}-photos-{year}.zip"
            storage_path = f"{lodge_slug}/archives/{year}/{zip_name}"
            dest = PRIVATE_ROOT / storage_path
            try:
                if not dry_run and dest.exists() and dest.stat().st_size > 0:
                    # Keep existing filtered zip; still catalog it.
                    size = dest.stat().st_size
                    entry = catalog_entry(
                        lodge_slug=lodge_slug,
                        file_name=zip_name,
                        storage_path=storage_path,
                        storage_backend="local",
                        size_bytes=size,
                        year=year,
                        kind="photo-archive",
                    )
                    report["photo_archives"].append(
                        {**entry, "source_files": len(kept), "source_bytes": total, "reused": True}
                    )
                    continue
                zip_files(kept, dest, uploads / year, dry_run)
                size = dest.stat().st_size if dest.exists() and not dry_run else total
                entry = catalog_entry(
                    lodge_slug=lodge_slug,
                    file_name=zip_name,
                    storage_path=storage_path,
                    storage_backend="local",
                    size_bytes=size,
                    year=year,
                    kind="photo-archive",
                )
                report["photo_archives"].append(
                    {**entry, "source_files": len(kept), "source_bytes": total}
                )
            except Exception as exc:  # noqa: BLE001
                report["errors"].append(f"photo-archive {year}: {exc}")

    report["stats"] = {
        "pdf_count": len(report["pdfs"]),
        "archive_count": len(report["archives"]),
        "photo_archive_count": len(report["photo_archives"]),
        "images_kept_approx": images_kept,
        "images_variants_skipped_approx": images_skipped,
    }
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-archives", action="store_true", help="Skip building year photo zips")
    parser.add_argument(
        "--all-photo-years",
        action="store_true",
        help="Archive every year with kept originals (one large file per photo; skip WxH), not only large packs",
    )
    parser.add_argument(
        "--private-root",
        default=str(DEFAULT_PRIVATE_ROOT),
        help="PRIVATE_MEDIA_ROOT on Hostinger",
    )
    parser.add_argument(
        "--report",
        default="",
        help="Write JSON report here (default: <private-root>/migration-report.json)",
    )
    args = parser.parse_args()

    global PRIVATE_ROOT
    PRIVATE_ROOT = Path(args.private_root).expanduser().resolve()
    report_out = Path(args.report) if args.report else PRIVATE_ROOT / "migration-report.json"

    print(f"WP_ROOT={WP_ROOT}")
    print(f"PRIVATE_MEDIA_ROOT={PRIVATE_ROOT}")
    print(
        f"dry_run={args.dry_run} skip_archives={args.skip_archives} all_photo_years={args.all_photo_years}"
    )
    print("Photo rule: one large original per image (skip -WxH; prefer original over -scaled)")
    print("")

    ensure_dir(PRIVATE_ROOT, args.dry_run)
    reports = []
    catalogs: dict[str, dict] = {}

    for wp_name, lodge_slug in LODGES.items():
        print(f"======== {wp_name} → {lodge_slug} ========")
        report = migrate_lodge(
            wp_name,
            lodge_slug,
            args.dry_run,
            args.skip_archives,
            all_photo_years=args.all_photo_years,
        )
        reports.append(report)
        print(json.dumps(report["stats"], indent=2))
        if report["errors"]:
            print("errors:", report["errors"][:5])
        files = []
        seen_paths: set[str] = set()
        for row in report["pdfs"] + report["archives"] + report["photo_archives"]:
            sp = row.get("storage_path")
            if sp in seen_paths:
                continue
            seen_paths.add(sp)
            files.append(
                {k: row[k] for k in row if k not in {"source", "source_files", "source_bytes", "reused"}}
            )
        catalogs[lodge_slug] = {"lodge_slug": lodge_slug, "files": files}
        print("")

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "private_media_root": str(PRIVATE_ROOT),
        "lodges": reports,
        "catalogs": catalogs,
    }
    if not args.dry_run:
        ensure_dir(report_out.parent, dry_run=False)
        report_out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        # also write per-lodge catalog snapshots next to private-media
        cat_dir = PRIVATE_ROOT / "_catalogs"
        ensure_dir(cat_dir, dry_run=False)
        for slug, cat in catalogs.items():
            (cat_dir / f"{slug}.json").write_text(json.dumps(cat, indent=2), encoding="utf-8")
        print(f"Wrote report → {report_out}")
        print(f"Wrote catalogs → {cat_dir}")
    else:
        print(json.dumps({"catalogs_preview": {k: len(v["files"]) for k, v in catalogs.items()}}, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
