import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MembershipPanel } from "@/components/sites/MembershipPanel";
import { getMembershipByAccess, getMembershipSettings } from "@/lib/data/memberships";
import { formatPence } from "@/lib/format";
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
  const initial =
    query.email && query.code ? await getMembershipByAccess(slug, query.email, query.code) : null;

  return (
    <article className="lodge-page membership-page">
      <h1>Membership</h1>
      <p>
        Register with the email held on the {site.brand} member list. Once matched, activate dues by monthly,
        yearly, or standing order.
      </p>
      <ul className="membership-price-list">
        <li>Monthly: {formatPence(settings.monthly_pence)}</li>
        <li>Yearly: {formatPence(settings.yearly_pence)}</li>
        <li>Standing order: {formatPence(settings.standing_order_pence)} / month</li>
      </ul>
      {!settings.active ? <p className="error">Membership payments are currently paused for this lodge.</p> : null}
      <MembershipPanel lodgeSlug={slug} settings={settings} initialMembership={initial} />
    </article>
  );
}
