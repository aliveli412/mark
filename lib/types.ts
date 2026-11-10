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
