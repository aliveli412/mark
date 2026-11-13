import { EventRecord, EventRsvp, PostRecord, ProductRecord } from "@/lib/types";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function monthOffset(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(18, 0, 0, 0);
  return date.toISOString();
}

const g = globalThis as typeof globalThis & {
  __mmmMock?: {
    events: EventRecord[];
    rsvps: EventRsvp[];
    posts: PostRecord[];
    products: ProductRecord[];
  };
};

function store() {
  if (!g.__mmmMock) {
    g.__mmmMock = {
      events: [
        {
          id: "event-1",
          lodge_id: null,
          lodge_slug: null,
          slug: "mark-grand-lodge-communication",
          title: "Mark Grand Lodge Communication",
          summary: "Regular communication of Mark Grand Lodge.",
          body: "Join the regular communication of Mark Grand Lodge. Open to Mark Master Masons.",
          location: "Freemasons’ Hall, London",
          address: "60 Great Queen Street, London WC2B 5AZ",
          contact_name: "Mark Grand Lodge",
          contact_phone: "",
          contact_email: "info@etki.co.uk",
          category: "Grand Lodge",
          starts_at: monthOffset(12),
          ends_at: monthOffset(12),
          published: true,
          rsvp_enabled: true,
        },
        {
          id: "event-2",
          lodge_id: null,
          lodge_slug: null,
          slug: "provincial-meeting",
          title: "Provincial Meeting",
          summary: "Open meeting for Mark lodges in the province.",
          body: "Provincial meeting for lodge officers and companions.",
          location: "Provincial Lodge Rooms",
          address: "",
          contact_name: "Provincial Office",
          contact_phone: "",
          contact_email: "",
          category: "Province",
          starts_at: monthOffset(40),
          ends_at: null,
          published: true,
          rsvp_enabled: true,
        },
        {
          id: "event-gallipoli-1",
          lodge_id: null,
          lodge_slug: "gallipoli",
          slug: "gallipoli-regular-meeting-sample",
          title: "Gallipoli Regular Meeting",
          summary: "Regular Lodge Meeting",
          body: "Attendance with dining — book via RSVP when open.",
          location: "Mark Masons' Hall",
          address: "86 St James's Street, London SW1A 1PL",
          contact_name: "Gallipoli Lodge of MMM No. 1984",
          contact_phone: "",
          contact_email: "",
          category: "Gallipoli MMM Meetings",
          starts_at: monthOffset(21),
          ends_at: monthOffset(21),
          published: true,
          rsvp_enabled: true,
        },
        {
          id: "event-gallipoli-2",
          lodge_id: null,
          lodge_slug: "gallipoli",
          slug: "gallipoli-installation-sample",
          title: "Gallipoli Installation Meeting",
          summary: "Installation & festive board",
          body: "Open gathering — see RSVP for places.",
          location: "Mark Masons' Hall",
          address: "86 St James's Street, London SW1A 1PL",
          contact_name: "Gallipoli Lodge of MMM No. 1984",
          contact_phone: "",
          contact_email: "",
          category: "Gallipoli MMM Meetings",
          starts_at: monthOffset(70),
          ends_at: monthOffset(70),
          published: true,
          rsvp_enabled: true,
        },
        {
          id: "event-fwb-1",
          lodge_id: null,
          lodge_slug: "freemasons-without-borders",
          slug: "fwb-gathering-sample",
          title: "FWB Gathering",
          summary: "Open gathering",
          body: "Reserve your place for the meeting and dining.",
          location: "Mark Masons' Hall",
          address: "86 St James's Street, London SW1A 1PL",
          contact_name: "Freemasons Without Borders Lodge of MMM No.2031",
          contact_phone: "",
          contact_email: "",
          category: "FWB Meetings",
          starts_at: monthOffset(35),
          ends_at: monthOffset(35),
          published: true,
          rsvp_enabled: true,
        },
        {
          id: "event-3",
          lodge_id: null,
          lodge_slug: null,
          slug: "draft-lodge-dinner",
          title: "Draft lodge dinner",
          summary: "Unpublished draft for the admin panel.",
          body: "",
          location: "London",
          address: "",
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          category: "",
          starts_at: monthOffset(55),
          ends_at: null,
          published: false,
          rsvp_enabled: false,
        },
      ],
      rsvps: [],
      posts: [
        {
          id: "post-1",
          lodge_id: null,
          slug: "welcome-to-the-portal",
          title: "Welcome to the Mark Master Masons portal",
          excerpt: "The portal now runs on Next.js with a Supabase admin.",
          body: "This is sample news until Supabase secrets are added. Admins can create, edit and publish posts from /admin.",
          published: true,
          published_at: new Date().toISOString(),
        },
        {
          id: "post-2",
          lodge_id: null,
          slug: "draft-notice",
          title: "Draft notice",
          excerpt: "Only visible in the admin.",
          body: "Draft body.",
          published: false,
          published_at: null,
        },
      ],
      products: [
        {
          id: "product-1",
          slug: "325-ml-white-mug",
          name: "325 ml – White Mug",
          description: "MMM Online Store mug shared with Freemasons Without Borders.",
          price_pence: 450,
          image_path: "/images/mug.jpg",
          active: true,
        },
        {
          id: "product-2",
          slug: "english-turkish-ritual-no-1",
          name: "English & Turkish Ritual No. 1",
          description: "Mark Ritual No. 1 in English and Turkish.",
          price_pence: 750,
          image_path: "/images/ritual.jpg",
          active: true,
        },
      ],
    };
  }
  return g.__mmmMock;
}

export const mockStore = {
  listEvents(includeDrafts = false) {
    return store()
      .events.filter((event) => includeDrafts || event.published)
      .slice()
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  },
  getEvent(eventId: string) {
    return store().events.find((event) => event.id === eventId) ?? null;
  },
  getEventBySlug(slug: string) {
    return store().events.find((event) => event.slug === slug || event.id === slug) ?? null;
  },
  saveEvent(input: Omit<EventRecord, "id"> & { id?: string }) {
    const events = store().events;
    if (input.id) {
      const index = events.findIndex((event) => event.id === input.id);
      if (index >= 0) {
        events[index] = { ...events[index], ...input, id: input.id };
        return events[index];
      }
    }
    const created: EventRecord = { ...input, id: id("event") };
    events.unshift(created);
    return created;
  },
  deleteEvent(eventId: string) {
    store().events = store().events.filter((event) => event.id !== eventId);
    store().rsvps = store().rsvps.filter((rsvp) => rsvp.event_id !== eventId);
  },
  addRsvp(input: Omit<EventRsvp, "id" | "created_at">) {
    const created: EventRsvp = {
      ...input,
      id: id("rsvp"),
      created_at: new Date().toISOString(),
    };
    store().rsvps.unshift(created);
    return created;
  },
  listRsvps(eventId: string) {
    return store().rsvps.filter((rsvp) => rsvp.event_id === eventId);
  },
  listPosts(includeDrafts = false) {
    return store()
      .posts.filter((post) => includeDrafts || post.published)
      .slice()
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  },
  getPostBySlug(slug: string) {
    return store().posts.find((post) => post.slug === slug) ?? null;
  },
  getPost(postId: string) {
    return store().posts.find((post) => post.id === postId) ?? null;
  },
  savePost(input: Omit<PostRecord, "id"> & { id?: string }) {
    const posts = store().posts;
    if (input.id) {
      const index = posts.findIndex((post) => post.id === input.id);
      if (index >= 0) {
        posts[index] = { ...posts[index], ...input, id: input.id };
        return posts[index];
      }
    }
    const created: PostRecord = { ...input, id: id("post") };
    posts.unshift(created);
    return created;
  },
  deletePost(postId: string) {
    store().posts = store().posts.filter((post) => post.id !== postId);
  },
  listProducts(includeHidden = false) {
    return store()
      .products.filter((product) => includeHidden || product.active)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  },
  getProduct(productId: string) {
    return store().products.find((product) => product.id === productId) ?? null;
  },
  saveProduct(input: Omit<ProductRecord, "id"> & { id?: string }) {
    const products = store().products;
    if (input.id) {
      const index = products.findIndex((product) => product.id === input.id);
      if (index >= 0) {
        products[index] = { ...products[index], ...input, id: input.id };
        return products[index];
      }
    }
    const created: ProductRecord = { ...input, id: id("product") };
    products.unshift(created);
    return created;
  },
  deleteProduct(productId: string) {
    store().products = store().products.filter((product) => product.id !== productId);
  },
};
