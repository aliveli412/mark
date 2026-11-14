export type Province = {
  name: string;
  href: string;
  /** Approximate map marker (WGS84). */
  lat: number;
  lng: number;
};

export const provinces: Province[] = [
  { name: "Belgium", href: "https://www.markmastermasons.com/belgium/", lat: 50.85, lng: 4.35 },
  { name: "Bolivia", href: "https://www.markmastermasons.com/bolivia/", lat: -16.29, lng: -63.59 },
  { name: "Bombay", href: "https://www.markmastermasons.com/bombay/", lat: 19.08, lng: 72.88 },
  { name: "Brazil", href: "https://www.markmastermasons.com/brazil/", lat: -14.24, lng: -51.93 },
  { name: "Channel Islands", href: "https://www.markmastermasons.com/channelislands/", lat: 49.37, lng: -2.36 },
  { name: "Cyprus", href: "https://www.markmastermasons.com/cyprus/", lat: 35.13, lng: 33.43 },
  { name: "East Africa", href: "https://www.markmastermasons.com/eastafrica/", lat: -1.29, lng: 36.82 },
  { name: "England", href: "https://www.markmastermasons.com/england/", lat: 52.36, lng: -1.17 },
  { name: "Germany", href: "https://www.markmastermasons.com/germany/", lat: 51.17, lng: 10.45 },
  { name: "Ghana", href: "https://www.markmastermasons.com/ghana/", lat: 7.95, lng: -1.02 },
  { name: "Gibraltar", href: "https://www.markmastermasons.com/gibraltar/", lat: 36.14, lng: -5.35 },
  { name: "Hong Kong", href: "https://www.markmastermasons.com/hongkong/", lat: 22.32, lng: 114.17 },
  { name: "Italy", href: "https://www.markmastermasons.com/italy/", lat: 41.87, lng: 12.57 },
  { name: "Jamaica & Cayman", href: "https://www.markmastermasons.com/jamaica-cayman/", lat: 18.11, lng: -77.3 },
  { name: "Madras", href: "https://www.markmastermasons.com/madras/", lat: 13.08, lng: 80.27 },
  { name: "Natal", href: "https://www.markmastermasons.com/natal/", lat: -29.86, lng: 31.02 },
  { name: "Netherlands", href: "https://www.markmastermasons.com/netherlands/", lat: 52.13, lng: 5.29 },
  { name: "New Zealand", href: "https://www.markmastermasons.com/new-zealand/", lat: -40.9, lng: 174.89 },
  { name: "Nigeria", href: "https://www.markmastermasons.com/nigeria/", lat: 9.08, lng: 8.68 },
  { name: "River Plate", href: "https://www.markmastermasons.com/river-plate/", lat: -34.6, lng: -58.38 },
  { name: "Romania", href: "https://www.markmastermasons.com/romania/", lat: 45.94, lng: 24.97 },
  { name: "Singapore", href: "https://www.markmastermasons.com/singapore/", lat: 1.35, lng: 103.82 },
  {
    name: "South Africa (Eastern Division)",
    href: "https://www.markmastermasons.com/safricaeasterndivision/",
    lat: -33.02,
    lng: 27.91,
  },
  {
    name: "South and East Caribbean",
    href: "https://www.markmastermasons.com/southandeastcaribbean/",
    lat: 13.19,
    lng: -59.54,
  },
  { name: "Spain", href: "https://www.markmastermasons.com/spain/", lat: 40.46, lng: -3.75 },
  { name: "Sri Lanka", href: "https://www.markmastermasons.com/srilanka/", lat: 7.87, lng: 80.77 },
  { name: "The Transvaal", href: "https://www.markmastermasons.com/thetransvaal/", lat: -26.2, lng: 28.04 },
  { name: "Zimbabwe", href: "https://www.markmastermasons.com/zimbabwe/", lat: -19.02, lng: 29.15 },
];

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
];
