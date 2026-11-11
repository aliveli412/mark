import { NextResponse } from "next/server";
import { registerMembership } from "@/lib/data/memberships";
import { getMarkSite } from "@/lib/mark-sites";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { lodge_slug?: string; full_name?: string; email?: string; membership_no?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lodgeSlug = String(body.lodge_slug ?? "").trim();
  if (!getMarkSite(lodgeSlug)) {
    return NextResponse.json({ error: "Unknown lodge site." }, { status: 404 });
  }

  const result = await registerMembership({
    lodge_slug: lodgeSlug,
    full_name: String(body.full_name ?? ""),
    email: String(body.email ?? ""),
    membership_no: String(body.membership_no ?? ""),
  });

  if (result.error || !result.membership) {
    return NextResponse.json({ error: result.error || "Registration failed." }, { status: 400 });
  }

  return NextResponse.json({
    membership: result.membership,
    matched: result.matched,
  });
}
