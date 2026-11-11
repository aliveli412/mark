import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type {
  LodgeMembership,
  LodgeMembershipSettings,
  LodgeRosterMember,
  MembershipPlan,
} from "@/lib/types";
import { markSites } from "@/lib/mark-sites";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function accessCode() {
  return Math.random().toString(16).slice(2, 8) + Math.random().toString(16).slice(2, 6);
}

function defaultSettings(slug: string): LodgeMembershipSettings {
  return {
    lodge_slug: slug,
    monthly_pence: 1500,
    yearly_pence: 15000,
    standing_order_pence: 1500,
    currency: "gbp",
    bank_name: "",
    bank_account_name: "",
    bank_sort_code: "",
    bank_account_number: "",
    bank_reference_hint: "",
    active: true,
  };
}

type MockState = {
  settings: LodgeMembershipSettings[];
  roster: LodgeRosterMember[];
  memberships: LodgeMembership[];
};

const g = globalThis as typeof globalThis & { __mmmMembershipMock?: MockState };

function mock(): MockState {
  if (!g.__mmmMembershipMock) {
    g.__mmmMembershipMock = {
      settings: markSites.map((site) => defaultSettings(site.slug)),
      roster: [
        {
          id: "roster-demo-1",
          lodge_slug: "gallipoli",
          full_name: "Demo Brother",
          email: "demo@example.com",
          membership_no: "G-1001",
          notes: "Sample roster row for local testing",
          active: true,
          created_at: new Date().toISOString(),
        },
      ],
      memberships: [],
    };
  }
  return g.__mmmMembershipMock;
}

function usingLive() {
  return getSupabaseEnv().configured && Boolean(createSupabaseAdminClient());
}

export function planAmount(settings: LodgeMembershipSettings, plan: MembershipPlan) {
  if (plan === "yearly") return settings.yearly_pence;
  if (plan === "standing_order") return settings.standing_order_pence;
  return settings.monthly_pence;
}

export function planLabel(plan: MembershipPlan) {
  if (plan === "yearly") return "Yearly";
  if (plan === "standing_order") return "Standing order";
  return "Monthly";
}

export async function getMembershipSettings(lodgeSlug: string) {
  if (!usingLive()) {
    return mock().settings.find((item) => item.lodge_slug === lodgeSlug) ?? defaultSettings(lodgeSlug);
  }
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase
    .from("lodge_membership_settings")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .maybeSingle();
  return (data as LodgeMembershipSettings | null) ?? defaultSettings(lodgeSlug);
}

export async function saveMembershipSettings(input: LodgeMembershipSettings) {
  if (!usingLive()) {
    const store = mock();
    const index = store.settings.findIndex((item) => item.lodge_slug === input.lodge_slug);
    if (index >= 0) store.settings[index] = input;
    else store.settings.push(input);
    return { ok: true as const };
  }
  const supabase = createSupabaseAdminClient()!;
  const { error } = await supabase.from("lodge_membership_settings").upsert({
    ...input,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function listRoster(lodgeSlug: string) {
  if (!usingLive()) {
    return mock()
      .roster.filter((item) => item.lodge_slug === lodgeSlug)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }
  const supabase = createSupabaseAdminClient()!;
  const { data, error } = await supabase
    .from("lodge_member_roster")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .order("full_name");
  if (error) return [];
  return (data ?? []) as LodgeRosterMember[];
}

export async function upsertRosterMember(input: {
  id?: string;
  lodge_slug: string;
  full_name: string;
  email: string;
  membership_no?: string;
  notes?: string;
  active?: boolean;
}) {
  const payload = {
    lodge_slug: input.lodge_slug,
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    membership_no: (input.membership_no ?? "").trim(),
    notes: (input.notes ?? "").trim(),
    active: input.active ?? true,
    updated_at: new Date().toISOString(),
  };
  if (!payload.full_name || !payload.email.includes("@")) {
    return { error: "Name and a valid email are required." };
  }

  if (!usingLive()) {
    const store = mock();
    if (input.id) {
      const index = store.roster.findIndex((item) => item.id === input.id);
      if (index < 0) return { error: "Roster member not found." };
      store.roster[index] = { ...store.roster[index], ...payload };
      return { member: store.roster[index] };
    }
    const created: LodgeRosterMember = {
      id: id("roster"),
      created_at: new Date().toISOString(),
      ...payload,
    };
    store.roster.unshift(created);
    return { member: created };
  }

  const supabase = createSupabaseAdminClient()!;
  if (input.id) {
    const { data, error } = await supabase
      .from("lodge_member_roster")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { member: data as LodgeRosterMember };
  }
  const { data, error } = await supabase.from("lodge_member_roster").insert(payload).select("*").single();
  if (error) return { error: error.message };
  return { member: data as LodgeRosterMember };
}

export async function deleteRosterMember(idValue: string) {
  if (!usingLive()) {
    mock().roster = mock().roster.filter((item) => item.id !== idValue);
    return;
  }
  const supabase = createSupabaseAdminClient()!;
  await supabase.from("lodge_member_roster").delete().eq("id", idValue);
}

export async function findRosterMatch(lodgeSlug: string, email: string, membershipNo?: string) {
  const needle = email.trim().toLowerCase();
  const no = (membershipNo ?? "").trim().toLowerCase();
  const roster = await listRoster(lodgeSlug);
  return (
    roster.find(
      (item) =>
        item.active &&
        item.email.toLowerCase() === needle &&
        (!no || !item.membership_no || item.membership_no.toLowerCase() === no),
    ) ?? null
  );
}

export async function listMemberships(lodgeSlug: string) {
  if (!usingLive()) {
    return mock()
      .memberships.filter((item) => item.lodge_slug === lodgeSlug)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase
    .from("lodge_memberships")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .order("created_at", { ascending: false });
  return (data ?? []) as LodgeMembership[];
}

export async function getMembershipById(idValue: string) {
  if (!usingLive()) return mock().memberships.find((item) => item.id === idValue) ?? null;
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase.from("lodge_memberships").select("*").eq("id", idValue).maybeSingle();
  return (data as LodgeMembership | null) ?? null;
}

export async function getMembershipByAccess(lodgeSlug: string, email: string, accessCode: string) {
  const needle = email.trim().toLowerCase();
  const code = accessCode.trim().toLowerCase();
  if (!usingLive()) {
    return (
      mock().memberships.find(
        (item) =>
          item.lodge_slug === lodgeSlug &&
          item.email.toLowerCase() === needle &&
          item.access_code.toLowerCase() === code,
      ) ?? null
    );
  }
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase
    .from("lodge_memberships")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .ilike("email", needle)
    .ilike("access_code", code)
    .maybeSingle();
  return (data as LodgeMembership | null) ?? null;
}

export async function registerMembership(input: {
  lodge_slug: string;
  full_name: string;
  email: string;
  membership_no?: string;
}) {
  const full_name = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const membership_no = (input.membership_no ?? "").trim();
  if (!full_name || !email.includes("@")) return { error: "Name and a valid email are required." };

  const match = await findRosterMatch(input.lodge_slug, email, membership_no);
  const now = new Date().toISOString();
  const payload = {
    lodge_slug: input.lodge_slug,
    roster_id: match?.id ?? null,
    full_name,
    email,
    membership_no: membership_no || match?.membership_no || "",
    status: match ? ("matched" as const) : ("pending_match" as const),
    plan: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_session_id: null,
    access_code: accessCode(),
    matched_at: match ? now : null,
    activated_at: null,
    updated_at: now,
  };

  if (!usingLive()) {
    const store = mock();
    const existing = store.memberships.find(
      (item) => item.lodge_slug === input.lodge_slug && item.email.toLowerCase() === email,
    );
    if (existing) {
      Object.assign(existing, payload, { id: existing.id, created_at: existing.created_at, access_code: existing.access_code });
      return { membership: existing, matched: Boolean(match) };
    }
    const created: LodgeMembership = {
      id: id("membership"),
      created_at: now,
      ...payload,
    };
    store.memberships.unshift(created);
    return { membership: created, matched: Boolean(match) };
  }

  const supabase = createSupabaseAdminClient()!;
  const { data: existing } = await supabase
    .from("lodge_memberships")
    .select("*")
    .eq("lodge_slug", input.lodge_slug)
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("lodge_memberships")
      .update({
        ...payload,
        access_code: (existing as LodgeMembership).access_code,
      })
      .eq("id", (existing as LodgeMembership).id)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { membership: data as LodgeMembership, matched: Boolean(match) };
  }

  const { data, error } = await supabase.from("lodge_memberships").insert(payload).select("*").single();
  if (error) return { error: error.message };
  return { membership: data as LodgeMembership, matched: Boolean(match) };
}

export async function attachMembershipCheckout(input: {
  membershipId: string;
  plan: MembershipPlan;
  sessionId: string;
  customerId?: string | null;
}) {
  const patch = {
    plan: input.plan,
    stripe_session_id: input.sessionId,
    stripe_customer_id: input.customerId ?? null,
    updated_at: new Date().toISOString(),
  };
  if (!usingLive()) {
    const item = mock().memberships.find((row) => row.id === input.membershipId);
    if (!item) return { error: "Membership not found." };
    Object.assign(item, patch);
    return { membership: item };
  }
  const supabase = createSupabaseAdminClient()!;
  const { data, error } = await supabase
    .from("lodge_memberships")
    .update(patch)
    .eq("id", input.membershipId)
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { membership: data as LodgeMembership };
}

export async function activateMembershipBySession(sessionId: string, subscriptionId?: string | null) {
  const patch = {
    status: "active" as const,
    stripe_subscription_id: subscriptionId ?? null,
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!usingLive()) {
    const item = mock().memberships.find((row) => row.stripe_session_id === sessionId);
    if (!item) return { error: "Membership not found." };
    Object.assign(item, patch);
    return { membership: item };
  }
  const supabase = createSupabaseAdminClient()!;
  const { data, error } = await supabase
    .from("lodge_memberships")
    .update(patch)
    .eq("stripe_session_id", sessionId)
    .select("*")
    .maybeSingle();
  if (error) return { error: error.message };
  return { membership: data as LodgeMembership | null };
}

export async function setMembershipStatus(idValue: string, status: LodgeMembership["status"]) {
  const patch = {
    status,
    activated_at: status === "active" ? new Date().toISOString() : undefined,
    matched_at: status === "matched" || status === "active" ? new Date().toISOString() : undefined,
    updated_at: new Date().toISOString(),
  };
  if (!usingLive()) {
    const item = mock().memberships.find((row) => row.id === idValue);
    if (!item) return { error: "Not found" };
    Object.assign(item, patch);
    return { membership: item };
  }
  const supabase = createSupabaseAdminClient()!;
  const { data, error } = await supabase.from("lodge_memberships").update(patch).eq("id", idValue).select("*").single();
  if (error) return { error: error.message };
  return { membership: data as LodgeMembership };
}

export async function markStandingOrderRequested(membershipId: string) {
  const patch = {
    plan: "standing_order" as const,
    status: "matched" as const,
    updated_at: new Date().toISOString(),
  };
  if (!usingLive()) {
    const item = mock().memberships.find((row) => row.id === membershipId);
    if (!item) return { error: "Not found" };
    Object.assign(item, patch);
    return { membership: item };
  }
  const supabase = createSupabaseAdminClient()!;
  const { data, error } = await supabase
    .from("lodge_memberships")
    .update(patch)
    .eq("id", membershipId)
    .select("*")
    .single();
  if (error) return { error: error.message };
  return { membership: data as LodgeMembership };
}
