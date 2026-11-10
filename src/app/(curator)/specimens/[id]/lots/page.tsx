/**
 * Protected page listing every lot of a specimen (inactive included), the calculated
 * inventory summary, and the specimen-wide lot transaction history.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import {
  HistoryPagination,
  SpecimenLotHistoryList,
} from "@/components/specimens/SpecimenLotHistory";
import {
  getSpecimenLotSummary,
  listAllStorageUnits,
  listLotsIncludingInactive,
  listSpecimenLotHistory,
} from "@/features/specimen-lots/api";
import {
  LOT_HISTORY_PAGE_SIZE,
  TRANSACTION_TYPE_OPTIONS,
  lotHistoryHref,
  parseLotHistorySearch,
} from "@/features/specimen-lots/operations";
import { buildStorageUnitPathLabels } from "@/features/specimen-lots/types";
import { getSpecimen } from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Lots",
};

type SpecimenLotsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const filterControlClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

export default async function SpecimenLotsPage({ params, searchParams }: SpecimenLotsPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const basePath = `/specimens/${id}/lots`;
  if (!(await verifySession())) redirect(`/login?from=${encodeURIComponent(basePath)}`);

  const search = parseLotHistorySearch(await searchParams);

  let specimen;
  let summary;
  let lots;
  let history;
  try {
    [specimen, summary, lots, history] = await Promise.all([
      getSpecimen(id),
      getSpecimenLotSummary(id),
      listLotsIncludingInactive(id),
      listSpecimenLotHistory(id, {
        page: search.page,
        limit: LOT_HISTORY_PAGE_SIZE,
        transactionType: search.transactionType,
      }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <div className="space-y-5">
        <BackLink specimenId={id} />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The specimen lots could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. No inventory data was changed.
          </p>
          <Link
            href={lotHistoryHref(basePath, search)}
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(history.total / history.limit));
  if (search.page > totalPages) redirect(lotHistoryHref(basePath, search, totalPages));

  // Labels are secondary: history still renders (with a placeholder) if storage fails to load.
  const storageLabels = buildStorageUnitPathLabels(await listAllStorageUnits().catch(() => []));
  const specimenName =
    specimen.accessionNumber ?? specimen.scientificName ?? specimen.commonName ?? "Unnamed specimen";
  const inactiveCount = lots.filter((lot) => !lot.isActive).length;

  return (
    <div className="space-y-5">
      <BackLink specimenId={id} />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            {specimenName}
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">
            Lots and inventory history
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            The specimen total is calculated from active lots. History is read-only and includes
            lots that were emptied or fully moved.
          </p>
        </div>
        {specimen.status !== "ARCHIVED" && (
          <Link
            href={`${basePath}/new`}
            className="rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50"
          >
            Add lot
          </Link>
        )}
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile label="Active lots" value={summary.activeLotCount} />
        <SummaryTile label="Total active quantity" value={summary.totalQuantity} />
        <SummaryTile label="Inactive lots" value={inactiveCount} />
      </dl>

      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Lots</h2>
        {lots.length === 0 ? (
          <p className="text-sm text-zinc-500">No lots have been recorded for this specimen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-zinc-500">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Storage location</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Condition</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Quantity</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Status</th>
                  <th scope="col" className="py-2 font-medium">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {lots.map((lot) => (
                  <tr key={lot.id} className={lot.isActive ? "" : "text-zinc-500"}>
                    <td className="py-3 pr-4">
                      {storageLabels.get(lot.storageUnitId) ?? "Unknown storage location"}
                    </td>
                    <td className="py-3 pr-4">{lot.conditionClass}</td>
                    <td className="py-3 pr-4">{lot.isActive ? lot.quantity : "—"}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          lot.isActive ? "bg-forest-100 text-forest-800" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {lot.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`${basePath}/${lot.id}`}
                        className="text-xs font-semibold text-forest-800 hover:underline"
                      >
                        {lot.isActive && specimen.status !== "ARCHIVED" ? "Manage" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form
        action={basePath}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-white p-5"
      >
        <label className="min-w-56 flex-1 text-xs font-medium text-zinc-700">
          Transaction type
          <select
            name="type"
            defaultValue={search.transactionType ?? ""}
            className={filterControlClasses}
          >
            <option value="">All transactions</option>
            {TRANSACTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Apply filter
        </button>
        {search.transactionType && (
          <Link
            href={basePath}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">
          Inventory history
        </h2>
        <HistoryPagination
          label="Lot history pages"
          page={history.page}
          limit={history.limit}
          total={history.total}
          noun="transactions"
          hrefFor={(page) => lotHistoryHref(basePath, search, page)}
        />
        <SpecimenLotHistoryList
          specimenId={id}
          items={history.items}
          storageLabels={storageLabels}
        />
      </section>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

function BackLink({ specimenId }: { specimenId: string }) {
  return (
    <Link
      href={`/specimens/${specimenId}`}
      className="text-sm font-semibold text-forest-800 hover:underline"
    >
      ← Back to specimen details
    </Link>
  );
}
