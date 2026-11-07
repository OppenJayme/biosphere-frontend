import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/icons";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import "./globals.css";

// Site-wide 404 for any URL that matches no route. The app has separate root layouts for the
// public site, curator workspace, developer area and login, so there is no single layout to hold
// an app/not-found.tsx; Next's experimental globalNotFound (next.config.ts) renders this file
// instead, outside every layout, which is why it repeats the public layout's fonts, CSS and chrome.
// It names no internal page, so a mistyped or guessed curator URL reveals nothing.

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Page not found | BioSphere",
  description: "The page you are looking for is not on the USC Biological Museum website.",
};

export const viewport: Viewport = {
  themeColor: "#f5f6f0",
  colorScheme: "light",
};

export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="site flex min-h-full flex-col bg-paper font-sans text-ink">
        <PublicHeader />
        <main id="main" className="flex-1">
          <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 lg:py-32">
            <p className="font-mono text-xs tracking-wide text-brand">Error 404</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance text-ink sm:text-6xl">
              This page isn&apos;t part of our collection
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-muted">
              The link may be mistyped, or the page may have moved. You can head back to the museum
              home page or explore our exhibits instead.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/">
                Museum home
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
              <Button href="/gallery" variant="outline-forest">
                Explore the gallery
              </Button>
            </div>
          </section>
        </main>
        <PublicFooter />
      </body>
    </html>
  );
}
