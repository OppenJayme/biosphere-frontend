/**
 * Protected Cataloging page for viewing and managing one specimen's tag relationships.
 * Shared vocabulary persistence and authorization remain owned by the NestJS backend.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenTagManager } from "@/components/specimens/SpecimenTagManager";
import {
  getSpecimen,
  listSpecimenTags,
  searchAvailableTags,
} from "@/features/specimens/api";
import { parseTagSearch } from "@/features/specimens/tag-form";
import type { SpecimenTag } from "@/features/specimens/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Tags",
};

type SpecimenTagsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SpecimenTagsPage({
  params,
  searchParams,
}: SpecimenTagsPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/tags`)}`);
  }

  const rawSearchParams = await searchParams;
  const search = parseTagSearch(rawSearchParams.search);
  let specimen;
  let currentTags;
  try {
    // Core and attached-tag reads are independent and intentionally exclude inventory data.
    [specimen, currentTags] = await Promise.all([
      getSpecimen(id),
      listSpecimenTags(id),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <LoadError specimenId={id} />;
  }

  let availableTags: SpecimenTag[] = [];
  if (specimen.status !== "ARCHIVED") {
    try {
      availableTags = await searchAvailableTags(search);
    } catch {
      return <LoadError specimenId={id} />;
    }
  }

  // Existing relationships are omitted from suggestions but remain visible above.
  const attachedNames = new Set(currentTags.map((tag) => tag.name.toLocaleLowerCase()));
  const suggestions = availableTags.filter(
    (tag) => !attachedNames.has(tag.name.toLocaleLowerCase()),
  );
  const specimenName =
    specimen.accessionNumber ?? specimen.scientificName ?? specimen.commonName ?? "Unnamed specimen";
  const notice =
    firstValue(rawSearchParams.tag) === "attached"
      ? "The tag was attached and recorded in revision history."
      : firstValue(rawSearchParams.tag) === "existing"
        ? "That tag was already attached; no duplicate relationship was created."
        : firstValue(rawSearchParams.tag) === "detached"
          ? "The tag was detached from this specimen. The shared vocabulary was retained."
          : null;

  return (
    <div className="space-y-5">
      <BackLink specimenId={id} />
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {specimenName}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">
          Specimen tags
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Maintain searchable catalog descriptors without changing inventory or storage data.
        </p>
      </header>

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {notice}
        </div>
      )}

      <SpecimenTagManager
        specimenId={id}
        currentTags={currentTags}
        availableTags={suggestions}
        search={search}
        readOnly={specimen.status === "ARCHIVED"}
      />
    </div>
  );
}

function BackLink({ specimenId }: { specimenId: string }) {
  return (
    <Link href={`/specimens/${specimenId}`} className="text-sm font-semibold text-forest-800 hover:underline">
      ← Back to specimen details
    </Link>
  );
}

function LoadError({ specimenId }: { specimenId: string }) {
  return (
    <div className="space-y-5">
      <BackLink specimenId={specimenId} />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">The specimen tags could not be loaded.</p>
        <p className="mt-1 text-amber-900">
          Check your connection and try again. Existing tag relationships were not changed.
        </p>
        <Link href={`/specimens/${specimenId}/tags`} className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800">
          Retry
        </Link>
      </div>
    </div>
  );
}
