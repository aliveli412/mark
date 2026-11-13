import { NextResponse } from "next/server";
import {
  getMembershipByAccess,
  listAddressChangeRequests,
  requestMemberAddressChange,
} from "@/lib/data/memberships";
import { readMemberSession } from "@/lib/member-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const ok = await getMembershipByAccess(session.lodgeSlug, session.email, session.accessCode);
  if (!ok || ok.id !== session.membershipId) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  const requests = await listAddressChangeRequests(session.lodgeSlug, {
    membershipId: session.membershipId,
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await readMemberSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to request an address change." }, { status: 401 });
  }

  const ok = await getMembershipByAccess(session.lodgeSlug, session.email, session.accessCode);
  if (!ok || ok.id !== session.membershipId) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await requestMemberAddressChange(
    session.membershipId,
    {
      address: String(body.address ?? ""),
      address2: String(body.address2 ?? ""),
      address3: String(body.address3 ?? ""),
      city: String(body.city ?? ""),
      county: String(body.county ?? ""),
      postcode: String(body.postcode ?? ""),
      country: String(body.country ?? ""),
    },
    String(body.member_note ?? body.note ?? ""),
  );

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
