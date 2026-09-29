/** Public (no account) Server Action for the QR exhibit page's AR models. */

"use server";

import { getPublicExhibit } from "./api";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "./form";
import type { PublicExhibit } from "./types";

export type ArRefreshResult =
  | { status: "ok"; ar: PublicExhibit["ar"] }
  | { status: "unavailable" }
  | { status: "error" };

/**
 * Model URLs are signed for about 15 minutes, so the page asks for fresh ones when the visitor
 * opens the AR viewer. This also catches AR (or the whole page) being turned off since page load.
 */
export async function refreshExhibitArAction(slug: string): Promise<ArRefreshResult> {
  if (typeof slug !== "string" || slug.length > SLUG_MAX_LENGTH || !SLUG_PATTERN.test(slug)) {
    return { status: "unavailable" };
  }
  try {
    const exhibit = await getPublicExhibit(slug);
    if (!exhibit || !exhibit.ar.available || exhibit.ar.models.length === 0) return { status: "unavailable" };
    return { status: "ok", ar: exhibit.ar };
  } catch {
    return { status: "error" };
  }
}
