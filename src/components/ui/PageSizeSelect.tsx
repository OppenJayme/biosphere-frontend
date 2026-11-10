"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDownIcon } from "@/components/icons";

/** "10 / page" menu. Lists kept in the URL pass `hrefs`; lists held in browser state pass `onChange`. */
export function PageSizeSelect({
  label,
  value,
  sizes,
  hrefs,
  onChange,
}: {
  label: string;
  value: number;
  sizes: readonly number[];
  hrefs?: Record<number, string>;
  onChange?: (size: number) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(size: number) {
    const href = hrefs?.[size];
    if (href) startTransition(() => router.push(href, { scroll: false }));
    else onChange?.(size);
  }

  return (
    <div className="relative">
      <select
        aria-label={label}
        aria-busy={pending}
        value={value}
        disabled={pending}
        onChange={(event) => change(Number(event.target.value))}
        className="cursor-pointer appearance-none rounded-md border border-black/15 bg-white py-1 pl-2.5 pr-7 text-xs text-zinc-700 focus:border-forest-700 focus:outline-none disabled:cursor-wait disabled:opacity-60"
      >
        {sizes.map((size) => (
          <option key={size} value={size}>
            {size} / page
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}
