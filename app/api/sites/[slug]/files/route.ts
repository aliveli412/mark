import { NextResponse } from "next/server";
import { formatBytes, listMemberFiles } from "@/lib/data/member-files";
import { getDownloadMembership } from "@/lib/member-files-auth";
import { getMarkSite } from "@/lib/mark-sites";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!getMarkSite(slug)) {
    return NextResponse.json({ error: "Unknown lodge site." }, { status: 404 });
  }

  const membership = await getDownloadMembership(slug);
  if (!membership) {
    return NextResponse.json({ error: "Sign in required.", files: [] }, { status: 401 });
  }

  const files = await listMemberFiles(slug);
  return NextResponse.json({
    files: files.map((file) => ({
      id: file.id,
      slug: file.slug,
      title: file.title,
      description: file.description,
      file_name: file.file_name,
      mime_type: file.mime_type,
      size_bytes: file.size_bytes,
      size_label: formatBytes(file.size_bytes),
      storage_backend: file.storage_backend,
      download_count: file.download_count,
      download_url: `/api/sites/${slug}/files/${encodeURIComponent(file.id)}/download`,
    })),
  });
}
