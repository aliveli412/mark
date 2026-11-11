import { readFileSync, existsSync } from "fs";
import path from "path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type {
  LodgeMembership,
  LodgeMembershipPayment,
  LodgeMembershipSettings,
  LodgeRosterMember,
  MembershipPaymentMethod,
  MembershipPaymentStatus,
  MembershipPlan,
} from "@/lib/types";
import { buildDuesSummary } from "@/lib/membership-dues";
import { markSites } from "@/lib/mark-sites";

export const FWB_LODGE_SLUG = "freemasons-without-borders";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Temporary local/dev access code for every member. Override with MEMBERSHIP_DEV_ACCESS_CODE. */
export const LOCAL_MEMBERSHIP_ACCESS_CODE = "111111";

export function useFixedMembershipAccessCode() {
  if (process.env.MEMBERSHIP_DEV_ACCESS_CODE?.trim()) return true;
  if (process.env.NODE_ENV !== "production") return true;
  const site = (process.env.SITE_URL || "").toLowerCase();
  if (site.includes("localhost") || site.includes("127.0.0.1")) return true;
  // Mock store (no Supabase) always uses the shared local code.
  return !usingLive();
}

function fixedAccessCode() {
  return (process.env.MEMBERSHIP_DEV_ACCESS_CODE || LOCAL_MEMBERSHIP_ACCESS_CODE).trim() || LOCAL_MEMBERSHIP_ACCESS_CODE;
}

function accessCode() {
  if (useFixedMembershipAccessCode()) return fixedAccessCode();
  return Math.random().toString(16).slice(2, 8) + Math.random().toString(16).slice(2, 6);
}

function emptyRosterFields(): Omit<LodgeRosterMember, "id" | "lodge_slug" | "full_name" | "email" | "active" | "created_at"> {
  return {
    brother_no: "",
    surname: "",
    given_names: "",
    prefix: "",
    initials: "",
    title: "",
    suffix: "",
    home_phone: "",
    mobile: "",
    postcode: "",
    address: "",
    address2: "",
    address3: "",
    city: "",
    county: "",
    country: "",
    start_date: null,
    end_date: null,
    grand_rank: "",
    prov_rank: "",
    unit_rank: "",
    grand_rank_id: "",
    prov_rank_id: "",
    unit_rank_id: "",
    unit_rank_start: null,
    prov_rank_start: null,
    grand_rank_start: null,
    unit_prefix: "",
    prov_prefix: "",
    grand_prefix: "",
    activity: "",
    membership_no: "",
    notes: "",
  };
}

function defaultSettings(slug: string): LodgeMembershipSettings {
  const pilot = slug === FWB_LODGE_SLUG;
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
    is_pilot: pilot,
    roster_source: pilot ? "As of 06-06-2022.xlsx" : "",
    active: true,
  };
}

function loadFwbSeedMembers(): LodgeRosterMember[] {
  const filePath = path.join(process.cwd(), "content", "memberships", "fwb-roster.json");
  if (!existsSync(filePath)) return [];
  const payload = JSON.parse(readFileSync(filePath, "utf8")) as {
    members: Array<Record<string, unknown>>;
  };
  return (payload.members ?? []).map((member, index) => {
    const brotherNo = String(member.brother_no ?? "");
    return {
      ...emptyRosterFields(),
      id: `fwb-${brotherNo || index}`,
      lodge_slug: FWB_LODGE_SLUG,
      brother_no: brotherNo,
      surname: String(member.surname ?? ""),
      given_names: String(member.given_names ?? ""),
      prefix: String(member.prefix ?? ""),
      initials: String(member.initials ?? ""),
      title: String(member.title ?? ""),
      suffix: String(member.suffix ?? ""),
      full_name: String(member.full_name ?? ""),
      home_phone: String(member.home_phone ?? ""),
      mobile: String(member.mobile ?? ""),
      postcode: String(member.postcode ?? ""),
      address: String(member.address ?? ""),
      address2: String(member.address2 ?? ""),
      address3: String(member.address3 ?? ""),
      city: String(member.city ?? ""),
      county: String(member.county ?? ""),
      email: String(member.email ?? "").toLowerCase(),
      country: String(member.country ?? ""),
      start_date: (member.start_date as string | null) ?? null,
      end_date: (member.end_date as string | null) ?? null,
      grand_rank: String(member.grand_rank ?? ""),
      prov_rank: String(member.prov_rank ?? ""),
      unit_rank: String(member.unit_rank ?? ""),
      grand_rank_id: String(member.grand_rank_id ?? ""),
      prov_rank_id: String(member.prov_rank_id ?? ""),
      unit_rank_id: String(member.unit_rank_id ?? ""),
      unit_rank_start: (member.unit_rank_start as string | null) ?? null,
      prov_rank_start: (member.prov_rank_start as string | null) ?? null,
      grand_rank_start: (member.grand_rank_start as string | null) ?? null,
      unit_prefix: String(member.unit_prefix ?? ""),
      prov_prefix: String(member.prov_prefix ?? ""),
      grand_prefix: String(member.grand_prefix ?? ""),
      activity: String(member.activity ?? ""),
      membership_no: brotherNo,
      notes: String(member.activity ?? ""),
      active: Boolean(member.active ?? true),
      created_at: new Date().toISOString(),
    };
  });
}

type MockState = {
  settings: LodgeMembershipSettings[];
  roster: LodgeRosterMember[];
  memberships: LodgeMembership[];
  payments: LodgeMembershipPayment[];
};

const g = globalThis as typeof globalThis & { __mmmMembershipMock?: MockState };

function mock(): MockState {
  if (!g.__mmmMembershipMock) {
    g.__mmmMembershipMock = {
      settings: markSites.map((site) => defaultSettings(site.slug)),
      roster: loadFwbSeedMembers(),
      memberships: [],
      payments: [],
    };
  }
  if (!g.__mmmMembershipMock.payments) g.__mmmMembershipMock.payments = [];
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

export type RosterUpsertInput = {
  id?: string;
  lodge_slug: string;
  full_name: string;
  email?: string;
  membership_no?: string;
  brother_no?: string;
  surname?: string;
  given_names?: string;
  prefix?: string;
  initials?: string;
  title?: string;
  suffix?: string;
  home_phone?: string;
  mobile?: string;
  postcode?: string;
  address?: string;
  address2?: string;
  address3?: string;
  city?: string;
  county?: string;
  country?: string;
  start_date?: string | null;
  end_date?: string | null;
  grand_rank?: string;
  prov_rank?: string;
  unit_rank?: string;
  activity?: string;
  notes?: string;
  active?: boolean;
};

export async function upsertRosterMember(input: RosterUpsertInput) {
  const brotherNo = (input.brother_no ?? input.membership_no ?? "").trim();
  const payload = {
    ...emptyRosterFields(),
    lodge_slug: input.lodge_slug,
    brother_no: brotherNo,
    surname: (input.surname ?? "").trim(),
    given_names: (input.given_names ?? "").trim(),
    prefix: (input.prefix ?? "").trim(),
    initials: (input.initials ?? "").trim(),
    title: (input.title ?? "").trim(),
    suffix: (input.suffix ?? "").trim(),
    full_name: input.full_name.trim(),
    home_phone: (input.home_phone ?? "").trim(),
    mobile: (input.mobile ?? "").trim(),
    postcode: (input.postcode ?? "").trim(),
    address: (input.address ?? "").trim(),
    address2: (input.address2 ?? "").trim(),
    address3: (input.address3 ?? "").trim(),
    city: (input.city ?? "").trim(),
    county: (input.county ?? "").trim(),
    email: (input.email ?? "").trim().toLowerCase(),
    country: (input.country ?? "").trim(),
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    grand_rank: (input.grand_rank ?? "").trim(),
    prov_rank: (input.prov_rank ?? "").trim(),
    unit_rank: (input.unit_rank ?? "").trim(),
    activity: (input.activity ?? "").trim(),
    membership_no: brotherNo || (input.membership_no ?? "").trim(),
    notes: (input.notes ?? "").trim(),
    active: input.active ?? true,
    updated_at: new Date().toISOString(),
  };
  if (!payload.full_name) {
    return { error: "Name is required." };
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
  const active = roster.filter((item) => item.active);

  if (no) {
    const byBrother = active.find(
      (item) => item.brother_no.toLowerCase() === no || item.membership_no.toLowerCase() === no,
    );
    if (byBrother) {
      if (needle && byBrother.email && byBrother.email.toLowerCase() !== needle) {
        // Brother number wins, but email mismatch is still a match for pilot activation.
        return byBrother;
      }
      return byBrother;
    }
  }

  if (!needle) return null;
  const emailMatches = active.filter((item) => item.email && item.email.toLowerCase() === needle);
  if (emailMatches.length === 1) return emailMatches[0];
  if (emailMatches.length > 1) {
    // Ambiguous email — require brother number.
    return null;
  }
  return null;
}

export async function replaceLodgeRoster(input: {
  lodgeSlug: string;
  members: LodgeRosterMember[];
  sourceName: string;
  markPilot?: boolean;
}) {
  const { lodgeSlug, members, sourceName, markPilot } = input;
  if (!members.length) return { error: "No members to import.", count: 0 };

  if (!usingLive()) {
    const store = mock();
    store.roster = [
      ...store.roster.filter((item) => item.lodge_slug !== lodgeSlug),
      ...members.map((member) => ({ ...member, lodge_slug: lodgeSlug })),
    ];
    const settings = store.settings.find((item) => item.lodge_slug === lodgeSlug);
    if (settings) {
      settings.roster_source = sourceName;
      settings.active = true;
      if (markPilot) settings.is_pilot = true;
    } else {
      store.settings.push({
        ...defaultSettings(lodgeSlug),
        roster_source: sourceName,
        is_pilot: Boolean(markPilot),
        active: true,
      });
    }
    return { ok: true as const, count: members.length };
  }

  const supabase = createSupabaseAdminClient()!;
  await supabase.from("lodge_member_roster").delete().eq("lodge_slug", lodgeSlug);

  const chunkSize = 50;
  for (let i = 0; i < members.length; i += chunkSize) {
    const chunk = members.slice(i, i + chunkSize).map(({ id: _id, created_at: _c, ...rest }) => ({
      ...rest,
      lodge_slug: lodgeSlug,
    }));
    const { error } = await supabase.from("lodge_member_roster").insert(chunk);
    if (error) return { error: error.message, count: i };
  }

  const current = await getMembershipSettings(lodgeSlug);
  await supabase.from("lodge_membership_settings").upsert({
    ...current,
    lodge_slug: lodgeSlug,
    roster_source: sourceName,
    is_pilot: markPilot ? true : Boolean(current.is_pilot),
    active: true,
    updated_at: new Date().toISOString(),
  });

  return { ok: true as const, count: members.length };
}

export async function importFwbRosterSeed() {
  const seed = loadFwbSeedMembers();
  if (!seed.length) return { error: "FWB roster seed file is missing.", count: 0 };
  return replaceLodgeRoster({
    lodgeSlug: FWB_LODGE_SLUG,
    members: seed,
    sourceName: "As of 06-06-2022.xlsx",
    markPilot: true,
  });
}

export async function importLodgeRosterExcel(lodgeSlug: string, fileName: string, buffer: ArrayBuffer | Buffer) {
  const { parseMembershipExcel } = await import("@/lib/membership-excel");
  const parsed = parseMembershipExcel(buffer, lodgeSlug);
  if (parsed.error) return { error: parsed.error, count: 0, columns: parsed.mappedColumns };
  const result = await replaceLodgeRoster({
    lodgeSlug,
    members: parsed.members,
    sourceName: fileName,
    markPilot: lodgeSlug === FWB_LODGE_SLUG,
  });
  return { ...result, columns: parsed.mappedColumns };
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

export async function getRosterMemberById(idValue: string | null | undefined) {
  if (!idValue) return null;
  if (!usingLive()) return mock().roster.find((item) => item.id === idValue) ?? null;
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase.from("lodge_member_roster").select("*").eq("id", idValue).maybeSingle();
  return (data as LodgeRosterMember | null) ?? null;
}

export async function getMembershipRoster(membership: LodgeMembership) {
  if (membership.roster_id) {
    const byId = await getRosterMemberById(membership.roster_id);
    if (byId) return byId;
  }
  return findRosterMatch(membership.lodge_slug, membership.email, membership.membership_no);
}

export async function getMembershipByAccess(lodgeSlug: string, email: string, accessCodeValue: string) {
  const needle = email.trim().toLowerCase();
  const code = accessCodeValue.trim().toLowerCase();
  const allowFixed = useFixedMembershipAccessCode() && code === fixedAccessCode().toLowerCase();

  if (!usingLive()) {
    return (
      mock().memberships.find((item) => {
        if (item.lodge_slug !== lodgeSlug || item.email.toLowerCase() !== needle) return false;
        if (allowFixed) return true;
        return item.access_code.toLowerCase() === code;
      }) ?? null
    );
  }

  const supabase = createSupabaseAdminClient()!;
  if (allowFixed) {
    const { data } = await supabase
      .from("lodge_memberships")
      .select("*")
      .eq("lodge_slug", lodgeSlug)
      .ilike("email", needle)
      .maybeSingle();
    return (data as LodgeMembership | null) ?? null;
  }

  const { data } = await supabase
    .from("lodge_memberships")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .ilike("email", needle)
    .ilike("access_code", code)
    .maybeSingle();
  return (data as LodgeMembership | null) ?? null;
}

/**
 * Sign in with email + access code.
 * Local/dev (`111111`): if the email is on the lodge roster but has no membership yet,
 * create the membership automatically so roster members can open the dashboard.
 */
export async function signInWithMembershipAccess(lodgeSlug: string, email: string, accessCodeValue: string) {
  const needle = email.trim().toLowerCase();
  const code = accessCodeValue.trim();
  if (!needle.includes("@")) return { error: "Enter a valid email." };

  let membership = await getMembershipByAccess(lodgeSlug, needle, code);
  if (membership) {
    const roster = await getMembershipRoster(membership);
    return { membership, roster, created: false };
  }

  const allowFixed = useFixedMembershipAccessCode() && code === fixedAccessCode();
  if (!allowFixed) {
    return { error: "No membership found for that email and access code." };
  }

  const rosterMatch = await findRosterMatch(lodgeSlug, needle);
  if (!rosterMatch) {
    return {
      error:
        "That email is not on this lodge roster yet. Import the Excel roster in Admin, or register with BrotherNo.",
    };
  }

  const registered = await registerMembership({
    lodge_slug: lodgeSlug,
    full_name: rosterMatch.full_name,
    email: needle,
    membership_no: rosterMatch.brother_no || rosterMatch.membership_no,
  });
  if (registered.error || !registered.membership) {
    return { error: registered.error || "Could not open membership for that roster email." };
  }
  return {
    membership: registered.membership,
    roster: registered.roster ?? rosterMatch,
    created: true,
  };
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
      Object.assign(existing, payload, {
        id: existing.id,
        created_at: existing.created_at,
        // Local/dev: keep forcing the shared access code for every user.
        access_code: useFixedMembershipAccessCode() ? payload.access_code : existing.access_code,
      });
      return { membership: existing, matched: Boolean(match), roster: match ?? null };
    }
    const created: LodgeMembership = {
      id: id("membership"),
      created_at: now,
      ...payload,
    };
    store.memberships.unshift(created);
    return { membership: created, matched: Boolean(match), roster: match ?? null };
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
        access_code: useFixedMembershipAccessCode()
          ? payload.access_code
          : (existing as LodgeMembership).access_code,
      })
      .eq("id", (existing as LodgeMembership).id)
      .select("*")
      .single();
    if (error) return { error: error.message };
    return { membership: data as LodgeMembership, matched: Boolean(match), roster: match ?? null };
  }

  const { data, error } = await supabase.from("lodge_memberships").insert(payload).select("*").single();
  if (error) return { error: error.message };
  return { membership: data as LodgeMembership, matched: Boolean(match), roster: match ?? null };
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

export async function listMembershipPayments(membershipId: string) {
  if (!usingLive()) {
    return mock()
      .payments.filter((item) => item.membership_id === membershipId)
      .sort((a, b) => b.year - a.year || (b.paid_on || "").localeCompare(a.paid_on || ""));
  }
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase
    .from("lodge_membership_payments")
    .select("*")
    .eq("membership_id", membershipId)
    .order("year", { ascending: false })
    .order("paid_on", { ascending: false });
  return (data ?? []) as LodgeMembershipPayment[];
}

export async function listLodgePayments(lodgeSlug: string) {
  if (!usingLive()) {
    return mock()
      .payments.filter((item) => item.lodge_slug === lodgeSlug)
      .sort((a, b) => b.year - a.year || (b.created_at || "").localeCompare(a.created_at || ""));
  }
  const supabase = createSupabaseAdminClient()!;
  const { data } = await supabase
    .from("lodge_membership_payments")
    .select("*")
    .eq("lodge_slug", lodgeSlug)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []) as LodgeMembershipPayment[];
}

export async function recordMembershipPayment(input: {
  membership_id: string;
  year: number;
  amount_pence: number;
  method?: MembershipPaymentMethod;
  status?: MembershipPaymentStatus;
  paid_on?: string | null;
  note?: string;
  recorded_by?: string;
  stripe_session_id?: string | null;
}) {
  const membership = await getMembershipById(input.membership_id);
  if (!membership) return { error: "Membership not found." };
  if (!input.year || input.amount_pence < 0) return { error: "Year and amount are required." };

  const now = new Date().toISOString();
  const payload = {
    lodge_slug: membership.lodge_slug,
    membership_id: membership.id,
    roster_id: membership.roster_id,
    year: input.year,
    amount_pence: Math.round(input.amount_pence),
    method: input.method ?? "admin",
    status: input.status ?? "paid",
    paid_on: input.paid_on || now.slice(0, 10),
    note: (input.note ?? "").trim(),
    recorded_by: (input.recorded_by ?? "admin").trim(),
    stripe_session_id: input.stripe_session_id ?? null,
    updated_at: now,
  };

  if (!usingLive()) {
    const created: LodgeMembershipPayment = {
      id: id("payment"),
      created_at: now,
      ...payload,
    };
    mock().payments.unshift(created);
    if (payload.status === "paid" || payload.status === "partial") {
      const item = mock().memberships.find((row) => row.id === membership.id);
      if (item && item.status !== "cancelled") {
        item.status = "active";
        item.activated_at = item.activated_at || now;
      }
    }
    return { payment: created };
  }

  const supabase = createSupabaseAdminClient()!;
  const { data, error } = await supabase.from("lodge_membership_payments").insert(payload).select("*").single();
  if (error) return { error: error.message };

  if (payload.status === "paid" || payload.status === "partial") {
    await supabase
      .from("lodge_memberships")
      .update({
        status: "active",
        activated_at: membership.activated_at || now,
        updated_at: now,
      })
      .eq("id", membership.id)
      .neq("status", "cancelled");
  }

  return { payment: data as LodgeMembershipPayment };
}

export async function getMembershipDashboard(membershipId: string) {
  const membership = await getMembershipById(membershipId);
  if (!membership) return { error: "Membership not found." as const };
  const [roster, settings, payments] = await Promise.all([
    getMembershipRoster(membership),
    getMembershipSettings(membership.lodge_slug),
    listMembershipPayments(membership.id),
  ]);
  const dues = buildDuesSummary({ membership, roster, settings, payments });
  return { membership, roster, settings, payments, dues };
}

export async function activateMembershipBySession(sessionId: string, subscriptionId?: string | null) {
  const patch = {
    status: "active" as const,
    stripe_subscription_id: subscriptionId ?? null,
    activated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  let membership: LodgeMembership | null = null;
  if (!usingLive()) {
    const item = mock().memberships.find((row) => row.stripe_session_id === sessionId);
    if (!item) return { error: "Membership not found." };
    Object.assign(item, patch);
    membership = item;
  } else {
    const supabase = createSupabaseAdminClient()!;
    const { data, error } = await supabase
      .from("lodge_memberships")
      .update(patch)
      .eq("stripe_session_id", sessionId)
      .select("*")
      .maybeSingle();
    if (error) return { error: error.message };
    membership = (data as LodgeMembership | null) ?? null;
  }

  if (membership) {
    const settings = await getMembershipSettings(membership.lodge_slug);
    const amount =
      membership.plan === "yearly"
        ? settings.yearly_pence
        : membership.plan === "standing_order"
          ? settings.standing_order_pence
          : settings.monthly_pence;
    const already = (await listMembershipPayments(membership.id)).some(
      (payment) => payment.stripe_session_id === sessionId,
    );
    if (!already && amount > 0) {
      await recordMembershipPayment({
        membership_id: membership.id,
        year: new Date().getFullYear(),
        amount_pence: amount,
        method: "stripe",
        status: "paid",
        paid_on: new Date().toISOString().slice(0, 10),
        note: `Stripe ${membership.plan || "dues"} payment`,
        recorded_by: "stripe",
        stripe_session_id: sessionId,
      });
    }
  }

  return { membership };
}
