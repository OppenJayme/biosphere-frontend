"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./LogoMark";

const EXPLORE_LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "About" },
  { href: "/inquiry", label: "Contact" },
];

const HOURS = [
  { days: "Tue - Fri", time: "9:00 AM - 5:00 PM" },
  { days: "Sat - Sun", time: "9:00 AM - 5:00 PM" },
];

export function PublicFooter() {
  const pathname = usePathname();

  // Unlisted QR exhibit pages ship their own compact chrome, so skip the site footer.
  if (pathname.startsWith("/exhibits/")) return null;

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <LogoMark className="h-11 w-11" />
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              USC Biological Museum
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-muted">
            The official biological museum of the University of San Carlos,
            dedicated to the study, preservation, and appreciation of life.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink transition-colors hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <address className="not-italic md:col-span-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Find us</p>
          <p className="mt-4 text-sm leading-relaxed text-ink">
            3rd Floor, Josef Baumgartner Learning Resource Center, Talamban, Cebu
          </p>
          <p className="mt-3 text-sm">
            <a href="tel:+63322531000" className="text-ink hover:text-brand">
              (032) 253 1000 local 245
            </a>
          </p>
          <p className="mt-1 text-sm">
            <a href="mailto:biologicalmuseum@usc.edu.ph" className="break-all text-ink hover:text-brand">
              biologicalmuseum@usc.edu.ph
            </a>
          </p>
        </address>

        <div className="md:col-span-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Hours</p>
          <dl className="mt-4 space-y-2 font-mono text-[13px]">
            {HOURS.map((row) => (
              <div key={row.days}>
                <dt className="text-ink-muted">{row.days}</dt>
                <dd className="text-ink">{row.time}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            Open during regular holidays for special events.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>&copy; {new Date().getFullYear()} USC Biological Museum. All rights reserved.</p>
          <p className="flex gap-5">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
