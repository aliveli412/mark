import * as XLSX from "xlsx";
import type { LodgeRosterMember } from "@/lib/types";

/** Every Excel column we import (FWB As_of_06-06-2022.xlsx and compatible exports). */
export const MEMBERSHIP_EXCEL_FIELDS = [
  "brother_no",
  "surname",
  "given_names",
  "prefix",
  "initials",
  "title",
  "suffix",
  "home_phone",
  "mobile",
  "postcode",
  "address",
  "address2",
  "address3",
  "city",
  "county",
  "email",
  "country",
  "start_date",
  "end_date",
  "grand_rank",
  "prov_rank",
  "unit_rank",
  "grand_rank_id",
  "prov_rank_id",
  "unit_rank_id",
  "unit_rank_start",
  "prov_rank_start",
  "grand_rank_start",
  "unit_prefix",
  "prov_prefix",
  "grand_prefix",
  "activity",
] as const;

export type MembershipExcelField = (typeof MEMBERSHIP_EXCEL_FIELDS)[number];

function isBlankMarker(text: string) {
  const lower = text.toLowerCase();
  return !text || text === "---" || lower === "none" || lower === "nan" || lower === "n/a" || lower === "null";
}

/** Prefer Excel display text so phones/ids keep formatting when available. */
function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Number.isInteger(value)) return String(value);
    return String(value);
  }
  return String(value).trim();
}

function clean(value: unknown): string {
  const text = cellText(value);
  if (isBlankMarker(text)) return "";
  return text;
}

function cleanId(value: unknown): string {
  const text = clean(value);
  if (!text || text === "0") return "";
  return text;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function cleanDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = clean(value);
  if (!text) return null;
  // Excel serial sometimes arrives as plain number string
  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);
    if (serial > 20000 && serial < 80000) {
      const parsed = XLSX.SSF.parse_date_code(serial);
      if (parsed) return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  // Locale display from Excel (e.g. 10/30/21 or 30/10/2021)
  const slash = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    let year = Number(slash[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    // Prefer MDY when first part > 12 is impossible → DMY; else assume MDY (Excel US display)
    let month = a;
    let day = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return text;
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const HEADER_ALIASES: Record<string, MembershipExcelField | "full_name"> = {
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
  const map = new Map<number, MembershipExcelField | "full_name">();
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
): { members: LodgeRosterMember[]; error?: string; mappedColumns: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, cellText: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { members: [], mappedColumns: [], error: "Excel file has no sheets." };
  const sheet = workbook.Sheets[sheetName];
  // raw:false → formatted display strings (phones/dates as shown in Excel)
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  }) as unknown[][];

  if (!rows.length) return { members: [], mappedColumns: [], error: "Excel sheet is empty." };

  const headerMap = mapHeaders(rows[0] ?? []);
  const mappedColumns = [...new Set([...headerMap.values()])];
  if (!headerMap.size) {
    return {
      members: [],
      mappedColumns: [],
      error:
        "Could not recognise columns. Use the FWB-style headers (BrotherNo, Surname, GivenNames, Email, Address, ranks, Activity…).",
    };
  }

  const members: LodgeRosterMember[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] ?? [];
    if (!row.some((cell) => clean(cell))) continue;

    const fields = emptyFields();
    headerMap.forEach((field, index) => {
      const value = row[index];
      if (field === "full_name") {
        fields.full_name = clean(value);
        return;
      }
      if (field.endsWith("_date") || field.endsWith("_start")) {
        (fields as Record<string, string | null>)[field] = cleanDate(value);
        return;
      }
      if (field === "email") {
        fields.email = clean(value).toLowerCase();
        return;
      }
      if (field.endsWith("_rank_id")) {
        (fields as Record<string, string>)[field] = cleanId(value);
        return;
      }
      (fields as Record<string, string>)[field] = clean(value);
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
    return { members: [], mappedColumns, error: "No member rows found in the Excel file." };
  }
  return { members, mappedColumns };
}
