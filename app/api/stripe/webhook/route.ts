import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { activateMembershipBySession, setMembershipStatus, getMembershipById } from "@/lib/data/memberships";
import { markOrderPaidBySession } from "@/lib/data/orders";
import { getStripe, getStripeConfig } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const { webhookSecret } = getStripeConfig();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.kind === "lodge_membership") {
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      await activateMembershipBySession(session.id, subscriptionId);
    } else if (session.payment_status === "paid" || session.status === "complete") {
      await markOrderPaidBySession(session.id, session.customer_details?.email ?? session.customer_email);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const membershipId = subscription.metadata?.membership_id;
    if (membershipId) {
      const membership = await getMembershipById(membershipId);
      if (membership) {
        if (subscription.status === "active" || subscription.status === "trialing") {
          await setMembershipStatus(membershipId, "active");
        } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
          await setMembershipStatus(membershipId, "past_due");
        } else if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
          await setMembershipStatus(membershipId, "cancelled");
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
