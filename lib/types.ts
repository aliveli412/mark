export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "super_admin" | "lodge_admin" | "member";
};

export type EventRecord = {
  id: string;
  lodge_id: string | null;
  title: string;
  summary: string;
  body: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  published: boolean;
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
