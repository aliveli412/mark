import { NextResponse } from "next/server";
import { getMembershipById, markStandingOrderRequested } from "@/lib/data/memberships";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { membershipId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const membershipId = String(body.membershipId ?? "");
  const membership = await getMembershipById(membershipId);
  if (!membership) return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  if (membership.status === "pending_match") {
    return NextResponse.json({ error: "Membership must be matched before requesting a standing order." }, { status: 403 });
  }

  const result = await markStandingOrderRequested(membershipId);
  if (result.error || !result.membership) {
    return NextResponse.json({ error: result.error || "Update failed." }, { status: 400 });
  }
  return NextResponse.json({ membership: result.membership });
}
