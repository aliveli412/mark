#!/usr/bin/env node
/**
 * Prepare private-media tree for local smoke / Hostinger layout.
 *
 * - Creates lodge/pdfs + lodge/archives folders
 * - Copies placeholder PDF + RAR stubs from content/member-files/seeds/
 * - Does NOT upload to Supabase (run SQL + Dashboard upload separately)
 *
 * Usage:
 *   npm run seed:private-media
 *   PRIVATE_MEDIA_ROOT=/absolute/path npm run seed:private-media
 *   node scripts/seed-private-media.mjs --check
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "private-media", "MANIFEST.json");
const checkOnly = process.argv.includes("--check");

function mediaRoot() {
  const configured = process.env.PRIVATE_MEDIA_ROOT?.trim();
  if (configured) return path.resolve(configured);
  return path.join(root, "private-media");
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  const keep = path.join(dir, ".gitkeep");
  if (!existsSync(keep)) writeFileSync(keep, "");
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const destRoot = mediaRoot();

console.log(checkOnly ? "Checking private media…" : "Seeding private media…");
console.log(`PRIVATE_MEDIA_ROOT → ${destRoot}`);
console.log("");

let missing = 0;
let copied = 0;

for (const lodge of manifest.lodges) {
  for (const folder of lodge.folders ?? ["pdfs", "archives"]) {
    ensureDir(path.join(destRoot, lodge.slug, folder));
    if (!checkOnly) {
      console.log(`· folder   ${lodge.slug}/${folder}`);
    }
  }

  for (const file of lodge.files ?? []) {
    const dest = path.join(destRoot, file.local_disk_path);
    ensureDir(path.dirname(dest));

    if (checkOnly) {
      if (!existsSync(dest)) {
        console.log(`✗ MISSING  ${file.local_disk_path}`);
        missing += 1;
      } else {
        const size = statSync(dest).size;
        console.log(`✓ present  ${file.local_disk_path} (${size} bytes) [${file.production_backend}]`);
      }
      continue;
    }

    if (!file.seed_source) {
      console.log(`· skip     ${file.local_disk_path} (no seed_source)`);
      continue;
    }

    const source = path.join(root, file.seed_source);
    if (!existsSync(source)) {
      console.log(`✗ seed missing: ${file.seed_source}`);
      missing += 1;
      continue;
    }

    copyFileSync(source, dest);
    copied += 1;
    console.log(`→ copied   ${file.seed_source}`);
    console.log(`           → ${file.local_disk_path}`);
  }
}

console.log("");
if (checkOnly) {
  if (missing) {
    console.log(`${missing} file(s) missing. Run: npm run seed:private-media`);
    process.exitCode = 1;
  } else {
    console.log("All expected private files are present.");
  }
} else {
  console.log(`Done. Copied ${copied} placeholder file(s).`);
  console.log("");
  console.log("Next:");
  console.log("  1. Local: sign in as member → Downloads (PDF uses disk fallback without Supabase).");
  console.log("  2. Production PDF: upload real file to Supabase bucket member-files at the storage_path.");
  console.log("  3. Production RAR: replace placeholder on Hostinger under PRIVATE_MEDIA_ROOT.");
  console.log("  4. Metadata SQL: supabase/member-files.sql then supabase/seed-member-files.sql");
  console.log("  5. Verify: npm run seed:private-media -- --check");
}
