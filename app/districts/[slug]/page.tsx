import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBanner } from "@/components/PageBanner";
import { getProvinceBySlug, provinces } from "@/lib/site";

export function generateStaticParams() {
  return provinces.map((province) => ({ slug: province.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) return { title: "District" };
  return {
    title: `${province.name} · District Lodge`,
    description: `Grand & District Lodge page for ${province.name} Mark Master Masons.`,
  };
}

export default async function DistrictCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();

  const others = provinces.filter((item) => item.slug !== province.slug).slice(0, 8);

  return (
    <>
      <PageBanner title={province.name} />
      <div className="wrap page district-page">
        <p className="district-kicker">Grand &amp; District Lodge</p>
        <h2 className="district-heading">{province.name}</h2>
        <p className="lede">
          This is the portal page for the <strong>{province.name}</strong> Mark Master Masons district. Use the map on{" "}
          <Link href="/grand-lodges">Grand Lodges</Link> to browse every district.
        </p>

        <section className="district-card" aria-label={`${province.name} details`}>
          <dl className="district-meta">
            <div>
              <dt>District</dt>
              <dd>{province.name}</dd>
            </div>
            <div>
              <dt>Portal path</dt>
              <dd>
                <code>/districts/{province.slug}</code>
              </dd>
            </div>
            <div>
              <dt>Map position</dt>
              <dd>
                {province.lat.toFixed(2)}°, {province.lng.toFixed(2)}°
              </dd>
            </div>
          </dl>
          <div className="district-actions">
            <Link className="btn" href="/grand-lodges">
              Back to map
            </Link>
            <a className="btn secondary" href={province.liveUrl} target="_blank" rel="noreferrer">
              Open legacy live site
            </a>
          </div>
        </section>

        <section className="district-other" aria-label="Other districts">
          <h3>Other districts</h3>
          <div className="province-grid">
            {others.map((item) => (
              <Link key={item.slug} href={item.href}>
                {item.name}
              </Link>
            ))}
          </div>
          <p>
            <Link href="/grand-lodges">See all on the map →</Link>
          </p>
        </section>
      </div>
    </>
  );
}
