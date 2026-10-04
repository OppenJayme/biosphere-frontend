/**
 * Protected page for one specimen lot: its current state, the controlled inventory workflows
 * (move, condition change, quantity adjustment, notes), and its transaction history.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { HistoryPagination, LotTransactionList } from "@/components/specimens/SpecimenLotHistory";
import { SpecimenLotOperations } from "@/components/specimens/SpecimenLotOperations";
import {
  getSpecimenLot,
  listAllStorageUnits,
  listLotTransactions,
} from "@/features/specimen-lots/api";
import {
  LOT_HISTORY_PAGE_SIZE,
  lotHistoryHref,
  parseLotHistorySearch,
} from "@/features/specimen-lots/operations";
import {
  buildAssignableStorageUnitOptions,
  buildStorageUnitPathLabels,
} from "@/features/specimen-lots/types";
import { getSpecimen } from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Lot",
};

type SpecimenLotPageProps = {
  params: Promise<{ id: string; lotId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function plural(count: number) {
  return `${count} specimen${count === 1 ? "" : "s"}`;
}

function positiveInt(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

type Notice = { text: string; sourceLotId?: string };

function lotNotice(params: Record<string, string | string[] | undefined>): Notice | null {
  const kind = firstValue(params.lot);
  const qty = positiveInt(firstValue(params.qty));
  const merged = firstValue(params.merged) === "1";
  const source = firstValue(params.source);
  const sourceLotId = source && z.uuid().safeParse(source).success ? source : undefined;
  const remainder = sourceLotId
    ? "The original lot keeps the remaining quantity."
    : "The original lot was emptied and is now inactive.";

  if (kind === "moved" || kind === "condition-changed") {
    const verb = kind === "moved" ? "Moved" : "Reclassified";
    const amount = qty ? plural(qty) : "the specimens";
    const into = merged ? " and merged them into this existing lot" : " into this lot";
    return { text: `${verb} ${amount}${into}. ${remainder}`, sourceLotId };
  }
  if (kind === "adjusted") {
    const delta = Number(firstValue(params.delta));
    if (Number.isInteger(delta) && delta !== 0) {
      return {
        text: `The quantity adjustment was recorded (${delta > 0 ? "+" : "−"}${Math.abs(delta)}).`,
      };
    }
    return { text: "The quantity adjustment was recorded." };
  }
  if (kind === "notes-updated") return { text: "The storage notes were updated." };
  return null;
}

export default async function SpecimenLotPage({ params, searchParams }: SpecimenLotPageProps) {
  const { id, lotId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(lotId).success) notFound();
  const lotPath = `/specimens/${id}/lots/${lotId}`;
  if (!(await verifySession())) redirect(`/login?from=${encodeURIComponent(lotPath)}`);

  const query = await searchParams;
  const search = parseLotHistorySearch(query);

  let specimen;
  let lot;
  let transactions;
  try {
    [specimen, lot, transactions] = await Promise.all([
      getSpecimen(id),
      getSpecimenLot(id, lotId),
      listLotTransactions(id, lotId, { page: search.page, limit: LOT_HISTORY_PAGE_SIZE }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <div className="space-y-5">
        <BackLink specimenId={id} />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">This specimen lot could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. No inventory data was changed.
          </p>
          <Link
            href={lotPath}
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(transactions.total / transactions.limit));
  if (search.page > totalPages) redirect(lotHistoryHref(lotPath, search, totalPages));

  // Labels and move destinations are secondary; the lot still renders if storage fails to load.
  const storageUnits = await listAllStorageUnits().catch(() => null);
  const storageLabels = buildStorageUnitPathLabels(storageUnits ?? []);
  const destinations = storageUnits
    ? buildAssignableStorageUnitOptions(storageUnits)
    : null;

  const canOperate = lot.isActive && specimen.status !== "ARCHIVED";
  const specimenName =
    specimen.accessionNumber ?? specimen.scientificName ?? specimen.commonName ?? "Unnamed specimen";
  const notice = lotNotice(query);
  const capacityExceededBy = positiveInt(firstValue(query.capacity));
  const locationLabel = storageLabels.get(lot.storageUnitId) ?? "Storage location unavailable";

  return (
    <div className="space-y-5">
      <BackLink specimenId={id} />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {specimenName}
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">Specimen lot</h1>
          <p className="mt-1 text-sm text-zinc-600">{locationLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/specimens/${id}/lots`}
            className="rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            All lots and history
          </Link>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              lot.isActive ? "bg-forest-100 text-forest-800" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {lot.isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {notice.text}
          {notice.sourceLotId && (
            <>
              {" "}
              <Link
                href={`/specimens/${id}/lots/${notice.sourceLotId}`}
                className="font-semibold underline"
              >
                View original lot
              </Link>
            </>
          )}
        </div>
      )}

      {capacityExceededBy && (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <span className="font-semibold">Capacity warning:</span> {locationLabel} now holds{" "}
          {plural(capacityExceededBy)} more than its configured capacity. The change was still
          saved; review the storage location if this is unexpected.
        </div>
      )}

      <section className="rounded-xl border border-black/10 bg-white p-5">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label={lot.isActive ? "Quantity" : "Last recorded quantity"} value={String(lot.quantity)} />
          <Detail label="Condition" value={lot.conditionClass} />
          <Detail label="Storage location" value={locationLabel} />
          <Detail label="Last updated" value={lot.updatedAt.slice(0, 10)} />
          <div className="sm:col-span-2 lg:col-span-4">
            <Detail label="Storage notes" value={lot.storageNotes ?? "No storage notes"} />
          </div>
        </dl>
        {!lot.isActive && (
          <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
            This lot was emptied or fully moved. It is kept read-only for history and does not
            count toward the specimen total.
          </p>
        )}
        {lot.isActive && specimen.status === "ARCHIVED" && (
          <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
            Archived specimen records are read-only, so this lot cannot be changed.
          </p>
        )}
      </section>

      {canOperate && (
        <SpecimenLotOperations
          // Remount after each saved change so forms start from the refreshed lot.
          key={lot.updatedAt}
          lot={{
            specimenId: id,
            lotId: lot.id,
            quantity: lot.quantity,
            storageUnitId: lot.storageUnitId,
            conditionClass: lot.conditionClass,
            storageNotes: lot.storageNotes,
          }}
          storageUnits={destinations}
        />
      )}

      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-4 font-serif text-lg font-semibold text-forest-800">
          Lot transactions
        </h2>
        <HistoryPagination
          label="Lot transaction pages"
          page={transactions.page}
          limit={transactions.limit}
          total={transactions.total}
          noun="transactions"
          hrefFor={(page) => lotHistoryHref(lotPath, search, page)}
        />
        <LotTransactionList specimenId={id} lotId={lot.id} items={transactions.items} />
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-800">{value}</dd>
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
