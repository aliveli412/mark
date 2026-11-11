export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "super_admin" | "lodge_admin" | "member";
};

export type EventRecord = {
  id: string;
  lodge_id: string | null;
  slug: string;
  title: string;
  summary: string;
  body: string;
  location: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  starts_at: string;
  ends_at: string | null;
  published: boolean;
  rsvp_enabled: boolean;
};

export type EventRsvp = {
  id: string;
  event_id: string;
  name: string;
  email: string;
  guests: number;
  note: string;
  created_at: string;
};

export type PostRecord = {
  id: string;
  lodge_id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  published: boolean;
  published_at: string | null;
};

export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_pence: number;
  image_path: string;
  active: boolean;
};

export type MembershipPlan = "monthly" | "yearly" | "standing_order";

export type MembershipStatus =
  | "pending_match"
  | "matched"
  | "active"
  | "past_due"
  | "cancelled";

export type LodgeMembershipSettings = {
  lodge_slug: string;
  monthly_pence: number;
  yearly_pence: number;
  standing_order_pence: number;
  currency: string;
  bank_name: string;
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
  bank_reference_hint: string;
  active: boolean;
};

export type LodgeRosterMember = {
  id: string;
  lodge_slug: string;
  full_name: string;
  email: string;
  membership_no: string;
  notes: string;
  active: boolean;
  created_at: string;
};

export type LodgeMembership = {
  id: string;
  lodge_slug: string;
  roster_id: string | null;
  full_name: string;
  email: string;
  membership_no: string;
  status: MembershipStatus;
  plan: MembershipPlan | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_session_id: string | null;
  access_code: string;
  matched_at: string | null;
  activated_at: string | null;
  created_at: string;
};
