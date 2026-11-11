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

// Museum hours as given by the museum (2026-11-07); it closes over lunch on weekdays.
const HOURS = [
  { days: "Mon - Fri", times: ["8:00 - 11:00 AM", "1:00 - 4:00 PM"] },
  { days: "Saturday", times: ["8:00 - 11:00 AM only"] },
];

export function PublicFooter() {
  const pathname = usePathname();

  // Unlisted QR exhibit pages ship their own compact chrome, so skip the site footer.
  if (pathname.startsWith("/exhibits/")) return null;

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-3 lg:grid-cols-12">
        <div className="md:col-span-3 lg:col-span-4">
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

        <div className="lg:col-span-2">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">Explore</p>
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

        <address className="not-italic lg:col-span-3">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">Find us</p>
          <p className="mt-4 text-sm leading-relaxed text-ink">
            Josef Baumgartner Building,{" "}
            <strong className="font-semibold">USC Talamban Campus</strong>, Cebu City
          </p>
          <p className="mt-3 text-sm">
            <a href="tel:+63322300100,122" className="text-ink hover:text-brand">
              032-230-0100-122
            </a>
          </p>
          <p className="mt-1 text-sm">
            <a href="mailto:febendanillo@usc.edu.ph" className="break-all text-ink hover:text-brand">
              febendanillo@usc.edu.ph
            </a>
          </p>
        </address>

        <div className="lg:col-span-3">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">Hours</p>
          <dl className="mt-4 space-y-2 font-mono text-[0.8125rem]">
            {HOURS.map((row) => (
              <div key={row.days}>
                <dt className="text-ink-muted">{row.days}</dt>
                {row.times.map((time) => (
                  <dd key={time} className="text-ink">
                    {time}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            Closed on regular holidays.
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
