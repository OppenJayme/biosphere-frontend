/**
 * Shared loading for the intercepted edit dialogs. Mirrors the full edit pages' guards: a bad id is
 * a 404, a missing session goes to login, and archived records stay read-only.
 */

import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { RouteModal } from "@/components/ui/RouteModal";
import { getSpecimenDetails } from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

type SpecimenDetail = Awaited<ReturnType<typeof getSpecimenDetails>>;

export async function loadSpecimenForModal(
  id: string,
  path: string,
): Promise<{ detail: SpecimenDetail } | { notice: string }> {
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/${path}`)}`);
  }
  try {
    const detail = await getSpecimenDetails(id);
    if (detail.specimen.status === "ARCHIVED") {
      return { notice: "Archived specimen records are read-only and cannot be edited." };
    }
    return { detail };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return {
      notice: "The editor could not be loaded. Existing data has not been changed. Check your connection and try again.",
    };
  }
}

export function ModalNotice({ title, notice }: { title: string; notice: string }) {
  return (
    <RouteModal title={title}>
      <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {notice}
      </p>
    </RouteModal>
  );
}
