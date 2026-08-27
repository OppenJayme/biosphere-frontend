import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: replace with real session validation once auth is implemented
// (e.g. verify a JWT/session token against the NestJS backend).
// This only checks that a cookie is present — it does NOT verify it.
const SESSION_COOKIE_NAME = "biosphere_session";

// Route prefixes that require an authenticated curator.
// Adjust once it's decided whether this app is the public site or the curator PWA.
const PROTECTED_PATHS = ["/dashboard", "/curator"];

const LOGIN_PATH = "/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME);

  if (!session) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except static assets, image optimization, and metadata files.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
