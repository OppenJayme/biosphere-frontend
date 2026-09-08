import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitViewer } from "@/components/exhibits/public/ExhibitViewer";
import { EXHIBITS } from "@/lib/dummy-data/exhibits";

// Every exhibit page is unlisted — reachable only via its QR code or this
// direct URL, never linked from public navigation or search-indexed listings.
const PUBLIC_EXHIBITS = EXHIBITS.filter((exhibit) => exhibit.publishStatus === "Published");

export function generateStaticParams() {
  return PUBLIC_EXHIBITS.map((exhibit) => ({ slug: exhibit.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exhibit = PUBLIC_EXHIBITS.find((e) => e.slug === slug);

  if (!exhibit) return { title: "Exhibit" };

  return {
    title: exhibit.commonName,
    description: exhibit.description,
  };
}

export default async function ExhibitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exhibit = PUBLIC_EXHIBITS.find((e) => e.slug === slug);

  if (!exhibit) notFound();

  return <ExhibitViewer exhibit={exhibit} />;
}
