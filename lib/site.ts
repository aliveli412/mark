export type Province = {
  name: string;
  /** Live Mark Sites path slug, e.g. belgium → markmastermasons.com/belgium/ */
  slug: string;
  /** In-portal path that opens the country/district site. */
  href: string;
  /** Canonical live WordPress district URL. */
  liveUrl: string;
  /** Approximate map marker (WGS84). */
  lat: number;
  lng: number;
};

const LIVE_ORIGIN = "https://www.markmastermasons.com";

function district(name: string, slug: string, lat: number, lng: number): Province {
  return {
    name,
    slug,
    href: `/districts/${slug}`,
    liveUrl: `${LIVE_ORIGIN}/${slug}/`,
    lat,
    lng,
  };
}

export const provinces: Province[] = [
  district("Belgium", "belgium", 50.85, 4.35),
  district("Bolivia", "bolivia", -16.29, -63.59),
  district("Bombay", "bombay", 19.08, 72.88),
  district("Brazil", "brazil", -14.24, -51.93),
  district("Channel Islands", "channelislands", 49.37, -2.36),
  district("Cyprus", "cyprus", 35.13, 33.43),
  district("East Africa", "eastafrica", -1.29, 36.82),
  district("England", "england", 52.36, -1.17),
  district("Germany", "germany", 51.17, 10.45),
  district("Ghana", "ghana", 7.95, -1.02),
  district("Gibraltar", "gibraltar", 36.14, -5.35),
  district("Hong Kong", "hongkong", 22.32, 114.17),
  district("Italy", "italy", 41.87, 12.57),
  district("Jamaica & Cayman", "jamaica-cayman", 18.11, -77.3),
  district("Madras", "madras", 13.08, 80.27),
  district("Natal", "natal", -29.86, 31.02),
  district("Netherlands", "netherlands", 52.13, 5.29),
  district("New Zealand", "new-zealand", -40.9, 174.89),
  district("Nigeria", "nigeria", 9.08, 8.68),
  district("River Plate", "river-plate", -34.6, -58.38),
  district("Romania", "romania", 45.94, 24.97),
  district("Singapore", "singapore", 1.35, 103.82),
  district("South Africa (Eastern Division)", "safricaeasterndivision", -33.02, 27.91),
  district("South and East Caribbean", "southandeastcaribbean", 13.19, -59.54),
  district("Spain", "spain", 40.46, -3.75),
  district("Sri Lanka", "srilanka", 7.87, 80.77),
  district("The Transvaal", "thetransvaal", -26.2, 28.04),
  district("Zimbabwe", "zimbabwe", -19.02, 29.15),
];

export function getProvinceBySlug(slug: string) {
  return provinces.find((item) => item.slug === slug) ?? null;
}

export const stats = [
  { value: "39", label: "Prov. Grand Lodges" },
  { value: "33", label: "Districts" },
  { value: "1600", suffix: "+", label: "Mark Lodges" },
  { value: "31000", suffix: "+", label: "Mark Masons" },
  { value: "1", label: "Online Portal" },
  { value: "9", label: "Free Website so far" },
];

export type PackageCell = { included: boolean; note?: string };

const pay = "Apple & Google Pay";

export const packageFeatures = [
  "Google Play App for Androids",
  "IOS App for Apple devices",
  "Mark Master Masons public URL",
  "Hononary Members page",
  "Past Masters page",
  "Founding Members page",
  "Secretaries & Treasurers page",
  "Office Bearers Page",
  "The Promised Journey Page",
  "Meetings Calendar",
  "Online booking for dining",
  "Online payment for dining",
  "RSVP Option",
  "Meeting Photo Gallery",
  "Annual Subs Billing",
];

function cells(flags: Array<boolean | string>): PackageCell[] {
  return flags.map((flag) =>
    typeof flag === "string" ? { included: true, note: flag } : { included: flag },
  );
}

export const packages = [
  {
    name: "Mark Package",
    price: "FREE",
    detail: "Absolutely no hidden cost!",
    highlighted: false,
    cells: cells([
      true, true, true, true, true, true, true, true, true, true,
      pay, pay, true, false, false,
    ]),
  },
  {
    name: "Mark Master Package",
    price: "£49",
    detail: "Annual fee",
    highlighted: true,
    cells: cells([
      true, true, true, true, true, true, true,
      "includes past 10 years",
      "includes all departed Brethren",
      true, pay, pay, true, false, false,
    ]),
  },
  {
    name: "Hiram Package",
    price: "£99",
    detail: "Annual fee",
    highlighted: false,
    cells: cells([
      true, true, true, true, true, true, true, true, true, true,
      pay, pay, true, true, pay,
    ]),
  },
];

export const searchEntries = [
  { href: "/", title: "Home", text: "Free website for every lodge. Online portal, festive board, digital summons and minutes." },
  { href: "/mark-degree", title: "Mark Degree", text: "What is the Mark Degree, history, working, regalia, advancement and Grand Lodge." },
  { href: "/what-is-mark-degree", title: "What is Mark degree?", text: "King Solomon’s Temple, marks on stones, keystone, Mark penny and the friendly degree." },
  { href: "/why-join", title: "Why join?", text: "Link between the second and third degrees, friendly degree, Holy Royal Arch, charity, Mark Benevolent Fund." },
  { href: "/regalia", title: "Regalia", text: "Aprons, breast jewel, collars for members, Provincial Grand Officers and Grand Officers." },
  { href: "/grand-lodges", title: "Grand Lodges", text: "Grand and District Lodges of Mark Master Masons." },
  { href: "/links", title: "Links", text: "Grand Lodge of Mark Master Masons, London, UGLE, RMBI, MCF, masonic periodicals." },
  { href: "/calendar", title: "Calendar", text: "Meetings and events calendar." },
  { href: "/blog", title: "Blog", text: "Mark Grand Lodge Communication addresses." },
  { href: "/packages", title: "Packages", text: "Free websites, hosting, mobile apps, Mark, Mark Master and Hiram packages." },
  { href: "/contact", title: "Contact Us", text: "Enquiries, opinions, suggestions and complaints." },
  { href: "/shop", title: "Shop", text: "MMM Online Store. White mug and English and Turkish ritual book." },
  { href: "/privacy-policy", title: "Privacy Policy", text: "Personal information, log data, cookies and contact." },
  { href: "/the-mark-degree", title: "The Mark Degree", text: "History of the Mark Degree from Portsmouth 1769 to the Grand Mark Lodge of 1856." },
  { href: "/joining-the-mark-degree", title: "Joining the Mark Degree", text: "A Master Mason may be advanced. Psalm 118 and the stone the builders rejected." },
  { href: "/turkey-earthquake-appeal", title: "Turkey Earthquake Appeal", text: "Appeal following the earthquakes in Turkey." },
  ...provinces.map((province) => ({
    href: province.href,
    title: province.name,
    text: `Grand or District Lodge site for ${province.name}. Opens the live country page.`,
  })),
];
