"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { SearchIcon, ChevronDownIcon, PlusIcon } from "@/components/icons";
import { exhibitsHref, parseExhibitListQuery } from "@/features/exhibits-qr/form";
import { EXHIBIT_STATUSES, EXHIBIT_STATUS_LABELS, type ExhibitListQuery } from "@/features/exhibits-qr/types";

const selectClasses =
  "w-full appearance-none rounded-lg border border-black/15 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

function FilterSelect({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="relative">
      <select aria-label={label} name={name} defaultValue={value} onChange={onChange} className={selectClasses}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

/** URL-driven filters, so a filtered list can be bookmarked and survives a reload. */
export function ExhibitToolbar({ query, onAddClick }: { query: ExhibitListQuery; onAddClick: () => void }) {
  const router = useRouter();

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const next = parseExhibitListQuery({
      status: String(data.get("status") ?? ""),
      ar: String(data.get("ar") ?? ""),
      search: String(data.get("search") ?? ""),
    });
    router.push(exhibitsHref(next));
  }

  // Selects apply immediately; the search box applies on Enter or the Apply button.
  function applyNow(event: ChangeEvent<HTMLSelectElement>) {
    if (event.currentTarget.form) apply(event.currentTarget.form);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply(event.currentTarget);
  }

  return (
    <form role="search" onSubmit={submit} className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[220px] flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          name="search"
          aria-label="Search exhibits"
          defaultValue={query.search}
          maxLength={100}
          placeholder="Search by name, accession no., or URL ending…"
          className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>
      <FilterSelect
        label="Publish status"
        name="status"
        value={query.status}
        onChange={applyNow}
        options={[
          { value: "", label: "All statuses" },
          ...EXHIBIT_STATUSES.map((status) => ({ value: status, label: EXHIBIT_STATUS_LABELS[status] })),
        ]}
      />
      <FilterSelect
        label="AR"
        name="ar"
        value={query.ar}
        onChange={applyNow}
        options={[
          { value: "", label: "AR: any" },
          { value: "on", label: "AR on" },
          { value: "off", label: "AR off" },
        ]}
      />
      <button
        type="submit"
        className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-sage-100"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
      >
        <PlusIcon className="h-4 w-4" />
        Create Exhibit
      </button>
    </form>
  );
}
