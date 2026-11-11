import { NextResponse } from "next/server";
import {
  assertMembershipCanDownload,
  bumpDownloadCount,
  getMemberFile,
  openMemberFileStream,
} from "@/lib/data/member-files";
import { getDownloadMembership } from "@/lib/member-files-auth";
import { getMarkSite } from "@/lib/mark-sites";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; fileId: string }> },
) {
  const { slug, fileId } = await context.params;
  if (!getMarkSite(slug)) {
    return NextResponse.json({ error: "Unknown lodge site." }, { status: 404 });
  }

  const membership = await getDownloadMembership(slug);
  if (!membership) {
    return NextResponse.json({ error: "Sign in to download member files." }, { status: 401 });
  }

  const file = await getMemberFile(slug, decodeURIComponent(fileId));
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const access = assertMembershipCanDownload(file, membership);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const opened = await openMemberFileStream(file);
  if ("error" in opened) {
    return NextResponse.json({ error: opened.error }, { status: opened.status });
  }

  await bumpDownloadCount(file);

  if (opened.kind === "redirect") {
    return NextResponse.redirect(opened.url, 302);
  }

  const headers = new Headers();
  headers.set("Content-Type", opened.contentType);
  headers.set("Content-Disposition", `attachment; filename="${opened.fileName.replace(/"/g, "")}"`);
  if (opened.contentLength != null) headers.set("Content-Length", String(opened.contentLength));
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(opened.stream as BodyInit, { status: 200, headers });
}
