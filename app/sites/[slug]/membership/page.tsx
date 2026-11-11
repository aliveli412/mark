import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MembershipPanel } from "@/components/sites/MembershipPanel";
import {
  getMembershipByAccess,
  getMembershipDashboard,
  getMembershipSettings,
} from "@/lib/data/memberships";
import { formatPence } from "@/lib/format";
import { readMemberSession } from "@/lib/member-session";
import { getMarkSite } from "@/lib/mark-sites";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getMarkSite(slug);
  return { title: `Membership · ${site?.fullName ?? "Mark Site"}` };
}

export default async function LodgeMembershipPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string; code?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const site = getMarkSite(slug);
  if (!site) notFound();

  const settings = await getMembershipSettings(slug);

  let initial = null as Awaited<ReturnType<typeof getMembershipDashboard>> | null;
  if (query.email && query.code) {
    const membership = await getMembershipByAccess(slug, query.email, query.code);
    if (membership) initial = await getMembershipDashboard(membership.id);
  }
  if ((!initial || "error" in initial) ) {
    const session = await readMemberSession(slug);
    if (session) {
      const fromCookie = await getMembershipDashboard(session.membershipId);
      if (!("error" in fromCookie)) initial = fromCookie;
    }
  }

  const boot = initial && !("error" in initial) ? initial : null;

  const signedIn = Boolean(boot?.membership);

  return (
    <article className={`lodge-page membership-page${signedIn ? " membership-page-dash" : ""}`}>
      {signedIn ? null : (
        <>
          <h1>Membership</h1>
          <p>
            Sign in to open your user dashboard: full lodge Excel record, dues paid / outstanding, and payment history.
            Local access code: <code>111111</code>.
          </p>
          <ul className="membership-price-list">
            <li>Yearly dues: {formatPence(settings.yearly_pence)}</li>
            <li>Monthly: {formatPence(settings.monthly_pence)}</li>
            <li>Standing order: {formatPence(settings.standing_order_pence)} / month</li>
          </ul>
        </>
      )}
      {!settings.active ? <p className="error">Membership payments are currently paused for this lodge.</p> : null}
      <MembershipPanel
        lodgeSlug={slug}
        settings={settings}
        initialMembership={boot?.membership ?? null}
        initialRoster={boot?.roster ?? null}
        initialPayments={boot?.payments ?? []}
        initialDues={boot?.dues ?? null}
      />
    </article>
  );
}
