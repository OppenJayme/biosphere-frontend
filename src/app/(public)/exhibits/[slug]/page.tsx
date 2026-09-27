import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitViewer } from "@/components/exhibits/public/ExhibitViewer";
import { ApiError } from "@/lib/api-client";
import { getPublishedExhibit } from "@/features/exhibits-qr/api";

// Every exhibit page is unlisted — reachable only via its QR code or this
// direct URL, never linked from public navigation or search-indexed listings.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let exhibit;
  try {
    exhibit = await getPublishedExhibit(slug);
  } catch {
    return { title: "Exhibit" };
  }

  return {
    title: exhibit.publicSlug,
    description: exhibit.publicDescription ?? "A published BioSphere museum exhibit.",
  };
}

export default async function ExhibitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let exhibit;

  try {
    exhibit = await getPublishedExhibit(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return <ExhibitViewer exhibit={exhibit} />;
}
