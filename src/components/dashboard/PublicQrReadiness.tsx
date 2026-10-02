/** Dashboard summary of which exhibit QR codes currently resolve for visitors. */

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

  const livePct = livePercent(readiness.live, readiness.total);
  const rows = [
    { label: "Live", value: readiness.live, dot: "bg-forest-600" },
    { label: "Published, specimen not public", value: readiness.publishedUnavailable, dot: "bg-red-500" },
    { label: "Unpublished", value: readiness.unpublished, dot: "bg-amber-500" },
    { label: "Disabled", value: readiness.disabled, dot: "bg-zinc-400" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold text-forest-800">
            {readiness.live.toLocaleString()}
            <span className="text-sm font-normal text-zinc-500"> / {readiness.total.toLocaleString()} live</span>
          </p>
          <span className="text-xs font-medium text-zinc-500">
            {livePct.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
          </span>
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

      {/* Plain text, not links: /exhibits on develop still renders placeholder data. */}
      {readiness.pending.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Awaiting publish</p>
          <ul className="space-y-1.5">
            {readiness.pending.map((exhibit) => (
              <li key={exhibit.id} className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-900">/exhibits/{exhibit.publicSlug}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Rounded down to one decimal so an incomplete count never displays as 100%
 * (499 / 500 shows 99.8%, not 100%).
 */
function livePercent(live: number, total: number) {
  if (live === total) return 100;
  return Math.floor((live / total) * 1000) / 10;
}
