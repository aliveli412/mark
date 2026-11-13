import type { LodgeNavGroup, LodgePost, MarkSite } from "@/lib/mark-sites";
import { getMarkSite, markSites } from "@/lib/mark-sites";
import { listContentKeys, loadSiteContent } from "@/lib/site-content";

const LABEL_OVERRIDES: Record<string, string> = {
  oration: "The Oration",
  banner: "The Lodge Banner",
  overview: "History",
  "honorary-members": "Honorary Members",
  "past-masters": "Past Masters",
  "founding-members": "Founding Members",
  "secretaries-treasurers": "Secretaries & Treasurers",
  "office-bearers": "Office Bearers",
  "promised-journey": "The Promised Journey",
  join: "Join",
  "regular-meetings": "Regular Meetings",
  almoner: "Almoner",
  mcf: "Masonic Charitable Foundation",
  "consecration-photos": "Consecration Photos",
  "consecration-videos": "Consecration Videos",
  "summons-archive": "Summons & Minutes Archive",
  ram: "RAM",
};

const preferred: Record<string, string[]> = {
  history: ["oration", "banner", "overview", "consecration-photos", "consecration-videos"],
  members: [
    "honorary-members",
    "past-masters",
    "founding-members",
    "secretaries-treasurers",
    "office-bearers",
    "promised-journey",
    "join",
    "ram",
  ],
  meetings: ["regular-meetings", "summons-archive"],
  "masters-charities": ["overview", "almoner", "mcf"],
};

const postKeyBySource: Record<string, string> = {
  "lord-mayors-show-11th-november-2017.html": "gallipoli-founders-lord-mayors-show",
  "run-for-peace-gallipoli-marathon-turkey.html": "run-for-peace-gallipoli-marathon",
  "primus-master-at-lord-mayors-show-2016.html": "primus-master-lord-mayors-show-2016",
};

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function navFromContent(siteSlug: string, brand: string): LodgeNavGroup[] {
  const keys = listContentKeys(siteSlug);
  const groups: LodgeNavGroup[] = [
    { label: "History", slug: "history", links: [] },
    { label: "Members", slug: "members", links: [] },
    { label: "Meetings", slug: "meetings", links: [] },
    { label: "Master’s Charities", slug: "masters-charities", links: [] },
  ];

  for (const key of keys) {
    if (!key.includes("/") || key.startsWith("posts/") || key === "contact" || key === "home") continue;
    const [section, page] = key.split("/") as [string, string];
    const group = groups.find((item) => item.slug === section);
    if (!group) continue;
    const content = loadSiteContent(siteSlug)?.pages[key];
    let label = content?.title || LABEL_OVERRIDES[page] || titleCase(page);
    if (page === "join") label = `Join ${brand}`;
    if (page === "overview" && section === "masters-charities") label = "Master’s Charities";
    if (page === "overview" && section === "history") label = "History";
    // Extra meeting pages keep their titles
    group.links.push({ label, slug: page, key });
  }

  for (const group of groups) {
    if (group.slug === "members") {
      group.links.unshift({
        label: "Members Page",
        slug: "membership",
        key: "membership",
        href: "membership",
      });
    }
    const order = preferred[group.slug] ?? [];
    group.links.sort((a, b) => {
      // Keep Members Page first in the Members menu.
      if (group.slug === "members") {
        if (a.slug === "membership") return -1;
        if (b.slug === "membership") return 1;
      }
      const ai = order.indexOf(a.slug);
      const bi = order.indexOf(b.slug);
      const av = ai === -1 ? 900 + a.slug.localeCompare(b.slug) : ai;
      const bv = bi === -1 ? 900 + b.slug.localeCompare(a.slug) : bi;
      if (av !== bv) return av - bv;
      return a.label.localeCompare(b.label);
    });
  }

  return groups.filter((group) => group.links.length > 0);
}

export function getEnrichedMarkSite(slug: string): MarkSite | null {
  const base = getMarkSite(slug);
  if (!base) return null;
  const content = loadSiteContent(slug);
  if (!content) return base;

  const home = content.pages.home;
  const meta = home?.meta;
  const posts: LodgePost[] =
    meta?.posts?.map((post) => {
      const file = post.source?.split("/").pop() || "";
      const mapped = postKeyBySource[file];
      return {
        title: post.title,
        category: post.category,
        image: post.image,
        href: mapped ? `/sites/${slug}/posts/${mapped}` : undefined,
      };
    }) ?? [];

  return {
    ...base,
    fullName: home?.title || base.fullName,
    phone: meta?.phone || base.phone,
    addressLines: meta?.address_lines?.length ? meta.address_lines : base.addressLines,
    nextMeetingLabel: meta?.countdown_label || base.nextMeetingLabel,
    nav: navFromContent(slug, base.brand),
    posts,
    hasImportedContent: true,
  };
}

export function listEnrichedMarkSites() {
  return markSites.map((site) => getEnrichedMarkSite(site.slug) ?? site);
}
