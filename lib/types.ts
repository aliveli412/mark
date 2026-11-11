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
  is_pilot?: boolean;
  roster_source?: string;
  active: boolean;
};

export type LodgeRosterMember = {
  id: string;
  lodge_slug: string;
  brother_no: string;
  surname: string;
  given_names: string;
  prefix: string;
  initials: string;
  title: string;
  suffix: string;
  full_name: string;
  home_phone: string;
  mobile: string;
  postcode: string;
  address: string;
  address2: string;
  address3: string;
  city: string;
  county: string;
  email: string;
  country: string;
  start_date: string | null;
  end_date: string | null;
  grand_rank: string;
  prov_rank: string;
  unit_rank: string;
  grand_rank_id: string;
  prov_rank_id: string;
  unit_rank_id: string;
  unit_rank_start: string | null;
  prov_rank_start: string | null;
  grand_rank_start: string | null;
  unit_prefix: string;
  prov_prefix: string;
  grand_prefix: string;
  activity: string;
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

export type MembershipPaymentMethod =
  | "stripe"
  | "bank"
  | "cash"
  | "standing_order"
  | "admin"
  | "other";

export type MembershipPaymentStatus = "paid" | "partial" | "due" | "waived";

export type LodgeMembershipPayment = {
  id: string;
  lodge_slug: string;
  membership_id: string;
  roster_id: string | null;
  year: number;
  amount_pence: number;
  method: MembershipPaymentMethod;
  status: MembershipPaymentStatus;
  paid_on: string | null;
  note: string;
  recorded_by: string;
  stripe_session_id: string | null;
  created_at: string;
};

export type MembershipYearDues = {
  year: number;
  due_pence: number;
  paid_pence: number;
  remaining_pence: number;
  status: "paid" | "partial" | "due" | "waived";
};

export type MembershipDuesSummary = {
  current_year: number;
  annual_due_pence: number;
  total_due_pence: number;
  total_paid_pence: number;
  total_remaining_pence: number;
  years: MembershipYearDues[];
};

export type MemberFileStorageBackend = "local" | "supabase";
export type MemberFileVisibility = "members" | "matched" | "active";

export type LodgeMemberFile = {
  id: string;
  lodge_slug: string;
  slug: string;
  title: string;
  description: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_backend: MemberFileStorageBackend;
  storage_path: string;
  visibility: MemberFileVisibility;
  sort_order: number;
  download_count: number;
  active: boolean;
  created_at: string;
};
