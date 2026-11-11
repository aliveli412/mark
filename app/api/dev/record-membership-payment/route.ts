import { NextResponse } from "next/server";
import { recordMembershipPayment } from "@/lib/data/memberships";
import type { MembershipPaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Local/cloud demo helper — disabled in production builds served publicly. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_MEMBERSHIP_DEMO !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    membership_id?: string;
    year?: number;
    amount_pence?: number;
    method?: MembershipPaymentMethod;
    paid_on?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await recordMembershipPayment({
    membership_id: String(body.membership_id ?? ""),
    year: Number(body.year ?? 0),
    amount_pence: Number(body.amount_pence ?? 0),
    method: body.method ?? "bank",
    paid_on: body.paid_on ?? null,
    note: body.note ?? "Demo / admin historical payment",
    recorded_by: "super_admin_demo",
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
