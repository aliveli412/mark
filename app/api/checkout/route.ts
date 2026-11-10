import { NextResponse } from "next/server";
import {
  attachStripeSession,
  createPendingOrder,
  resolveCheckoutLines,
  type CheckoutLineInput,
} from "@/lib/data/orders";
import { getSiteUrl, getStripe, getStripeConfig } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    stripeConfigured: getStripeConfig().configured,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 503 },
    );
  }

  let body: { email?: string; items?: CheckoutLineInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const resolved = await resolveCheckoutLines(body.items ?? []);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const order = await createPendingOrder({
    email,
    lines: resolved.lines,
    total_pence: resolved.total_pence,
  });
  if (!order.orderId) {
    return NextResponse.json({ error: order.error ?? "Could not create order." }, { status: 500 });
  }

  const siteUrl = getSiteUrl(request);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      success_url: `${siteUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop/basket`,
      metadata: { order_id: order.orderId },
      line_items: resolved.lines.map((line) => ({
        quantity: line.qty,
        price_data: {
          currency: "gbp",
          unit_amount: line.product.price_pence,
          product_data: {
            name: line.product.name,
            description: line.product.description?.slice(0, 400) || undefined,
            images: line.product.image_path?.startsWith("http")
              ? [line.product.image_path]
              : undefined,
          },
        },
      })),
    });

    await attachStripeSession(order.orderId, session.id);

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url, orderId: order.orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
