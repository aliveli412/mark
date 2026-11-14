import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
    title: province.name,
    alternates: { canonical: province.liveUrl },
  };
}

/** Alias route: /districts/belgium → https://www.markmastermasons.com/belgium/ */
export default async function DistrictCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const province = getProvinceBySlug(slug);
  if (!province) notFound();
  // Permanent external redirect to the published country Mark Site.
  redirect(province.liveUrl);
}
