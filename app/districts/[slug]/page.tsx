import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DistrictContent } from "@/components/districts/DistrictContent";
import { districtNavLinks, getDistrictPage, loadDistrictContent } from "@/lib/district-content";
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
  const content = loadDistrictContent(slug);
  const title = content?.pages.home?.title || content?.name || province?.name || "District";
  return {
    title: `${title} · District Lodge`,
    description: `Imported Grand & District Lodge content for ${title}.`,
  };
}

export default async function DistrictHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();

  const content = loadDistrictContent(slug);
  const home = getDistrictPage(slug, "home");
  const nav = districtNavLinks(slug);

  if (home && content) {
    return (
      <>
        <DistrictContent slug={slug} page={home} pages={content.pages} />
        {nav.length ? (
          <section className="district-home-nav" aria-label="District pages">
            <h2>Pages</h2>
            <div className="province-grid">
              {nav.map((item) => (
                <Link key={item.key} href={item.href}>
                  {item.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <p className="district-legacy">
          <a href={province.liveUrl} target="_blank" rel="noreferrer">
            View legacy live site →
          </a>
        </p>
      </>
    );
  }

  return (
    <article className="district-page-content">
      <h1>{province.name}</h1>
      <p className="lede">
        Content for this district has not been imported yet. Run{" "}
        <code>python3 scripts/import-district-sites.py --only {slug}</code>.
      </p>
      <p>
        <Link href="/grand-lodges">← Back to map</Link>
      </p>
    </article>
  );
}
