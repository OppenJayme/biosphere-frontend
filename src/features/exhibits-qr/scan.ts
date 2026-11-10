/** Decides whether a scanned QR code may be opened by the public "Scan Another Specimen" scanner. */

import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "./form";

/**
 * The in-site path for a scanned BioSphere exhibit label, or null for anything else. Only a URL on
 * this site's own origin pointing at /exhibits/<slug> is accepted, so the scanner can never send a
 * visitor to another site or to a non-exhibit page, whatever the scanned code contains. Query
 * strings and fragments are dropped: exhibit labels never carry them.
 */
export function exhibitPathFromScan(raw: string, origin: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;

  const match = /^\/exhibits\/([^/]+)\/?$/.exec(url.pathname);
  const slug = match?.[1];
  if (!slug || slug.length > SLUG_MAX_LENGTH || !SLUG_PATTERN.test(slug)) return null;
  return `/exhibits/${slug}`;
}
