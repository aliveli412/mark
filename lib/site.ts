export const provinces = [
  { name: "Belgium", href: "https://www.markmastermasons.com/belgium/" },
  { name: "Bolivia", href: "https://www.markmastermasons.com/bolivia/" },
  { name: "Bombay", href: "https://www.markmastermasons.com/bombay/" },
  { name: "Brazil", href: "https://www.markmastermasons.com/brazil/" },
  { name: "Channel Islands", href: "https://www.markmastermasons.com/channelislands/" },
  { name: "Cyprus", href: "https://www.markmastermasons.com/cyprus/" },
  { name: "East Africa", href: "https://www.markmastermasons.com/eastafrica/" },
  { name: "England", href: "https://www.markmastermasons.com/england/" },
  { name: "Germany", href: "https://www.markmastermasons.com/germany/" },
  { name: "Ghana", href: "https://www.markmastermasons.com/ghana/" },
  { name: "Gibraltar", href: "https://www.markmastermasons.com/gibraltar/" },
  { name: "Hong Kong", href: "https://www.markmastermasons.com/hongkong/" },
  { name: "Italy", href: "https://www.markmastermasons.com/italy/" },
  { name: "Jamaica & Cayman", href: "https://www.markmastermasons.com/jamaica-cayman/" },
  { name: "Madras", href: "https://www.markmastermasons.com/madras/" },
  { name: "Natal", href: "https://www.markmastermasons.com/natal/" },
  { name: "Netherlands", href: "https://www.markmastermasons.com/netherlands/" },
  { name: "New Zealand", href: "https://www.markmastermasons.com/new-zealand/" },
  { name: "Nigeria", href: "https://www.markmastermasons.com/nigeria/" },
  { name: "River Plate", href: "https://www.markmastermasons.com/river-plate/" },
  { name: "Romania", href: "https://www.markmastermasons.com/romania/" },
  { name: "Singapore", href: "https://www.markmastermasons.com/singapore/" },
  { name: "South Africa (Eastern Division)", href: "https://www.markmastermasons.com/safricaeasterndivision/" },
  { name: "South and East Caribbean", href: "https://www.markmastermasons.com/southandeastcaribbean/" },
  { name: "Spain", href: "https://www.markmastermasons.com/spain/" },
  { name: "Sri Lanka", href: "https://www.markmastermasons.com/srilanka/" },
  { name: "The Transvaal", href: "https://www.markmastermasons.com/thetransvaal/" },
  { name: "Zimbabwe", href: "https://www.markmastermasons.com/zimbabwe/" },
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

export const products = [
  {
    slug: "325-ml-white-mug",
    name: "325 ml – White Mug",
    price: 4.5,
    image: "/images/mug.jpg",
    canAdd: false,
  },
  {
    slug: "english-turkish-ritual-no-1",
    name: "English & Turkish Ritual No. 1",
    price: 7.5,
    image: "/images/ritual.jpg",
    canAdd: true,
  },
];

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

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
