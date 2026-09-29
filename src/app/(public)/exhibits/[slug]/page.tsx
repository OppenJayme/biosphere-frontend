import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ExhibitUnavailable } from "@/components/exhibits/public/ExhibitUnavailable";
import { ExhibitViewer } from "@/components/exhibits/public/ExhibitViewer";
import { getPublicExhibit } from "@/features/exhibits-qr/api";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/features/exhibits-qr/form";

// Every exhibit page is unlisted: reachable only through its QR code or direct URL, never linked
// from public navigation and never indexed (REQ-4.12-07).
const UNLISTED = { index: false, follow: false } as const;

type ExhibitPageProps = { params: Promise<{ slug: string }> };

type LoadResult =
  | { kind: "ok"; exhibit: NonNullable<Awaited<ReturnType<typeof getPublicExhibit>>> }
  | { kind: "unavailable" }
  | { kind: "error" };

/** One backend call per request, shared by the metadata and the page. */
const loadExhibit = cache(async (slug: string): Promise<LoadResult> => {
  if (slug.length > SLUG_MAX_LENGTH || !SLUG_PATTERN.test(slug)) return { kind: "unavailable" };
  try {
    const exhibit = await getPublicExhibit(slug);
    return exhibit ? { kind: "ok", exhibit } : { kind: "unavailable" };
  } catch {
    return { kind: "error" };
  }
});

export async function generateMetadata({ params }: ExhibitPageProps): Promise<Metadata> {
  const result = await loadExhibit((await params).slug);
  if (result.kind !== "ok") return { title: "Exhibit unavailable", robots: UNLISTED };

  const { exhibit } = result;
  return {
    title: exhibit.commonName ?? exhibit.scientificName ?? "Exhibit",
    description: exhibit.publicDescription ?? undefined,
    robots: UNLISTED,
  };
}

export default async function ExhibitPage({ params }: ExhibitPageProps) {
  const result = await loadExhibit((await params).slug);

  // Missing, unpublished, disabled, and archived pages all look the same (REQ-4.12-09).
  if (result.kind === "unavailable") notFound();
  if (result.kind === "error") return <ExhibitUnavailable reason="error" />;

  return <ExhibitViewer exhibit={result.exhibit} />;
}
