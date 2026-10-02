import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExhibitViewer } from "@/components/exhibits/public/ExhibitViewer";
import { getPublicExhibit } from "@/features/exhibits-qr/api";
import { sortExhibitMedia, titleFromSlug } from "@/features/exhibits-qr/types";

// Every exhibit page is unlisted — reachable only via its QR code or this
// direct URL, never linked from public navigation or search-indexed listings.
// getPublicExhibit is uncached, so publish/disable takes effect immediately and
// the short-lived image links are fresh on every visit.

type ExhibitPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ExhibitPageProps): Promise<Metadata> {
  const { slug } = await params;
  const exhibit = await getPublicExhibit(slug).catch(() => null);
  if (!exhibit) return { title: "Exhibit", robots: { index: false } };

  return {
    title: titleFromSlug(exhibit.publicSlug),
    description: exhibit.publicDescription ?? undefined,
    robots: { index: false },
  };
}

export default async function ExhibitPage({ params }: ExhibitPageProps) {
  const { slug } = await params;
  const exhibit = await getPublicExhibit(slug);
  if (!exhibit) notFound();

  return (
    <ExhibitViewer
      exhibit={{ ...exhibit, media: sortExhibitMedia(exhibit.media) }}
      title={titleFromSlug(exhibit.publicSlug)}
    />
  );
}
