import { createHash, randomBytes } from "crypto";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "fs";
import path from "path";

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
const MAX_BYTES = 8 * 1024 * 1024;

export type NewsMediaItem = {
  path: string;
  name: string;
  size: number;
  modified_at: string;
};

function mediaDir() {
  return path.join(process.cwd(), "public", "news", "media");
}

export function listNewsMedia(): NewsMediaItem[] {
  const dir = mediaDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => ALLOWED_EXT.has(path.extname(name).toLowerCase()))
    .map((name) => {
      const full = path.join(dir, name);
      const st = statSync(full);
      return {
        path: `/news/media/${name}`,
        name,
        size: st.size,
        modified_at: st.mtime.toISOString(),
      };
    })
    .sort((a, b) => b.modified_at.localeCompare(a.modified_at));
}

function safeExt(filename: string) {
  const ext = path.extname(filename || "").toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : "";
}

export function saveNewsMediaUpload(file: {
  name: string;
  type?: string;
  data: Buffer;
}): { ok: true; item: NewsMediaItem } | { ok: false; error: string } {
  if (!file.data?.length) return { ok: false, error: "Empty file." };
  if (file.data.length > MAX_BYTES) return { ok: false, error: "File too large (max 8MB)." };

  const ext = safeExt(file.name);
  if (!ext) return { ok: false, error: "Only jpg, png, gif, webp or svg images are allowed." };

  const dir = mediaDir();
  mkdirSync(dir, { recursive: true });

  const digest = createHash("sha1")
    .update(file.data)
    .update(randomBytes(4))
    .digest("hex")
    .slice(0, 16);
  const filename = `${digest}${ext}`;
  const full = path.join(dir, filename);
  writeFileSync(full, file.data);

  const st = statSync(full);
  return {
    ok: true,
    item: {
      path: `/news/media/${filename}`,
      name: filename,
      size: st.size,
      modified_at: st.mtime.toISOString(),
    },
  };
}
