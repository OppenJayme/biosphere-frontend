import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Route prefixes that require an authenticated curator — one entry per
// src/app/(curator)/ page. Route groups don't affect the URL, so these are
// NOT prefixed with "/curator".
// NOTE: the curator's QR-exhibit manager lives at the exact path "/exhibits"
// (src/app/(curator)/exhibits/), while unlisted public exhibit pages live at
// "/exhibits/<slug>" (src/app/(public)/exhibits/[slug]/) — same URL prefix,
// different route group. "/exhibits" below is an EXACT match only — a prefix
// match would also lock out the public QR pages.
const PROTECTED_EXACT_PATHS = ["/exhibits"];
const PROTECTED_PREFIX_PATHS = [
  "/dashboard",
  "/specimens",
  "/storage",
  "/cataloging",
  "/audit-logs",
  "/public-website",
  "/reports",
  "/users",
];

const LOGIN_PATH = "/login";

// .env.local now has real Supabase credentials, so the gate is live.
const AUTH_GATE_ENABLED: boolean = true;

export async function proxy(request: NextRequest) {
  if (!AUTH_GATE_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const isProtected =
    PROTECTED_EXACT_PATHS.includes(pathname) ||
    PROTECTED_PREFIX_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  // Cheap optimistic check only — refreshes the Supabase session cookie and
  // redirects if it's missing/expired. The real check is verifySession() in
  // lib/session.ts, re-run inside every Server Action/data call, since this
  // matcher can drift out of sync with the routes it's meant to protect.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets, image optimization, and metadata files.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
