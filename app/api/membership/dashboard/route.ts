import { NextResponse } from "next/server";
import { getMembershipByAccess, getMembershipDashboard } from "@/lib/data/memberships";
import { readMemberSession } from "@/lib/member-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const membershipId = String(searchParams.get("membershipId") ?? "").trim();
  const session = await readMemberSession();

  const id = membershipId || session?.membershipId || "";
  if (!id) {
    return NextResponse.json({ error: "Sign in to open your membership dashboard." }, { status: 401 });
  }

  if (session?.membershipId && membershipId && session.membershipId !== membershipId) {
    // Allow only if access still validates for that membership via session email/code.
    const membership = await getMembershipByAccess(session.lodgeSlug, session.email, session.accessCode);
    if (!membership || membership.id !== membershipId) {
      return NextResponse.json({ error: "Not authorized for that membership." }, { status: 403 });
    }
  }

  const result = await getMembershipDashboard(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  // If cookie session exists, ensure it matches.
  if (session?.membershipId === id) {
    const ok = await getMembershipByAccess(session.lodgeSlug, session.email, session.accessCode);
    if (!ok) return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  return NextResponse.json(result);
}
