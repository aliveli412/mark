import { notFound } from "next/navigation";
import { DistrictShell } from "@/components/districts/DistrictShell";
import { districtNavLinks, loadDistrictContent } from "@/lib/district-content";
import { getProvinceBySlug, provinces } from "@/lib/site";

export function generateStaticParams() {
  return provinces.map((province) => ({ slug: province.slug }));
}

export default async function DistrictLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();
  const content = loadDistrictContent(slug);
  const name = content?.name || province.name;
  const nav = districtNavLinks(slug);

  return (
    <DistrictShell slug={slug} name={name} nav={nav}>
      {children}
    </DistrictShell>
  );
}
