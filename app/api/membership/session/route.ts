import { NextResponse } from "next/server";
import { clearMemberSession, readMemberSession } from "@/lib/member-session";
import { getMembershipDashboard } from "@/lib/data/memberships";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readMemberSession();
  if (!session) return NextResponse.json({ session: null });
  const dashboard = await getMembershipDashboard(session.membershipId);
  if ("error" in dashboard) {
    await clearMemberSession();
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({ session, ...dashboard });
}

export async function DELETE() {
  await clearMemberSession();
  return NextResponse.json({ ok: true });
}
