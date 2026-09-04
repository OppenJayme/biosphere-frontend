import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";

export function Panel({
  title,
  action,
  viewAllHref,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  viewAllHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-xl border border-black/10 bg-white p-5 ${className}`}>
      {(title || action || viewAllHref) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>}
          {action}
          {viewAllHref && <ViewAllLink href={viewAllHref} />}
        </div>
      )}
      {children}
    </div>
  );
}

export function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-800"
    >
      view all
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </Link>
  );
}
