/**
 * Shared cross-site guard for same-origin route handlers in src/app/api.
 *
 * Behind a reverse proxy, `request.url` carries the server's internal address
 * (e.g. http://localhost:3000) while the browser sends the public Origin
 * (e.g. https://biosphere.dcism.org), so comparing against `request.url`
 * rejects every real request. Set APP_ORIGIN to the public origin in deployed
 * environments. When it is unset (local dev), the request URL's origin is used.
 *
 * Invariants:
 * - `Sec-Fetch-Site: cross-site` is always rejected.
 * - A request without an Origin header is allowed (same as before); backend
 *   authentication and authorization remain authoritative.
 * - A malformed APP_ORIGIN fails closed instead of disabling the check.
 */
export function getExpectedOrigin(request: Request): string | null {
  const configured = process.env.APP_ORIGIN?.trim();
  if (!configured) return new URL(request.url).origin;
  try {
    return new URL(configured).origin;
  } catch {
    console.error("APP_ORIGIN is not a valid URL; rejecting state-changing requests.");
    return null;
  }
}

export function isCrossSiteRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (origin === null) return false;
  const expected = getExpectedOrigin(request);
  return expected === null || origin !== expected;
}
