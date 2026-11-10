export type LodgeNavLink = {
  label: string;
  slug: string;
  key: string;
};

export type LodgeNavGroup = {
  label: string;
  slug: string;
  links: LodgeNavLink[];
};

export type LodgePost = {
  title: string;
  category: string;
  image: string;
  href?: string;
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
  hasImportedContent: boolean;
  sourceNote?: string;
};

function defaultNav(brand: string): LodgeNavGroup[] {
  return [
    {
      label: "History",
      slug: "history",
      links: [
        { label: "The Oration", slug: "oration", key: "history/oration" },
        { label: "The Lodge Banner", slug: "banner", key: "history/banner" },
      ],
    },
    {
      label: "Members",
      slug: "members",
      links: [
        { label: "Honorary Members", slug: "honorary-members", key: "members/honorary-members" },
        { label: "Past Masters", slug: "past-masters", key: "members/past-masters" },
        { label: "Founding Members", slug: "founding-members", key: "members/founding-members" },
        { label: "Secretaries & Treasurers", slug: "secretaries-treasurers", key: "members/secretaries-treasurers" },
        { label: "Office Bearers", slug: "office-bearers", key: "members/office-bearers" },
        { label: "The Promised Journey", slug: "promised-journey", key: "members/promised-journey" },
        { label: `Join ${brand}`, slug: "join", key: "members/join" },
      ],
    },
    {
      label: "Meetings",
      slug: "meetings",
      links: [{ label: "Regular Meetings", slug: "regular-meetings", key: "meetings/regular-meetings" }],
    },
    {
      label: "Master’s Charities",
      slug: "masters-charities",
      links: [
        { label: "Almoner", slug: "almoner", key: "masters-charities/almoner" },
        { label: "Masonic Charitable Foundation", slug: "mcf", key: "masters-charities/mcf" },
      ],
    },
  ];
}

export const markSites: MarkSite[] = [
  {
    slug: "gallipoli",
    menuLabel: "Gallipoli",
    brand: "Gallipoli",
    fullName: "Gallipoli Lodge of MMM No. 1984",
    phone: "+44 (0) 7747 778899",
    addressLines: ["C/O Gallipoli", "68 Stoke Newington High Street", "London N16 7PA"],
    meetingsBlurb: "Regular meetings of Gallipoli Lodge of MMM No. 1984 are held at Mark Masons’ Hall.",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-02-21T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("Gallipoli"),
    posts: [],
    hasImportedContent: false,
    event: {
      dateLabel: "21 FEB",
      title: "23rd Regular Meeting",
      subtitle: "Regular Lodge Meeting",
      startsAt: "2027-02-21T11:00:00.000Z",
      endsAt: "2027-02-21T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining — book via RSVP when open.",
    },
  },
  {
    slug: "namik-kemal",
    menuLabel: "Namik Kemal",
    brand: "Namik Kemal",
    fullName: "Namik Kemal Lodge of MMM No. 2001",
    phone: "+44 (0) 7747 778899",
    addressLines: ["C/O Namik Kemal", "68 Stoke Newington High Street", "London N16 7PA"],
    meetingsBlurb: "Regular meetings of Namik Kemal Lodge of MMM No. 2001 are held at Mark Masons’ Hall.",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-03-14T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("Namik Kemal"),
    posts: [],
    hasImportedContent: false,
    event: {
      dateLabel: "14 MAR",
      title: "Regular Meeting",
      startsAt: "2027-03-14T11:00:00.000Z",
      endsAt: "2027-03-14T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  },
  {
    slug: "anadolu",
    menuLabel: "Anadolu",
    brand: "Anadolu",
    fullName: "Anadolu Lodge of MMM No. 2024",
    phone: "+32 475 81 99 07",
    addressLines: ["C/O Anadolu Lodge", "Mark Masons' Hall"],
    meetingsBlurb: "Regular meetings of Anadolu Lodge of MMM No. 2024.",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-04-11T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("Anadolu"),
    posts: [],
    hasImportedContent: false,
    event: {
      dateLabel: "11 APR",
      title: "Regular Meeting",
      startsAt: "2027-04-11T11:00:00.000Z",
      endsAt: "2027-04-11T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  },
  {
    slug: "freemasons-without-borders",
    menuLabel: "Freemasons Without Borders",
    brand: "FWB",
    fullName: "Freemasons Without Borders Lodge of MMM No.2031",
    phone: "+44 (0) 7747 778899",
    addressLines: ["C/O FWB", "68 Stoke Newington High Street", "London N16 7PA"],
    meetingsBlurb: "Regular meetings of Freemasons Without Borders Lodge of MMM.",
    nextMeetingLabel: "Countdown to our next gathering",
    nextMeetingAt: "2027-05-09T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("FWB"),
    posts: [],
    hasImportedContent: false,
    event: {
      dateLabel: "09 MAY",
      title: "FWB Gathering",
      startsAt: "2027-05-09T11:00:00.000Z",
      endsAt: "2027-05-09T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Open gathering — see RSVP for places.",
    },
  },
  {
    slug: "ata",
    menuLabel: "ATA",
    brand: "ATA",
    fullName: "ATA Lodge of Mark Master Masons No 1642",
    phone: "+44 (0) 7747 778899",
    addressLines: ["C/O ATA Lodge", "Mark Masons' Hall"],
    meetingsBlurb: "Regular meetings of ATA Lodge of Mark Master Masons No 1642.",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-06-13T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("ATA"),
    posts: [],
    hasImportedContent: false,
    event: {
      dateLabel: "13 JUN",
      title: "Regular Meeting",
      startsAt: "2027-06-13T11:00:00.000Z",
      endsAt: "2027-06-13T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  },
  {
    slug: "khalsa",
    menuLabel: "Khalsa",
    brand: "Khalsa",
    fullName: "Khalsa Lodge of Mark Master Masons No. 2022",
    phone: "07939 612 276",
    addressLines: ["C/O Khalsa Lodge", "Mark Masons' Hall"],
    meetingsBlurb: "Regular meetings of Khalsa Lodge of Mark Master Masons No. 2022.",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-07-11T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("Khalsa"),
    posts: [],
    hasImportedContent: false,
    event: {
      dateLabel: "11 JUL",
      title: "Regular Meeting",
      startsAt: "2027-07-11T11:00:00.000Z",
      endsAt: "2027-07-11T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  },
  {
    slug: "mark-enterprise",
    menuLabel: "Mark Enterprise",
    brand: "Mark Enterprise",
    fullName: "Mark Enterprise Lodge of MMM",
    phone: "+44 (0) 7747 778899",
    addressLines: ["C/O Mark Enterprise", "Mark Masons' Hall"],
    meetingsBlurb: "Content will be published when the live Mark Enterprise site is available.",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-09-12T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("Mark Enterprise"),
    posts: [],
    hasImportedContent: false,
    sourceNote: "Live WordPress microsite was not publicly reachable during import.",
    event: {
      dateLabel: "12 SEP",
      title: "Regular Meeting",
      startsAt: "2027-09-12T11:00:00.000Z",
      endsAt: "2027-09-12T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  },
  {
    slug: "phoenix",
    menuLabel: "Phoenix",
    brand: "Phoenix",
    fullName: "Phoenix Lodge of MMM",
    phone: "+44 (0) 7747 778899",
    addressLines: ["C/O Phoenix Lodge", "Mark Masons' Hall"],
    meetingsBlurb: "Content will be published when the live Phoenix site is available.",
    nextMeetingLabel: "Countdown to our next regular meeting",
    nextMeetingAt: "2027-10-10T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("Phoenix"),
    posts: [],
    hasImportedContent: false,
    sourceNote: "Live WordPress microsite returned 403 during import.",
    event: {
      dateLabel: "10 OCT",
      title: "Regular Meeting",
      startsAt: "2027-10-10T11:00:00.000Z",
      endsAt: "2027-10-10T14:00:00.000Z",
      location: "Mark Masons' Hall",
      attendanceNote: "Attendance with dining.",
    },
  },
  {
    slug: "roentgen",
    menuLabel: "Roentgen Portal",
    brand: "Roentgen",
    fullName: "Roentgen Portal",
    accent: true,
    phone: "+44 (0) 7747 778899",
    addressLines: ["Roentgen Portal"],
    meetingsBlurb: "Portal content will be published when the live Roentgen site is available.",
    nextMeetingLabel: "Countdown to the next Roentgen session",
    nextMeetingAt: "2027-11-14T11:00:00.000Z",
    bookingHref: "#event",
    nav: defaultNav("Roentgen"),
    posts: [],
    hasImportedContent: false,
    sourceNote: "Live Roentgen Portal URL was not publicly reachable during import.",
    event: {
      dateLabel: "14 NOV",
      title: "Roentgen Portal Session",
      startsAt: "2027-11-14T11:00:00.000Z",
      endsAt: "2027-11-14T14:00:00.000Z",
      location: "Online / Mark Masons' Hall",
      attendanceNote: "Portal session — RSVP for access details.",
    },
  },
];

export function getMarkSite(slug: string) {
  return markSites.find((item) => item.slug === slug) ?? null;
}

export function lodgePath(slug: string, ...parts: Array<string | undefined>) {
  return ["/sites", slug, ...parts.filter((part): part is string => Boolean(part))].join("/");
}
