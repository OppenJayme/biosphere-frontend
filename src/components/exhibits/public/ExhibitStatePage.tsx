import type { ReactNode } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/layout/LogoMark";
import { QrCodeIcon } from "@/components/icons";

/**
 * Museum-branded full-page message for a QR exhibit URL that cannot show an exhibit: unavailable
 * (REQ-4.12-09) or temporarily failing. The public header and footer are hidden on /exhibits/*,
 * so this page brings its own. It never names or describes the exhibit, so a retired, disabled,
 * or unpublished URL reveals nothing about what it used to show.
 */
export function ExhibitStatePage({
  heading,
  children,
  action,
}: {
  heading: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sage-50">
      <header className="flex items-center gap-2.5 bg-forest-900 px-4 py-3.5 sm:px-6">
        <LogoMark className="h-9 w-9 shrink-0" />
        <div className="leading-tight">
          <p className="font-serif text-base font-semibold text-white">BioSphere</p>
          <p className="text-[11px] font-medium text-gold-500">USC Biological Museum</p>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <QrCodeIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-serif text-2xl font-semibold text-zinc-900">{heading}</h1>
        <div className="mt-2 space-y-2 text-sm leading-relaxed text-zinc-600">{children}</div>

        <div className="mt-7 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          {action}
          <Link
            href="/gallery"
            className="rounded-lg border border-forest-800 px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-100/60"
          >
            Explore the Gallery
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-white"
          >
            Museum home
          </Link>
        </div>
      </div>
    </div>
  );
}
