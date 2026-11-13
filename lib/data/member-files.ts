import { createReadStream, existsSync, readFileSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { LodgeMemberFile, LodgeMembership, MemberFileVisibility } from "@/lib/types";

const BUCKET = "member-files";

function usingLive() {
  return getSupabaseEnv().configured && Boolean(createSupabaseAdminClient());
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function privateMediaRoot() {
  const configured = process.env.PRIVATE_MEDIA_ROOT?.trim();
  if (configured) return configured;
  return path.join(process.cwd(), "private-media");
}

function loadSeedFiles(lodgeSlug: string): LodgeMemberFile[] {
  const filePath = path.join(process.cwd(), "content", "member-files", `${seedKey(lodgeSlug)}.json`);
  if (!existsSync(filePath)) return [];
  const payload = JSON.parse(readFileSync(filePath, "utf8")) as {
    files?: Array<Record<string, unknown>>;
  };
  return (payload.files ?? []).map((item, index) => ({
    id: `seed-${lodgeSlug}-${String(item.slug ?? index)}`,
    lodge_slug: lodgeSlug,
    slug: String(item.slug ?? `file-${index}`),
    title: String(item.title ?? "Member file"),
    description: String(item.description ?? ""),
    file_name: String(item.file_name ?? "file.bin"),
    mime_type: String(item.mime_type ?? "application/octet-stream"),
    size_bytes: Number(item.size_bytes ?? 0),
    storage_backend: item.storage_backend === "supabase" ? "supabase" : "local",
    storage_path: String(item.storage_path ?? ""),
    visibility: (String(item.visibility ?? "members") as MemberFileVisibility) || "members",
    sort_order: Number(item.sort_order ?? index * 10),
    download_count: Number(item.download_count ?? 0),
    active: item.active !== false,
    created_at: new Date().toISOString(),
  }));
}

function seedKey(lodgeSlug: string) {
  if (lodgeSlug === "freemasons-without-borders") return "fwb";
  return lodgeSlug;
}

type MockState = { files: LodgeMemberFile[] };
const g = globalThis as typeof globalThis & { __mmmMemberFilesMock?: MockState };

function mock(): MockState {
  if (!g.__mmmMemberFilesMock) {
    g.__mmmMemberFilesMock = {
      files: [
        ...loadSeedFiles("freemasons-without-borders"),
        ...loadSeedFiles("gallipoli"),
        ...loadSeedFiles("namik-kemal"),
        ...loadSeedFiles("anadolu"),
        ...loadSeedFiles("ata"),
        ...loadSeedFiles("khalsa"),
      ],
    };
  }
  return g.__mmmMemberFilesMock;
}

function canAccess(visibility: MemberFileVisibility, membership: LodgeMembership) {
  if (membership.status === "cancelled") return false;
  if (visibility === "active") return membership.status === "active";
  if (visibility === "matched") {
    return membership.status === "matched" || membership.status === "active" || membership.status === "past_due";
  }
  // members = any registered membership for the lodge except cancelled
  return true;
}

export function formatBytes(bytes: number) {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function listMemberFiles(lodgeSlug: string) {
  if (!usingLive()) {
    return mock()
      .files.filter((item) => item.lodge_slug === lodgeSlug && item.active)
      .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
  }
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase
    .from("lodge_member_files")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .eq("active", true)
    .order("sort_order")
    .order("title");
  return (data ?? []) as LodgeMemberFile[];
}

export async function getMemberFile(lodgeSlug: string, fileId: string) {
  if (!usingLive()) {
    return (
      mock().files.find(
        (item) => item.lodge_slug === lodgeSlug && (item.id === fileId || item.slug === fileId) && item.active,
      ) ?? null
    );
  }
  const supabase = createSupabaseAdminClient()!;
  const byId = await supabase
    .from("lodge_member_files")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .eq("id", fileId)
    .eq("active", true)
    .maybeSingle();
  if (byId.data) return byId.data as LodgeMemberFile;
  const bySlug = await supabase
    .from("lodge_member_files")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .eq("slug", fileId)
    .eq("active", true)
    .maybeSingle();
  return (bySlug.data as LodgeMemberFile | null) ?? null;
}

export async function bumpDownloadCount(file: LodgeMemberFile) {
  if (!usingLive()) {
    const item = mock().files.find((row) => row.id === file.id);
    if (item) item.download_count += 1;
    return;
  }
  const supabase = createSupabaseAdminClient()!;
  await supabase
    .from("lodge_member_files")
    .update({ download_count: file.download_count + 1, updated_at: new Date().toISOString() })
    .eq("id", file.id);
}

export function assertMembershipCanDownload(file: LodgeMemberFile, membership: LodgeMembership | null) {
  if (!membership || membership.lodge_slug !== file.lodge_slug) {
    return { error: "Sign in to your lodge membership to download this file.", status: 401 as const };
  }
  if (!canAccess(file.visibility, membership)) {
    return { error: "Your membership status does not allow this download yet.", status: 403 as const };
  }
  return { ok: true as const };
}

export async function openMemberFileStream(file: LodgeMemberFile): Promise<
  | { error: string; status: number }
  | {
      kind: "redirect";
      url: string;
    }
  | {
      kind: "stream";
      stream: ReadableStream | Readable;
      contentType: string;
      contentLength?: number;
      fileName: string;
    }
> {
  if (file.storage_backend === "supabase") {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return {
        error: "Supabase is not configured for private file downloads. Use local storage or add service role key.",
        status: 503,
      };
    }
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 60 * 10);
    if (error || !data?.signedUrl) {
      return { error: error?.message || "Could not create a secure download link.", status: 404 };
    }
    return { kind: "redirect", url: data.signedUrl };
  }

  // local / Hostinger private disk
  const absolute = path.resolve(privateMediaRoot(), file.storage_path);
  const root = path.resolve(privateMediaRoot());
  if (!absolute.startsWith(root + path.sep) && absolute !== root) {
    return { error: "Invalid file path.", status: 400 };
  }
  if (!existsSync(absolute)) {
    return {
      error: `File is not on disk yet. Place it at private-media/${file.storage_path} (or upload to Supabase for small PDFs).`,
      status: 404,
    };
  }
  const stat = statSync(absolute);
  const nodeStream = createReadStream(absolute);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;
  return {
    kind: "stream",
    stream: webStream,
    contentType: file.mime_type || "application/octet-stream",
    contentLength: stat.size,
    fileName: file.file_name,
  };
}

/** Dev helper: ensure a file metadata row exists in mock store. */
export function ensureMockMemberFile(input: Omit<LodgeMemberFile, "id" | "created_at" | "download_count"> & {
  id?: string;
  download_count?: number;
}) {
  const store = mock();
  const existing = store.files.find((item) => item.lodge_slug === input.lodge_slug && item.slug === input.slug);
  if (existing) return existing;
  const created: LodgeMemberFile = {
    id: input.id || id("file"),
    created_at: new Date().toISOString(),
    download_count: input.download_count ?? 0,
    ...input,
  };
  store.files.push(created);
  return created;
}
