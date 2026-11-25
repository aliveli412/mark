import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { listNewsMedia, saveNewsMediaUpload } from "@/lib/news-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  return NextResponse.json({ items: listNewsMedia() });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = saveNewsMediaUpload({
    name: file.name,
    type: file.type,
    data: buffer,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ item: result.item });
}
