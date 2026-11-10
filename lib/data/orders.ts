import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProductRecord } from "@/lib/types";

export type CheckoutLineInput = {
  slug: string;
  qty: number;
};

export type ResolvedCheckoutLine = {
  product: ProductRecord;
  qty: number;
  line_total_pence: number;
};

export async function resolveCheckoutLines(items: CheckoutLineInput[]): Promise<
  | { ok: true; lines: ResolvedCheckoutLine[]; total_pence: number }
  | { ok: false; error: string }
> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Basket is empty." };
  }

  const cleaned = items
    .map((item) => ({
      slug: String(item.slug ?? "").trim(),
      qty: Math.max(1, Math.min(99, Math.floor(Number(item.qty) || 0))),
    }))
    .filter((item) => item.slug && item.qty > 0);

  if (cleaned.length === 0) return { ok: false, error: "Basket is empty." };

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Shop database is not configured." };

  const slugs = [...new Set(cleaned.map((item) => item.slug))];
  const { data, error } = await supabase.from("products").select("*").in("slug", slugs).eq("active", true);
  if (error) return { ok: false, error: error.message };

  const bySlug = new Map((data ?? []).map((product) => [product.slug as string, product as ProductRecord]));
  const lines: ResolvedCheckoutLine[] = [];

  for (const item of cleaned) {
    const product = bySlug.get(item.slug);
    if (!product) return { ok: false, error: `Product not available: ${item.slug}` };
    lines.push({
      product,
      qty: item.qty,
      line_total_pence: product.price_pence * item.qty,
    });
  }

  return {
    ok: true,
    lines,
    total_pence: lines.reduce((sum, line) => sum + line.line_total_pence, 0),
  };
}

export async function createPendingOrder(input: {
  email: string;
  lines: ResolvedCheckoutLine[];
  total_pence: number;
}) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "Shop database is not configured." };

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      email: input.email,
      status: "pending",
      total_pence: input.total_pence,
    })
    .select("id")
    .single();

  if (error || !order) return { error: error?.message ?? "Could not create order." };

  const { error: itemsError } = await supabase.from("order_items").insert(
    input.lines.map((line) => ({
      order_id: order.id,
      product_id: line.product.id,
      product_name: line.product.name,
      unit_price_pence: line.product.price_pence,
      quantity: line.qty,
    })),
  );

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: itemsError.message };
  }

  return { orderId: order.id as string };
}

export async function attachStripeSession(orderId: string, sessionId: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase.from("orders").update({ stripe_session_id: sessionId }).eq("id", orderId);
}

export async function markOrderPaidBySession(sessionId: string, email?: string | null) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "Shop database is not configured." };

  const patch: { status: string; email?: string } = { status: "paid" };
  if (email) patch.email = email;

  const { data, error } = await supabase
    .from("orders")
    .update(patch)
    .eq("stripe_session_id", sessionId)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  return { orderId: data?.id as string | undefined };
}

export async function listAdminOrders(limit = 50) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("id, email, status, total_pence, stripe_session_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}
