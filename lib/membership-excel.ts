import * as XLSX from "xlsx";
import type { LodgeRosterMember } from "@/lib/types";

type RawRow = Record<string, unknown>;

function clean(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  const text = String(value).trim();
  if (!text || text === "---" || text.toLowerCase() === "none" || text.toLowerCase() === "nan") {
    return "";
  }
  return text;
}

function cleanDate(value: unknown): string | null {
  const text = clean(value);
  return text || null;
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const HEADER_ALIASES: Record<string, string> = {
  brotherno: "brother_no",
  brothernumber: "brother_no",
  membershipno: "brother_no",
  membershipnumber: "brother_no",
  surname: "surname",
  lastname: "surname",
  givennames: "given_names",
  givenname: "given_names",
  firstname: "given_names",
  forenames: "given_names",
  prefix: "prefix",
  initials: "initials",
  title: "title",
  suffix: "suffix",
  homephone: "home_phone",
  phone: "home_phone",
  telephone: "home_phone",
  mobile: "mobile",
  mobilephone: "mobile",
  cellphone: "mobile",
  postcode: "postcode",
  postalcode: "postcode",
  zip: "postcode",
  address: "address",
  address1: "address",
  address2: "address2",
  address3: "address3",
  city: "city",
  town: "city",
  county: "county",
  state: "county",
  email: "email",
  emailaddress: "email",
  country: "country",
  startdate: "start_date",
  enddate: "end_date",
  grandrank: "grand_rank",
  provrank: "prov_rank",
  provincialrank: "prov_rank",
  unitrank: "unit_rank",
  grandrankid: "grand_rank_id",
  provrankid: "prov_rank_id",
  unitrankid: "unit_rank_id",
  unitrankstart: "unit_rank_start",
  provrankstart: "prov_rank_start",
  grandrankstart: "grand_rank_start",
  unitprefix: "unit_prefix",
  provprefix: "prov_prefix",
  grandprefix: "grand_prefix",
  activity: "activity",
  fullname: "full_name",
  name: "full_name",
};

function mapHeaders(rawHeaders: unknown[]) {
  const map = new Map<number, string>();
  rawHeaders.forEach((header, index) => {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (key) map.set(index, key);
  });
  return map;
}

function emptyFields() {
  return {
    brother_no: "",
    surname: "",
    given_names: "",
    prefix: "",
    initials: "",
    title: "",
    suffix: "",
    full_name: "",
    home_phone: "",
    mobile: "",
    postcode: "",
    address: "",
    address2: "",
    address3: "",
    city: "",
    county: "",
    email: "",
    country: "",
    start_date: null as string | null,
    end_date: null as string | null,
    grand_rank: "",
    prov_rank: "",
    unit_rank: "",
    grand_rank_id: "",
    prov_rank_id: "",
    unit_rank_id: "",
    unit_rank_start: null as string | null,
    prov_rank_start: null as string | null,
    grand_rank_start: null as string | null,
    unit_prefix: "",
    prov_prefix: "",
    grand_prefix: "",
    activity: "",
    membership_no: "",
    notes: "",
  };
}

export function parseMembershipExcel(
  buffer: ArrayBuffer | Buffer,
  lodgeSlug: string,
): { members: LodgeRosterMember[]; error?: string } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { members: [], error: "Excel file has no sheets." };
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(unknown | RawRow)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!rows.length) return { members: [], error: "Excel sheet is empty." };

  const headerMap = mapHeaders(rows[0] ?? []);
  if (!headerMap.size) {
    return {
      members: [],
      error:
        "Could not recognise columns. Use the FWB-style headers (BrotherNo, Surname, GivenNames, Email, Address…).",
    };
  }

  const members: LodgeRosterMember[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] ?? [];
    if (!row.some((cell) => clean(cell))) continue;

    const fields = emptyFields();
    headerMap.forEach((field, index) => {
      const value = row[index];
      if (field.endsWith("_date") || field.endsWith("_start")) {
        (fields as Record<string, string | null>)[field] = cleanDate(value);
      } else if (field === "email") {
        fields.email = clean(value).toLowerCase();
      } else {
        (fields as Record<string, string | null>)[field] = clean(value);
      }
    });

    const fullName =
      fields.full_name ||
      [fields.given_names, fields.surname].filter(Boolean).join(" ") ||
      [fields.prefix, fields.surname].filter(Boolean).join(" ");
    if (!fullName && !fields.brother_no && !fields.email) continue;

    const brotherNo = fields.brother_no;
    members.push({
      id: `${lodgeSlug}-${brotherNo || r}`,
      lodge_slug: lodgeSlug,
      ...fields,
      full_name: fullName || brotherNo || fields.email || `Member ${r}`,
      membership_no: brotherNo || fields.membership_no,
      notes: fields.notes || fields.activity,
      active: !fields.end_date,
      created_at: new Date().toISOString(),
    });
  }

  if (!members.length) {
    return { members: [], error: "No member rows found in the Excel file." };
  }
  return { members };
}
