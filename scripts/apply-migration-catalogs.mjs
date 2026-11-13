#!/usr/bin/env node
/**
 * Apply Hostinger migration-report.json / _catalogs into content/member-files/*.json
 * and generate supabase/seed-member-files-all.sql
 *
 * Usage:
 *   node scripts/apply-migration-catalogs.mjs /path/to/migration-report.json
 *   node scripts/apply-migration-catalogs.mjs /path/to/_catalogs
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const SEED_KEY = {
  "freemasons-without-borders": "fwb",
};

function seedFileName(lodgeSlug) {
  return `${SEED_KEY[lodgeSlug] ?? lodgeSlug}.json`;
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function loadCatalogs(inputPath) {
  const abs = path.resolve(inputPath);
  if (!existsSync(abs)) {
    throw new Error(`Not found: ${abs}`);
  }
  if (statSync(abs).isDirectory()) {
    const catalogs = {};
    for (const name of readdirSync(abs)) {
      if (!name.endsWith(".json")) continue;
      const payload = JSON.parse(readFileSync(path.join(abs, name), "utf8"));
      const slug = payload.lodge_slug ?? path.basename(name, ".json");
      catalogs[slug] = payload;
    }
    return catalogs;
  }
  const report = JSON.parse(readFileSync(abs, "utf8"));
  if (report.catalogs) return report.catalogs;
  throw new Error("Input JSON has no catalogs map");
}

function mergePreserveManual(existing, incoming) {
  const bySlug = new Map();
  for (const row of existing.files ?? []) {
    bySlug.set(row.slug, row);
  }
  for (const row of incoming.files ?? []) {
    bySlug.set(row.slug, row);
  }
  // Keep consecration rar placeholder entry if migration did not find the rar
  return {
    lodge_slug: incoming.lodge_slug ?? existing.lodge_slug,
    files: [...bySlug.values()].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };
}

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/apply-migration-catalogs.mjs <migration-report.json|_catalogs-dir>");
  process.exit(1);
}

const catalogs = loadCatalogs(input);
const outDir = path.join(root, "content", "member-files");
mkdirSync(outDir, { recursive: true });

const sqlRows = [];

for (const [slug, cat] of Object.entries(catalogs)) {
  const outName = seedFileName(slug);
  const outPath = path.join(outDir, outName);
  let existing = { lodge_slug: slug, files: [] };
  if (existsSync(outPath)) {
    existing = JSON.parse(readFileSync(outPath, "utf8"));
  }
  const merged = mergePreserveManual(existing, cat);
  // Drop empty notes-only placeholder
  delete merged.notes;
  writeFileSync(outPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`→ ${outName} (${merged.files.length} files)`);

  for (const f of merged.files) {
    sqlRows.push(`  (
    '${sqlEscape(slug)}',
    '${sqlEscape(f.slug)}',
    '${sqlEscape(f.title)}',
    '${sqlEscape(f.description ?? "")}',
    '${sqlEscape(f.file_name)}',
    '${sqlEscape(f.mime_type)}',
    ${Number(f.size_bytes) || 0},
    '${sqlEscape(f.storage_backend)}',
    '${sqlEscape(f.storage_path)}',
    '${sqlEscape(f.visibility ?? "members")}',
    ${Number(f.sort_order) || 0},
    true
  )`);
  }
}

const sqlPath = path.join(root, "supabase", "seed-member-files-all.sql");
const sql = `-- Auto-generated from WP migration catalogs. Safe to re-run (upsert).
-- Prerequisites: supabase/member-files.sql + private bucket member-files
-- PDFs: upload objects to Storage at storage_path (or rely on PRIVATE_MEDIA_ROOT disk fallback)
-- Archives: already on Hostinger under PRIVATE_MEDIA_ROOT

insert into public.lodge_member_files (
  lodge_slug,
  slug,
  title,
  description,
  file_name,
  mime_type,
  size_bytes,
  storage_backend,
  storage_path,
  visibility,
  sort_order,
  active
) values
${sqlRows.join(",\n")}
on conflict (lodge_slug, slug) do update set
  title = excluded.title,
  description = excluded.description,
  file_name = excluded.file_name,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  storage_backend = excluded.storage_backend,
  storage_path = excluded.storage_path,
  visibility = excluded.visibility,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();
`;
writeFileSync(sqlPath, sql, "utf8");
console.log(`→ supabase/seed-member-files-all.sql (${sqlRows.length} rows)`);
