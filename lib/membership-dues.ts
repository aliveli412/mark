import type {
  LodgeMembership,
  LodgeMembershipPayment,
  LodgeMembershipSettings,
  LodgeRosterMember,
  MembershipDuesSummary,
  MembershipYearDues,
} from "@/lib/types";

function yearFromDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const match = String(value).match(/^(\d{4})/);
    return match ? Number(match[1]) : null;
  }
  return date.getUTCFullYear();
}

export function membershipStartYear(
  membership: LodgeMembership,
  roster: LodgeRosterMember | null,
) {
  const fromRoster = yearFromDate(roster?.start_date);
  const fromMembership = yearFromDate(membership.created_at);
  const fromMatched = yearFromDate(membership.matched_at);
  const candidates = [fromRoster, fromMembership, fromMatched].filter(
    (year): year is number => typeof year === "number" && year >= 1990,
  );
  return candidates.length ? Math.min(...candidates) : new Date().getFullYear();
}

export function buildDuesSummary(input: {
  membership: LodgeMembership;
  roster: LodgeRosterMember | null;
  settings: LodgeMembershipSettings;
  payments: LodgeMembershipPayment[];
  throughYear?: number;
}): MembershipDuesSummary {
  const currentYear = input.throughYear ?? new Date().getFullYear();
  const startYear = Math.min(membershipStartYear(input.membership, input.roster), currentYear);
  const annual = Math.max(0, input.settings.yearly_pence || 0);

  const paidByYear = new Map<number, number>();
  const waivedYears = new Set<number>();
  for (const payment of input.payments) {
    if (payment.status === "waived") {
      waivedYears.add(payment.year);
      continue;
    }
    if (payment.status === "due") continue;
    paidByYear.set(payment.year, (paidByYear.get(payment.year) ?? 0) + payment.amount_pence);
  }

  const years: MembershipYearDues[] = [];
  for (let year = startYear; year <= currentYear; year += 1) {
    const paid = paidByYear.get(year) ?? 0;
    if (waivedYears.has(year) && paid === 0) {
      years.push({
        year,
        due_pence: 0,
        paid_pence: 0,
        remaining_pence: 0,
        status: "waived",
      });
      continue;
    }
    const due = annual;
    const remaining = Math.max(0, due - paid);
    years.push({
      year,
      due_pence: due,
      paid_pence: paid,
      remaining_pence: remaining,
      status: remaining === 0 ? "paid" : paid > 0 ? "partial" : "due",
    });
  }

  years.reverse(); // newest first

  return {
    current_year: currentYear,
    annual_due_pence: annual,
    total_due_pence: years.reduce((sum, row) => sum + row.due_pence, 0),
    total_paid_pence: years.reduce((sum, row) => sum + row.paid_pence, 0),
    total_remaining_pence: years.reduce((sum, row) => sum + row.remaining_pence, 0),
    years,
  };
}
