export type LodgeNavLink = {
  label: string;
  slug: string;
  body: string;
};

export type LodgeNavGroup = {
  label: string;
  slug: string;
  links?: LodgeNavLink[];
};

export type LodgePost = {
  title: string;
  category: string;
  image: string;
};

export type LodgeEvent = {
  dateLabel: string;
  title: string;
  subtitle?: string;
  startsAt: string;
  endsAt: string;
  location: string;
  attendanceNote: string;
  rsvpClosed?: boolean;
};

export type MarkSite = {
  slug: string;
  menuLabel: string;
  brand: string;
  fullName: string;
  accent?: boolean;
  phone: string;
  addressLines: string[];
  meetingsBlurb: string;
  nextMeetingLabel: string;
  nextMeetingAt: string;
  bookingHref: string;
  nav: LodgeNavGroup[];
  posts: LodgePost[];
  event: LodgeEvent;
};

function slugifyLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/’/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const defaultNav = (joinLabel: string): LodgeNavGroup[] => [
  {
    label: "History",
    slug: "history",
    links: [
      {
        label: "The Oration",
        slug: "oration",
        body: "The oration of the lodge recounts our foundation story, the symbolism of the Mark, and the fellowship that binds our members.",
      },
      {
        label: "The Lodge Banner",
        slug: "banner",
        body: "Our lodge banner carries the marks and colours that identify us in procession and at festive board.",
      },
    ],
  },
  {
    label: "Members",
    slug: "members",
    links: [
      { label: "Honorary Members", slug: "honorary-members", body: "Brethren who have rendered distinguished service to the lodge." },
      { label: "Past Masters", slug: "past-masters", body: "A record of Worshipful Masters who have guided the lodge." },
      { label: "Founding Members", slug: "founding-members", body: "The founders who consecrated the lodge and set its course." },
      { label: "Secretaries & Treasurers", slug: "secretaries-treasurers", body: "Officers who keep the records and steward the lodge funds." },
      { label: "Office Bearers", slug: "office-bearers", body: "Current officers for this Mark year." },
      { label: "The Promised Journey", slug: "promised-journey", body: "An introduction to the Mark journey for candidates and visitors." },
      { label: joinLabel, slug: "join", body: "To enquire about joining, please use Contact Us and a brother will reply." },
    ],
  },
  {
    label: "Meetings",
    slug: "meetings",
    links: [
      {
        label: "Regular Meetings",
        slug: "regular-meetings",
        body: "See the home page countdown and event card for the next regular meeting, dining, and RSVP details.",
      },
    ],
  },
  {
    label: "Master’s Charities",
    slug: "masters-charities",
    links: [
      {
        label: "Almoner",
        slug: "almoner",
        body: "Our Almoner supports brethren and their families in times of need, in confidence and with care.",
      },
      {
        label: "Masonic Charitable Foundation",
        slug: "mcf",
        body: "We support the wider Masonic charities chosen by the Master for the year.",
      },
    ],
  },
];

function makeSite(
  base: Omit<MarkSite, "nav" | "posts" | "phone" | "addressLines" | "meetingsBlurb" | "bookingHref"> &
    Partial<Pick<MarkSite, "nav" | "posts" | "phone" | "addressLines" | "meetingsBlurb" | "bookingHref">>,
): MarkSite {
  return {
    phone: "+44 (0) 7747 778899",
    addressLines: ["C/O Mark Portal", "68 Stoke Newington High Street", "London N16 7PA"],
    meetingsBlurb:
      "Regular meetings are held at Mark Masons’ Hall. Please check the home page for the next date, dining, and RSVP.",
    bookingHref: "#event",
    nav: defaultNav(`Join ${base.brand}`),
    posts: [
      {
        title: `${base.brand} founders at Lord Mayor’s Show`,
        category: "Lord Mayor's Show",
        image: "/images/hero.jpg",
      },
      {
        title: `Charitable run with ${base.brand}`,
        category: "Charitable Activities",
        image: "/images/turkey.jpg",
      },
      {
        title: `Primus Master memories – ${base.brand}`,
        category: "Lord Mayor's Show",
        image: "/images/ritual.jpg",
      },
    ],
    ...base,
  };
}

export const markSites: MarkSite[] = [
  makeSite({
    slug: "gallipoli",
    menuLabel: "Gallipoli",
    brand: "Gallipoli",
    fullName: "Gallipoli Lodge of MMM No. 1984",
    nextMeetingLabel: "Countdown to our next regular meeting on 21st February 2027",
    nextMeetingAt: "2027-02-21T11:00:00.000Z",
    addressLines: ["C/O Gallipoli", "68 Stoke Newington High Street", "London N16 7PA"],
    meetingsBlurb:
      "Regular meetings of Gallipoli Lodge of MMM No. 1984 are held at Mark Masons’ Hall. Dining and RSVP open from the event card on the home page.",
    posts: [
      {
        title: "Gallipoli founders at Lord Mayor’s Show",
        category: "Lord Mayor's Show",
        image: "/images/hero.jpg",
      },
      {
        title: "Run for Peace – Gallipoli Marathon – Turkey",
        category: "Charitable Activities",
        image: "/images/turkey.jpg",
      },
      {
        title: "Primus Master at Lord Mayor’s Show – 2016",
        category: "Lord Mayor's Show",
        image: "/images/ritual.jpg",
      },
    ],
    event: {
      dateLabel: "21 FEB",
      title: "23rd Regular Meeting",
      subtitle: "Regular Lodge Meeting",
      startsAt: "2027-02-21T11:00:00.000Z",
      endsAt: "2027-02-21T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining — book via RSVP when open.",
      rsvpClosed: false,
    },
  }),
  makeSite({
    slug: "namik-kemal",
    menuLabel: "Namik Kemal",
    brand: "Namik Kemal",
    fullName: "Namik Kemal Lodge of MMM",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-03-14T11:00:00.000Z",
    event: {
      dateLabel: "14 MAR",
      title: "Regular Meeting",
      startsAt: "2027-03-14T11:00:00.000Z",
      endsAt: "2027-03-14T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  }),
  makeSite({
    slug: "anadolu",
    menuLabel: "Anadolu",
    brand: "Anadolu",
    fullName: "Anadolu Lodge of MMM",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-04-11T11:00:00.000Z",
    event: {
      dateLabel: "11 APR",
      title: "Regular Meeting",
      startsAt: "2027-04-11T11:00:00.000Z",
      endsAt: "2027-04-11T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  }),
  makeSite({
    slug: "freemasons-without-borders",
    menuLabel: "Freemasons Without Borders",
    brand: "FWB",
    fullName: "Freemasons Without Borders",
    nextMeetingLabel: "Countdown to our next gathering",
    nextMeetingAt: "2027-05-09T11:00:00.000Z",
    event: {
      dateLabel: "09 MAY",
      title: "FWB Gathering",
      startsAt: "2027-05-09T11:00:00.000Z",
      endsAt: "2027-05-09T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Open gathering — see RSVP for places.",
    },
  }),
  makeSite({
    slug: "ata",
    menuLabel: "ATA",
    brand: "ATA",
    fullName: "ATA Lodge of MMM",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-06-13T11:00:00.000Z",
    event: {
      dateLabel: "13 JUN",
      title: "Regular Meeting",
      startsAt: "2027-06-13T11:00:00.000Z",
      endsAt: "2027-06-13T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  }),
  makeSite({
    slug: "khalsa",
    menuLabel: "Khalsa",
    brand: "Khalsa",
    fullName: "Khalsa Lodge of MMM",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-07-11T11:00:00.000Z",
    event: {
      dateLabel: "11 JUL",
      title: "Regular Meeting",
      startsAt: "2027-07-11T11:00:00.000Z",
      endsAt: "2027-07-11T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  }),
  makeSite({
    slug: "mark-enterprise",
    menuLabel: "Mark Enterprise",
    brand: "Mark Enterprise",
    fullName: "Mark Enterprise Lodge of MMM",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-09-12T11:00:00.000Z",
    event: {
      dateLabel: "12 SEP",
      title: "Regular Meeting",
      startsAt: "2027-09-12T11:00:00.000Z",
      endsAt: "2027-09-12T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  }),
  makeSite({
    slug: "phoenix",
    menuLabel: "Phoenix",
    brand: "Phoenix",
    fullName: "Phoenix Lodge of MMM",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-10-10T11:00:00.000Z",
    event: {
      dateLabel: "10 OCT",
      title: "Regular Meeting",
      startsAt: "2027-10-10T11:00:00.000Z",
      endsAt: "2027-10-10T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  }),
  makeSite({
    slug: "roentgen",
    menuLabel: "Roentgen Portal",
    brand: "Roentgen",
    fullName: "Roentgen Portal",
    accent: true,
    nextMeetingLabel: "Countdown to the next Roentgen session",
    nextMeetingAt: "2027-11-14T11:00:00.000Z",
    event: {
      dateLabel: "14 NOV",
      title: "Roentgen Portal Session",
      startsAt: "2027-11-14T11:00:00.000Z",
      endsAt: "2027-11-14T14:00:00.000Z",
      location: "Online / Mark Masons' Hall",
      attendanceNote: "Portal session — RSVP for access details.",
    },
  }),
];

export function getMarkSite(slug: string) {
  return markSites.find((item) => item.slug === slug) ?? null;
}

export function getLodgePage(site: MarkSite, section: string, page?: string) {
  const group = site.nav.find((item) => item.slug === section);
  if (!group) return null;
  if (!page) {
    if (!group.links?.length) return { title: group.label, body: site.meetingsBlurb };
    return { title: group.links[0].label, body: group.links[0].body };
  }
  const link = group.links?.find((item) => item.slug === page);
  if (!link) return null;
  return { title: link.label, body: link.body };
}

export function lodgePath(slug: string, ...parts: Array<string | undefined>) {
  return ["/sites", slug, ...parts.filter((part): part is string => Boolean(part))].join("/");
}

export { slugifyLabel };
