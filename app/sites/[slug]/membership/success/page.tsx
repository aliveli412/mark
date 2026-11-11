import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarkSite, lodgePath } from "@/lib/mark-sites";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getMarkSite(slug);
  return { title: `Membership activated · ${site?.fullName ?? "Mark Site"}` };
}

export default async function MembershipSuccessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getMarkSite(slug);
  if (!site) notFound();

  return (
    <article className="lodge-page">
      <h1>Membership payment received</h1>
      <p>
        Thank you. Stripe has confirmed your {site.brand} membership payment. Your membership will show as active
        once the webhook updates the lodge records.
      </p>
      <p>
        <Link href={lodgePath(slug, "membership")}>Back to membership</Link>
      </p>
    </article>
  );
}
