#!/usr/bin/env node
/**
 * WordPress creates many resized copies per photo:
 *   photo.jpg, photo-150x150.jpg, photo-300x300.jpg, photo-768x1024.jpg, photo-scaled.jpg
 *
 * Rule for migration: keep ONE large file per image — the original basename.
 * Skip all -WIDTHxHEIGHT variants. Prefer original over -scaled when both exist.
 *
 * Usage:
 *   node scripts/filter-wp-media.mjs /path/to/wp-uploads [--copy-to /dest]
 *   find . -type f | node scripts/filter-wp-media.mjs --stdin
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";

const SIZE_VARIANT = /-\d+x\d+(?=\.[^.]+$)/i;
const SCALED = /-scaled(?=\.[^.]+$)/i;
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif)$/i;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function isSizeVariant(filePath) {
  return IMAGE_EXT.test(filePath) && SIZE_VARIANT.test(path.basename(filePath));
}

function isScaled(filePath) {
  return IMAGE_EXT.test(filePath) && SCALED.test(path.basename(filePath));
}

function originalFromScaled(filePath) {
  const base = path.basename(filePath).replace(SCALED, "");
  return path.join(path.dirname(filePath), base);
}

function filterKeep(files) {
  const set = new Set(files.map((f) => path.resolve(f)));
  const kept = [];
  const skipped = [];

  for (const file of files) {
    const abs = path.resolve(file);
    const base = path.basename(abs);

    if (isSizeVariant(abs)) {
      skipped.push({ file: abs, reason: "wp-size-variant" });
      continue;
    }

    if (isScaled(abs)) {
      const original = originalFromScaled(abs);
      if (set.has(path.resolve(original))) {
        skipped.push({ file: abs, reason: "scaled-original-exists" });
        continue;
      }
      // no original on disk — keep the scaled as the one large copy
    }

    // non-images (pdf/zip/rar/…) always kept
    kept.push(abs);
  }

  return { kept, skipped };
}

function readStdinLines() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(
        data
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
      );
    });
  });
}

const args = process.argv.slice(2);
const stdinMode = args.includes("--stdin");
const copyIdx = args.indexOf("--copy-to");
const copyTo = copyIdx >= 0 ? args[copyIdx + 1] : null;
const root = args.find((a, i) => !a.startsWith("--") && (copyIdx < 0 || i !== copyIdx + 1));

const files = stdinMode
  ? await readStdinLines()
  : root
    ? walk(path.resolve(root))
    : [];

if (!files.length) {
  console.error("Usage: node scripts/filter-wp-media.mjs <dir> [--copy-to dest]");
  console.error("   or: find . -type f | node scripts/filter-wp-media.mjs --stdin");
  process.exit(1);
}

const { kept, skipped } = filterKeep(files);

console.log(`# WP media filter`);
console.log(`# input=${files.length} keep=${kept.length} skip=${skipped.length}`);
console.log(`# rule=skip -WxH variants; one large file per photo (prefer original over -scaled)`);
console.log("");

for (const file of kept) {
  console.log(`KEEP\t${file}`);
  if (copyTo) {
    const rel = root ? path.relative(path.resolve(root), file) : path.basename(file);
    const dest = path.join(copyTo, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(file, dest);
  }
}

if (process.env.VERBOSE === "1") {
  console.log("");
  for (const row of skipped) {
    console.log(`SKIP\t${row.reason}\t${row.file}`);
  }
}
