"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "./LogoMark";
import { MenuIcon, CloseIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "About" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Unlisted QR exhibit pages ship their own compact chrome, so skip the site header.
  if (pathname.startsWith("/exhibits/")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8 lg:h-[72px]">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-[-8deg]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[17px] font-semibold tracking-tight text-ink">
              USC Biological Museum
            </span>
            <span className="mt-1 font-mono text-[10.5px] tracking-wide text-ink-muted">
              University of San Carlos
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1 text-[15px]">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative rounded-full px-4 py-2 transition-colors ${
                      active ? "bg-brand-soft font-medium text-brand" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/visit"
            className="hidden rounded-full bg-brand-solid px-5 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-brand-solid-hover active:translate-y-px sm:inline-flex"
          >
            Plan a visit
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-brand-soft md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-line md:hidden">
          <ul className="mx-auto flex max-w-[1240px] flex-col px-5 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block py-3 font-display text-2xl tracking-tight ${
                    isActive(link.href) ? "text-brand" : "text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-3 pb-2">
              <Link
                href="/visit"
                onClick={() => setMobileOpen(false)}
                className="block rounded-full bg-brand-solid px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Plan a visit
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
