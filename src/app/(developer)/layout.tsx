import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Geist, Playfair_Display } from "next/font/google";
import { LogoMark } from "@/components/layout/LogoMark";
import { signOut } from "@/features/auth/actions";
import { getDeveloperAccess } from "@/features/developer/session";
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
    default: "Developer Interface",
    template: "%s | BioSphere Developer",
  },
  description: "Restricted BioSphere technical interface for curator provisioning and AR asset deployment.",
  robots: { index: false, follow: false },
};

// Deliberately no sidebar or links into curator modules: the Developer interface exposes
// only curator-account controls and AR deployment (REQ-4.2-08).
export default async function DeveloperLayout({ children }: { children: ReactNode }) {
  const access = await getDeveloperAccess();
  if (access.state === "signed-out") redirect("/login?from=/developer");
  if (access.state === "not-developer") redirect("/dashboard");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-sage-50/60 font-sans text-zinc-900">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <LogoMark className="h-9 w-9" />
              <div>
                <p className="font-serif text-base font-semibold text-forest-800">BioSphere</p>
                <p className="text-xs text-zinc-500">Restricted Developer Interface</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {access.state === "developer" && (
                <p className="text-right text-xs">
                  <span className="block font-semibold text-zinc-900">{access.profile.fullName}</span>
                  <span className="text-zinc-500">Developer</span>
                </p>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-6 lg:px-6">
          {access.state === "developer" ? (
            children
          ) : (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              Your account could not be verified with the BioSphere backend. Reload the page or try again later.
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
