import type { ReactNode } from "react";
import { InfoTip } from "@/components/ui/InfoTip";

/** Shared button looks for page-level actions, so every curator page uses the same two styles. */
export const PAGE_ACTION_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700";
export const PAGE_ACTION_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-forest-700 bg-white px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700";

/** Title, one-line description and page-level actions, laid out the same on every curator page. */
export function PageHeader({
  title,
  description,
  info,
  actions,
}: {
  title: string;
  /** One short sentence saying what the page is for. */
  description?: ReactNode;
  /** Optional extra explanation, shown in an "i" tooltip beside the title. */
  info?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-forest-800">
          {title}
          {info && (
            <InfoTip label={title} align="start">
              {info}
            </InfoTip>
          )}
        </h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-zinc-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
