#!/usr/bin/env node
/**
 * Upload migrated member PDFs from PRIVATE_MEDIA_ROOT (or a local copy) to
 * Supabase Storage bucket `member-files`.
 *
 * Requires Cloud Agent / env secrets:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   PRIVATE_MEDIA_ROOT=/path node scripts/upload-member-pdfs-to-supabase.mjs
 *   PRIVATE_MEDIA_ROOT=/path node scripts/upload-member-pdfs-to-supabase.mjs --dry-run
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");
const BUCKET = "member-files";

function mediaRoot() {
  const configured = process.env.PRIVATE_MEDIA_ROOT?.trim();
  if (configured) return path.resolve(configured);
  return path.join(root, "private-media");
}

function walkPdfs(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name.startsWith("_")) continue;
      walkPdfs(full, out);
    } else if (name.toLowerCase().endsWith(".pdf")) {
      out.push(full);
    }
  }
  return out;
}

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  console.error("Add them under Cursor → Cloud Agents → Secrets, then re-run.");
  process.exit(1);
}

const base = mediaRoot();
const pdfs = walkPdfs(base).filter((p) => p.includes(`${path.sep}pdfs${path.sep}`));
console.log(`PRIVATE_MEDIA_ROOT=${base}`);
console.log(`Found ${pdfs.length} PDF(s)`);

if (dryRun) {
  for (const file of pdfs) {
    const objectPath = path.relative(base, file).split(path.sep).join("/");
    console.log(`DRY  ${objectPath}`);
  }
  process.exit(0);
}

let ok = 0;
let fail = 0;
for (const file of pdfs) {
  const objectPath = path.relative(base, file).split(path.sep).join("/");
  const body = readFileSync(file);
  const endpoint = `${url.replace(/\/$/, "")}/storage/v1/object/${BUCKET}/${objectPath}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`✗ ${objectPath} → ${res.status} ${text.slice(0, 200)}`);
    fail += 1;
  } else {
    console.log(`✓ ${objectPath}`);
    ok += 1;
  }
}

console.log(`Done. uploaded=${ok} failed=${fail}`);
process.exit(fail ? 1 : 0);
