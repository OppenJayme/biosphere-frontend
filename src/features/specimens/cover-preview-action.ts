/** Read-only Cataloging preview; backend guards remain authoritative for access. */
"use server";

import { z } from "zod";
import { verifySession } from "@/lib/session";
import { ApiError } from "@/lib/api-client";
import { getSpecimenMediaSignedUrl, listSpecimenMedia } from "./api";

export type CoverPreviewResult =
  | { kind: "image"; signedUrl: string; caption: string | null }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export async function getSpecimenCoverPreview(specimenId: string): Promise<CoverPreviewResult> {
  try {
    if (!(await verifySession())) {
      return { kind: "error", message: "Your session expired. Sign in to view the cover image." };
    }
    if (!z.uuid().safeParse(specimenId).success) {
      return { kind: "error", message: "The specimen identifier is invalid. Reload the catalog." };
    }
    const signal = AbortSignal.timeout(10_000);
    const media = await listSpecimenMedia(specimenId, signal);
    const cover = media.find((item) => item.isCover && item.specimenId === specimenId);
    if (!cover) return { kind: "empty" };
    const signed = await getSpecimenMediaSignedUrl(specimenId, cover.id, signal);
    if (signed.mediaId !== cover.id) throw new Error("Unexpected cover response");
    // Return only presentation data, never storage paths or session credentials.
    return { kind: "image", signedUrl: signed.signedUrl, caption: cover.caption };
  } catch (error) {
    const message =
      error instanceof ApiError && error.status === 401
        ? "Your session expired. Sign in to view the cover image."
        : error instanceof ApiError && error.status === 403
          ? "You do not have permission to view this cover image."
          : error instanceof ApiError && error.status === 404
            ? "The specimen or cover image is no longer available."
            : "The cover image could not be loaded. Try again.";
    return { kind: "error", message };
  }
}
