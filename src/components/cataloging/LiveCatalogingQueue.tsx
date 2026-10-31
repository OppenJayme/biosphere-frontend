/**
 * Read-only live queue for Uncataloged specimen records.
 * Editing stays in the established specimen pages; inventory fields are never mutated here.
 */

import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import {
  catalogingQueueHref,
  type CatalogingQueueQuery,
} from "@/features/specimens/cataloging-queue";
import { DEFAULT_SPECIMEN_PAGE_SIZE, type SpecimenPage, type SpecimenPageSize } from "@/features/specimens/types";
import { TablePagination } from "@/components/ui/TablePagination";

function displayName(commonName: string | null, scientificName: string | null) {
  return commonName ?? scientificName ?? "Unnamed specimen";
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function LiveCatalogingQueue({
  page,
  query,
}: {
  page: SpecimenPage;
  query: CatalogingQueueQuery;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Records awaiting catalog work</h2>
            <p className="mt-1 text-xs text-zinc-500">Most recently updated records appear first.</p>
          </div>
          <span className="rounded-full bg-sage-100 px-3 py-1.5 text-xs font-semibold text-forest-800">
            {page.total} Uncataloged
          </span>
        </div>

        <form action="/cataloging" className="mt-4 flex flex-col gap-2 sm:flex-row">
          {query.limit !== DEFAULT_SPECIMEN_PAGE_SIZE && (
            <input type="hidden" name="limit" value={query.limit} />
          )}
          <label htmlFor="cataloging-search" className="sr-only">
            Search uncataloged specimens
          </label>
          <span className="relative block w-full sm:max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="cataloging-search"
              type="search"
              name="search"
              defaultValue={query.search}
              maxLength={100}
              placeholder="Search identifiers, names, category, remarks, or collection"
              className="w-full rounded-lg border border-black/15 bg-white py-2.5 pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </span>
          <button
            type="submit"
            className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Search queue
          </button>
          {query.search && (
            <Link
              href="/cataloging"
              className="rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-forest-800 hover:bg-forest-50"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {page.items.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">
            {query.search
              ? "No Uncataloged records match this search."
              : "The Cataloging queue is empty."}
          </p>
          <p className="mt-1">
            {query.search
              ? "Try another identifier, name, category, remark, or collection."
              : "New specimen drafts will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[54rem] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs text-zinc-500">
                <th scope="col" className="py-2 pr-3 font-medium">Accession No.</th>
                <th scope="col" className="py-2 pr-3 font-medium">Specimen</th>
                <th scope="col" className="py-2 pr-3 font-medium">Category</th>
                <th scope="col" className="py-2 pr-3 font-medium">Classification</th>
                <th scope="col" className="py-2 pr-3 font-medium">Last Updated</th>
                <th scope="col" className="py-2 pr-0"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {page.items.map((specimen) => (
                <tr key={specimen.id} className="hover:bg-sage-50">
                  <td className="py-2.5 pr-3 font-medium text-zinc-900">
                    {specimen.accessionNumber ?? <span className="font-normal text-zinc-500">Unassigned</span>}
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-zinc-900">
                      {displayName(specimen.commonName, specimen.scientificName)}
                    </p>
                    {specimen.commonName && specimen.scientificName && (
                      <p className="mt-0.5 text-xs italic text-zinc-500">
                        {specimen.scientificName}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600">
                    {specimen.specimenCategory ?? "—"}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-600">
                    {specimen.classificationStatus ?? "—"}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-500">
                    {dateLabel(specimen.updatedAt)}
                  </td>
                  <td className="py-2.5 pr-0 text-right">
                    <Link
                      href={`/specimens/${specimen.id}`}
                      className="inline-flex rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50"
                    >
                      Continue cataloging
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TablePagination
        className="mt-4"
        label="Cataloging queue pages"
        noun="records"
        page={page.page}
        pageSize={query.limit}
        total={page.total}
        hrefFor={(target) => catalogingQueueHref(query, target)}
        sizeHrefFor={(size) => catalogingQueueHref({ ...query, limit: size as SpecimenPageSize }, 1)}
      />
    </section>
  );
}
