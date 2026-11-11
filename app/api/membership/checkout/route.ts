import { NextResponse } from "next/server";
import {
  attachMembershipCheckout,
  getMembershipById,
  getMembershipSettings,
  planAmount,
  planLabel,
} from "@/lib/data/memberships";
import { getSiteUrl, getStripe, getStripeConfig } from "@/lib/stripe";
import type { MembershipPlan } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ stripeConfigured: getStripeConfig().configured });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 503 },
    );
  }

  let body: { membershipId?: string; plan?: MembershipPlan };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const membershipId = String(body.membershipId ?? "");
  const plan = body.plan;
  if (!membershipId || !plan || !["monthly", "yearly", "standing_order"].includes(plan)) {
    return NextResponse.json({ error: "membershipId and a valid plan are required." }, { status: 400 });
  }

  const membership = await getMembershipById(membershipId);
  if (!membership) return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  if (membership.status !== "matched" && membership.status !== "active" && membership.status !== "past_due") {
    return NextResponse.json(
      { error: "Your details are not on the lodge member list yet. An admin must match you first." },
      { status: 403 },
    );
  }

  const settings = await getMembershipSettings(membership.lodge_slug);
  if (!settings.active) {
    return NextResponse.json({ error: "Membership payments are not active for this lodge." }, { status: 403 });
  }

  const amount = planAmount(settings, plan);
  if (amount <= 0) return NextResponse.json({ error: "Plan price is not configured." }, { status: 400 });

  const siteUrl = getSiteUrl(request);
  const interval = plan === "yearly" ? "year" : "month";
  const productName = `${membership.lodge_slug} membership · ${planLabel(plan)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: membership.email,
      success_url: `${siteUrl}/sites/${membership.lodge_slug}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/sites/${membership.lodge_slug}/membership?code=${membership.access_code}&email=${encodeURIComponent(membership.email)}`,
      metadata: {
        kind: "lodge_membership",
        membership_id: membership.id,
        lodge_slug: membership.lodge_slug,
        plan,
      },
      subscription_data: {
        metadata: {
          kind: "lodge_membership",
          membership_id: membership.id,
          lodge_slug: membership.lodge_slug,
          plan,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: settings.currency || "gbp",
            unit_amount: amount,
            recurring: { interval },
            product_data: {
              name: productName,
              description: `Lodge dues for ${membership.full_name}`,
            },
          },
        },
      ],
    });

    await attachMembershipCheckout({
      membershipId: membership.id,
      plan,
      sessionId: session.id,
      customerId: typeof session.customer === "string" ? session.customer : null,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
