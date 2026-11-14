import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DistrictContent } from "@/components/districts/DistrictContent";
import { getDistrictPage, listDistrictPageKeys, loadDistrictContent } from "@/lib/district-content";
import { getProvinceBySlug, provinces } from "@/lib/site";

export function generateStaticParams() {
  const params: Array<{ slug: string; page: string[] }> = [];
  for (const province of provinces) {
    for (const key of listDistrictPageKeys(province.slug)) {
      params.push({ slug: province.slug, page: key.split("/") });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  const key = page.join("/");
  const contentPage = getDistrictPage(slug, key);
  const province = getProvinceBySlug(slug);
  return {
    title: `${contentPage?.title || key} · ${province?.name || slug}`,
  };
}

export default async function DistrictNestedPage({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}) {
  const { slug, page } = await params;
  if (!getProvinceBySlug(slug)) notFound();
  const key = page.join("/");
  const content = loadDistrictContent(slug);
  const contentPage = getDistrictPage(slug, key);
  if (!content || !contentPage) notFound();

  return (
    <>
      <p className="district-crumb">
        <Link href={`/districts/${slug}`}>{content.name || slug}</Link>
        <span> / </span>
        <span>{contentPage.title}</span>
      </p>
      <DistrictContent slug={slug} page={contentPage} pages={content.pages} />
    </>
  );
}
