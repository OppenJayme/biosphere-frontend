"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { ArrowRightIcon, ChevronDownIcon } from "@/components/icons";
import { InfoTip } from "@/components/ui/InfoTip";

const COLLAPSED_STORAGE_PREFIX = "biosphere_dashboard_panel_collapsed:";

/**
 * Dashboard card. With `collapseKey`, the header toggles the body and the choice is
 * remembered per browser (a convenience only; every panel starts expanded without it).
 */
export function Panel({
  title,
  info,
  action,
  viewAllHref,
  collapseKey,
  children,
  className = "",
}: {
  title?: string;
  /** Optional explanation in an "i" tooltip beside the title. */
  info?: ReactNode;
  action?: ReactNode;
  viewAllHref?: string;
  collapseKey?: string;
  children: ReactNode;
  className?: string;
}) {
  const bodyId = useId();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!collapseKey) return;
    // One-time sync from localStorage after mount, so server and client HTML match.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_PREFIX + collapseKey) === "true");
    } catch {
      // Storage unavailable: keep the panel expanded.
    }
  }, [collapseKey]);

  function toggle() {
    // Write storage outside the state updater: React may run updaters twice in development.
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_STORAGE_PREFIX + collapseKey, String(next));
    } catch {
      // ignore write failures
    }
  }

  const hasHeader = Boolean(title || action || viewAllHref);

  return (
    // Collapsed cards keep their header height instead of stretching to a neighbour's height.
    <div className={`min-w-0 rounded-xl border border-black/10 bg-white p-5 ${collapsed ? "self-start" : ""} ${className}`}>
      {hasHeader && (
        <div className={`flex items-center justify-between gap-3 ${collapsed ? "" : "mb-4"}`}>
          {collapseKey && title ? (
            <h3 className="min-w-0 flex-1 text-sm font-semibold text-zinc-900">
              <button
                type="button"
                onClick={toggle}
                aria-expanded={!collapsed}
                aria-controls={bodyId}
                className="-mx-1 inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-forest-600"
              >
                <ChevronDownIcon
                  className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform motion-reduce:transition-none ${collapsed ? "-rotate-90" : ""}`}
                />
                <span className="truncate">{title}</span>
              </button>
              {info && (
                <span className="ml-1">
                  <InfoTip label={title}>{info}</InfoTip>
                </span>
              )}
            </h3>
          ) : (
            title && (
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                {title}
                {info && <InfoTip label={title}>{info}</InfoTip>}
              </h3>
            )
          )}
          {!collapsed && action}
          {viewAllHref && <ViewAllLink href={viewAllHref} />}
        </div>
      )}
      <div id={bodyId} hidden={collapsed}>
        {children}
      </div>
    </div>
  );
}

export function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-800"
    >
      View all
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </Link>
  );
}
