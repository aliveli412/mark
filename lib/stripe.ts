import Stripe from "stripe";

export function getStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  return {
    secretKey,
    webhookSecret,
    configured: Boolean(secretKey),
  };
}

export function getStripe() {
  const { secretKey, configured } = getStripeConfig();
  if (!configured) return null;
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export function getSiteUrl(request?: Request) {
  const configured = process.env.SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}
