/** Dashboard summary of which exhibit QR codes currently resolve for visitors. */

import Link from "next/link";
import { QrCodeIcon } from "@/components/icons";
import type { QrReadiness } from "@/features/dashboard/types";

export function PublicQrReadiness({ readiness }: { readiness: QrReadiness }) {
  if (readiness.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-sage-50 px-4 py-8 text-center">
        <QrCodeIcon className="h-6 w-6 text-zinc-400" />
        <p className="text-sm font-medium text-zinc-600">No exhibits yet</p>
        <p className="text-xs text-zinc-500">Create an exhibit to generate a public QR page.</p>
      </div>
    );
  }

  const livePct = Math.round((readiness.published / readiness.total) * 100);
  const rows = [
    { label: "Published", value: readiness.published, dot: "bg-forest-600" },
    { label: "Unpublished", value: readiness.unpublished, dot: "bg-amber-500" },
    { label: "Disabled", value: readiness.disabled, dot: "bg-zinc-400" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-forest-800">
            {readiness.published.toLocaleString()}
            <span className="text-sm font-normal text-zinc-500"> / {readiness.total.toLocaleString()} live</span>
          </p>
          <span className="text-xs font-medium text-zinc-500">{livePct}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-sage-100"
          role="progressbar"
          aria-label="Exhibits with a live QR page"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={livePct}
        >
          <div className="h-full rounded-full bg-forest-600" style={{ width: `${livePct}%` }} />
        </div>
      </div>

      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-zinc-600">
              <span className={`h-2 w-2 rounded-full ${row.dot}`} />
              {row.label}
            </span>
            <span className="font-medium text-zinc-900">{row.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>

      {readiness.pending.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Awaiting publish</p>
          <ul className="space-y-1.5">
            {readiness.pending.map((exhibit) => (
              <li key={exhibit.id} className="min-w-0">
                <Link href="/exhibits" className="block truncate text-xs font-medium text-zinc-900 hover:text-forest-700">
                  /exhibits/{exhibit.publicSlug}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
