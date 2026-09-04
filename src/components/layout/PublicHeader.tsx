"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "./LogoMark";
import { MenuIcon, CloseIcon, CalendarIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "About" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="h-9 w-9 text-forest-700" />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-semibold text-forest-800">
              USC Biological Museum
            </span>
            <span className="text-xs font-medium text-gold-600">
              University of San Carlos &middot; Cebu City
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-8 font-serif text-[15px] text-forest-900">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`pb-1 transition-colors hover:text-forest-700 ${
                    isActive(link.href)
                      ? "border-b-2 border-forest-700 text-forest-700"
                      : "border-b-2 border-transparent"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/visit"
            className="hidden items-center gap-2 rounded-full bg-gold-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-700 sm:inline-flex"
          >
            <CalendarIcon className="h-4 w-4" />
            Plan Your Visit
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-forest-800 md:hidden"
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav aria-label="Primary" className="border-t border-black/5 md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-3 font-serif text-base text-forest-900">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2 ${
                    isActive(link.href) ? "bg-forest-100 text-forest-800" : "hover:bg-sage-100"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/visit"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-full bg-gold-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Plan Your Visit
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
