import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMarkSite } from "@/lib/mark-sites";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getMarkSite(slug);
  return { title: `Contact · ${site?.fullName ?? "Mark Site"}` };
}

export default async function LodgeContactPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getMarkSite(slug);
  if (!site) notFound();

  return (
    <article className="lodge-page">
      <h1>Contact Us</h1>
      <p>Enquiries for {site.fullName}:</p>
      <p>
        {site.addressLines.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </p>
      <p>WhatsApp / Telegram: {site.phone}</p>
      <p>
        Or use the main portal <Link href="/contact">contact form</Link>.
      </p>
    </article>
  );
}
