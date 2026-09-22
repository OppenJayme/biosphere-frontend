/**
 * Protected Cataloging page for private specimen images and display metadata.
 * It reads short-lived previews but leaves authorization, storage, and auditing to NestJS.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import {
  SpecimenMediaManager,
  type SpecimenMediaWithPreview,
} from "@/components/specimens/SpecimenMediaManager";
import {
  getSpecimen,
  getSpecimenMediaSignedUrl,
  listSpecimenMedia,
} from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Media",
};

type SpecimenMediaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SpecimenMediaPage({
  params,
  searchParams,
}: SpecimenMediaPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/media`)}`);
  }

  let specimen;
  let media;
  try {
    [specimen, media] = await Promise.all([getSpecimen(id), listSpecimenMedia(id)]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <LoadError specimenId={id} />;
  }

  // One expired or unavailable signed URL must not hide otherwise valid media metadata.
  const signedResults = await Promise.allSettled(
    media.map((item) => getSpecimenMediaSignedUrl(id, item.id)),
  );
  const mediaWithPreviews: SpecimenMediaWithPreview[] = media.map((item, index) => ({
    ...item,
    signedUrl:
      signedResults[index]?.status === "fulfilled"
        ? signedResults[index].value.signedUrl
        : null,
  }));
  const unavailablePreviewCount = mediaWithPreviews.filter((item) => !item.signedUrl).length;

  const rawSearchParams = await searchParams;
  const noticeValue = firstValue(rawSearchParams.media);
  const notice =
    noticeValue === "updated"
      ? "The image caption or display order was updated."
      : noticeValue === "cover"
        ? "The specimen cover image was updated."
        : noticeValue === "removed"
          ? "The specimen image was removed."
          : noticeValue === "removed-cleanup"
            ? "The media record was removed, but its private object requires administrator cleanup."
            : null;
  const specimenName =
    specimen.accessionNumber ?? specimen.scientificName ?? specimen.commonName ?? "Unnamed specimen";

  return (
    <div className="space-y-5">
      <Link href={`/specimens/${id}`} className="text-sm font-semibold text-forest-800 hover:underline">
        ← Back to specimen details
      </Link>
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{specimenName}</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">Specimen media</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Manage private catalog images, captions, display order, and the specimen cover image.
        </p>
      </header>

      {notice && (
        <div role="status" className={`rounded-lg border px-4 py-3 text-sm font-medium ${noticeValue === "removed-cleanup" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
          {notice}
        </div>
      )}
      {unavailablePreviewCount > 0 && (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {unavailablePreviewCount} private image preview{unavailablePreviewCount === 1 ? " is" : "s are"} temporarily unavailable. Its metadata remains accessible.
        </div>
      )}

      <SpecimenMediaManager
        specimenId={id}
        media={mediaWithPreviews}
        readOnly={specimen.status === "ARCHIVED"}
      />
    </div>
  );
}

function LoadError({ specimenId }: { specimenId: string }) {
  return (
    <div className="space-y-5">
      <Link href={`/specimens/${specimenId}`} className="text-sm font-semibold text-forest-800 hover:underline">
        ← Back to specimen details
      </Link>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">Specimen media could not be loaded.</p>
        <p className="mt-1">Check your connection and try again. Existing images were not changed.</p>
        <Link href={`/specimens/${specimenId}/media`} className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800">
          Retry
        </Link>
      </div>
    </div>
  );
}
