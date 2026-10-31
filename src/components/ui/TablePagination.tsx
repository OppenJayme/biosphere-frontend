/**
 * Footer shared by the curator tables: "Showing 1 to 10 of 19 records", numbered pages
 * and a rows-per-page menu. Not a Client Component on purpose, so server-rendered tables
 * can pass `hrefFor` functions; only PageSizeSelect runs in the browser, and it receives
 * finished URLs.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { PageSizeSelect } from "./PageSizeSelect";

export const TABLE_PAGE_SIZES = [10, 25, 50] as const;

const FOCUS = "focus-visible:outline-2 focus-visible:outline-forest-700";
const ARROW = `flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100 ${FOCUS}`;
const ARROW_DISABLED = "flex h-7 w-7 items-center justify-center text-zinc-300";
const NUMBER = `flex h-7 min-w-7 items-center justify-center rounded-md px-1 font-medium ${FOCUS}`;
const NUMBER_CURRENT = "border border-forest-700 text-forest-700";
const NUMBER_OTHER = "text-zinc-600 hover:bg-sage-100";

/** Lists kept in the URL navigate with links; lists held in browser state use callbacks. */
type PageControl =
  | { hrefFor: (page: number) => string; sizeHrefFor: (size: number) => string }
  | { onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void };

/** Page numbers to show, e.g. 1 2 3 4 5 … 10, or 1 … 5 6 7 … 10 from the middle. */
export function pageNumbers(current: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", count];
  if (current >= count - 3) return [1, "gap", count - 4, count - 3, count - 2, count - 1, count];
  return [1, "gap", current - 1, current, current + 1, "gap", count];
}

function PageLink({
  control,
  target,
  className,
  ariaLabel,
  current,
  children,
}: {
  control: PageControl;
  target: number;
  className: string;
  ariaLabel?: string;
  current?: boolean;
  children: ReactNode;
}) {
  const ariaCurrent = current ? "page" : undefined;
  return "hrefFor" in control ? (
    <Link
      href={control.hrefFor(target)}
      prefetch={false}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={className}
    >
      {children}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => control.onPageChange(target)}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={className}
    >
      {children}
    </button>
  );
}

export function TablePagination({
  label,
  noun,
  page,
  pageSize,
  total,
  className = "",
  ...control
}: {
  /** Names the list for screen readers, e.g. "Specimen catalog pages". */
  label: string;
  /** Plural word after the count: "Showing 1 to 10 of 19 records". */
  noun: string;
  page: number;
  pageSize: number;
  total: number;
  className?: string;
} & PageControl) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500 ${className}`}
    >
      <p aria-live="polite">
        {total === 0
          ? `Showing 0 ${noun}`
          : `Showing ${first.toLocaleString()} to ${last.toLocaleString()} of ${total.toLocaleString()} ${noun}`}
      </p>

      <nav aria-label={label} className="flex items-center gap-1">
        {page > 1 ? (
          <PageLink control={control} target={page - 1} ariaLabel="Previous page" className={ARROW}>
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </PageLink>
        ) : (
          <span className={ARROW_DISABLED}>
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </span>
        )}
        {pageNumbers(page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1">
              &hellip;
            </span>
          ) : (
            <PageLink
              key={item}
              control={control}
              target={item}
              current={item === page}
              className={`${NUMBER} ${item === page ? NUMBER_CURRENT : NUMBER_OTHER}`}
            >
              {item}
            </PageLink>
          ),
        )}
        {page < pageCount ? (
          <PageLink control={control} target={page + 1} ariaLabel="Next page" className={ARROW}>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </PageLink>
        ) : (
          <span className={ARROW_DISABLED}>
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </nav>

      <PageSizeSelect
        label={`Rows per page for ${noun}`}
        value={pageSize}
        sizes={TABLE_PAGE_SIZES}
        hrefs={
          "sizeHrefFor" in control
            ? Object.fromEntries(TABLE_PAGE_SIZES.map((size) => [size, control.sizeHrefFor(size)]))
            : undefined
        }
        onChange={"onPageSizeChange" in control ? control.onPageSizeChange : undefined}
      />
    </div>
  );
}
