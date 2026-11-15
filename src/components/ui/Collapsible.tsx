import type { ComponentType, ReactNode, SVGProps } from "react";
import { ChevronDownIcon } from "@/components/icons";

/**
 * A panel of reference information that stays collapsed until asked for (notes, history, logs).
 * It is a native <details>, so it works with the keyboard, is announced as expanded or collapsed,
 * and its content is found by the browser's find-in-page.
 */
export function Collapsible({
  icon: Icon,
  title,
  summary,
  defaultOpen = false,
  id,
  children,
}: {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  /** Short hint beside the title, e.g. "3 entries". */
  summary?: ReactNode;
  defaultOpen?: boolean;
  id?: string;
  children: ReactNode;
}) {
  return (
    <details id={id} open={defaultOpen} className="group scroll-mt-32 rounded-xl border border-black/10 bg-white">
      <summary className="flex list-none items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-sage-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-forest-700 [&::-webkit-details-marker]:hidden">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-forest-700" />}
        <span className="min-w-0 flex-1">{title}</span>
        {summary && <span className="text-xs font-normal text-zinc-500">{summary}</span>}
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="space-y-4 border-t border-black/10 px-5 py-4">{children}</div>
    </details>
  );
}
