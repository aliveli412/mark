import { NextResponse } from "next/server";
import { getMembershipDashboard, signInWithMembershipAccess } from "@/lib/data/memberships";
import { setMemberSession } from "@/lib/member-session";
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

  const email = String(body.email ?? "");
  const accessCode = String(body.access_code ?? "");
  const result = await signInWithMembershipAccess(lodgeSlug, email, accessCode);
  if (result.error || !result.membership) {
    return NextResponse.json(
      { error: result.error || "No membership found for that email and access code." },
      { status: 404 },
    );
  }

  const membership = result.membership;
  await setMemberSession({
    lodgeSlug,
    membershipId: membership.id,
    email: membership.email,
    accessCode: membership.access_code,
  });

  const dashboard = await getMembershipDashboard(membership.id);
  if ("error" in dashboard) {
    return NextResponse.json({ membership, roster: result.roster ?? null, created: result.created });
  }
  return NextResponse.json({ ...dashboard, created: result.created });
}
