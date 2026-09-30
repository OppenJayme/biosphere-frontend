import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Geist, Playfair_Display } from "next/font/google";
import { CuratorChrome } from "@/components/curator/CuratorChrome";
import { LogoMark } from "@/components/layout/LogoMark";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";
import { signOut } from "@/features/auth/actions";
import { getCurrentAccount } from "@/features/auth/api";
import type { CurrentUserProfile } from "@/features/auth/types";
import { verifySession } from "@/lib/session";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Curator Dashboard",
    template: "%s | BioSphere Curator",
  },
  description: "BioSphere Inventory curator dashboard for the USC Biological Museum.",
};

export default async function CuratorLayout({ children }: { children: ReactNode }) {
  const user = await verifySession();
  if (!user) redirect("/login");

  let profile: CurrentUserProfile | null = null;
  try {
    profile = await getCurrentAccount();
  } catch {
    profile = null;
  }

  // The Developer role never gets the curator workspace (REQ-4.2-06/07/08).
  // The backend's CURATOR role checks remain the real enforcement.
  if (profile?.role === "DEVELOPER") redirect("/developer");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-sage-50/60 font-sans text-zinc-900">
        <PwaRegistration />
        {/* Fail closed: without a verified CURATOR role, render no curator navigation or pages. */}
        {profile?.role === "CURATOR" ? (
          <CuratorChrome ownerId={user.id} profile={profile}>
            {children}
          </CuratorChrome>
        ) : (
          <AccountVerificationError />
        )}
      </body>
    </html>
  );
}

function AccountVerificationError() {
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <section
        role="alert"
        aria-labelledby="verification-error-heading"
        className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm"
      >
        <LogoMark className="mx-auto h-14 w-14" />
        <h1 id="verification-error-heading" className="mt-4 font-serif text-xl font-semibold text-forest-900">
          Account could not be verified
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          BioSphere could not confirm your account role right now, so the workspace is unavailable. Try again in a
          moment. If this keeps happening, sign out and sign in again.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
            >
              Sign out
            </button>
          </form>
          {/* A plain link forces a fresh server render, which re-runs the verification. */}
          <a
            href="/dashboard"
            className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
          >
            Try again
          </a>
        </div>
      </section>
    </main>
  );
}
