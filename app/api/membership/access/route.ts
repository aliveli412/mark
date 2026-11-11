import { NextResponse } from "next/server";
import { getMembershipByAccess, getMembershipRoster } from "@/lib/data/memberships";
import { getMarkSite } from "@/lib/mark-sites";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { lodge_slug?: string; email?: string; access_code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lodgeSlug = String(body.lodge_slug ?? "").trim();
  if (!getMarkSite(lodgeSlug)) {
    return NextResponse.json({ error: "Unknown lodge site." }, { status: 404 });
  }

  const membership = await getMembershipByAccess(
    lodgeSlug,
    String(body.email ?? ""),
    String(body.access_code ?? ""),
  );
  if (!membership) {
    return NextResponse.json({ error: "No membership found for that email and access code." }, { status: 404 });
  }
  const roster = await getMembershipRoster(membership);
  return NextResponse.json({ membership, roster });
}
