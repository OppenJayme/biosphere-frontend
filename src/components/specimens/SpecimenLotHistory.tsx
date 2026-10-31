/**
 * Read-only lot transaction history: the specimen-wide feed (with before/after location and
 * condition) and a single lot's transactions. Storage labels stay inside the curator app (BR-11).
 */

import Link from "next/link";
import {
  adjustmentTypeLabel,
  transactionTypeLabel,
} from "@/features/specimen-lots/operations";
import type {
  SpecimenLotHistoryEntry,
  SpecimenLotTransaction,
} from "@/features/specimen-lots/types";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

function transactionTitle(item: SpecimenLotTransaction) {
  const base = transactionTypeLabel(item.transactionType);
  return item.adjustmentType ? `${base} · ${adjustmentTypeLabel(item.adjustmentType)}` : base;
}

export function HistoryPagination({
  label,
  page,
  limit,
  total,
  hrefFor,
  noun,
}: {
  label: string;
  page: number;
  limit: number;
  total: number;
  hrefFor: (page: number) => string;
  noun: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-zinc-600">
        {total === 0 ? `No ${noun} recorded.` : `Showing ${first}–${last} of ${total} ${noun}`}
      </p>
      {totalPages > 1 && (
        <nav aria-label={label} className="flex items-center gap-1.5 text-sm">
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              className="rounded-md border border-black/15 px-3 py-1.5 font-medium text-zinc-700 hover:bg-sage-100"
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-md border border-black/10 px-3 py-1.5 text-zinc-400">
              Previous
            </span>
          )}
          <span className="px-1 text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1)}
              className="rounded-md border border-black/15 px-3 py-1.5 font-medium text-zinc-700 hover:bg-sage-100"
            >
              Next
            </Link>
          ) : (
            <span className="rounded-md border border-black/10 px-3 py-1.5 text-zinc-400">
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

function Change({ from, to }: { from: string | null; to: string | null }) {
  if (from && to && from !== to) {
    return (
      <>
        {from} <span aria-hidden="true">→</span>
        <span className="sr-only">to</span> {to}
      </>
    );
  }
  return <>{to ?? from ?? "Not recorded"}</>;
}

export function SpecimenLotHistoryList({
  specimenId,
  items,
  storageLabels,
}: {
  specimenId: string;
  items: SpecimenLotHistoryEntry[];
  storageLabels: Map<string, string>;
}) {
  const unitLabel = (id: string | null) =>
    id ? (storageLabels.get(id) ?? "Unknown storage location") : null;

  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const lotId = item.targetLotId ?? item.sourceLotId;
        return (
          <li key={item.id} className="rounded-lg border border-black/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900">{transactionTitle(item)}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  By <span className="font-medium text-zinc-700">{item.performedByName}</span>
                  {lotId && (
                    <>
                      {" · "}
                      <Link
                        href={`/specimens/${specimenId}/lots/${lotId}`}
                        className="font-medium text-forest-800 hover:underline"
                      >
                        View lot
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                {item.quantityAffected !== null && (
                  <p className="text-sm font-semibold text-zinc-900">
                    {item.quantityAffected} specimen{item.quantityAffected === 1 ? "" : "s"}
                  </p>
                )}
                <time dateTime={item.createdAt} className="text-xs font-medium text-zinc-500">
                  {formatDate(item.createdAt)}
                </time>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-xs text-zinc-500">
                  Storage location
                </dt>
                <dd className="mt-1 break-words text-zinc-700">
                  <Change
                    from={unitLabel(item.fromStorageUnitId)}
                    to={unitLabel(item.toStorageUnitId)}
                  />
                </dd>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-xs text-zinc-500">
                  Condition
                </dt>
                <dd className="mt-1 break-words text-zinc-700">
                  <Change from={item.fromConditionClass} to={item.toConditionClass} />
                </dd>
              </div>
            </dl>
            {item.reason && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-600">
                <span className="font-medium text-zinc-700">Reason:</span> {item.reason}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function LotTransactionList({
  specimenId,
  lotId,
  items,
}: {
  specimenId: string;
  lotId: string;
  items: SpecimenLotTransaction[];
}) {
  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const incoming = item.targetLotId === lotId;
        const otherLotId = incoming ? item.sourceLotId : item.targetLotId;
        return (
          <li key={item.id} className="rounded-lg border border-black/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900">{transactionTitle(item)}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {incoming ? "Into this lot" : "Out of this lot"}
                  {otherLotId && (
                    <>
                      {incoming ? " from " : " to "}
                      <Link
                        href={`/specimens/${specimenId}/lots/${otherLotId}`}
                        className="font-medium text-forest-800 hover:underline"
                      >
                        another lot
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                {item.quantityAffected !== null && (
                  <p
                    className={`text-sm font-semibold ${incoming ? "text-forest-700" : "text-red-700"}`}
                  >
                    {incoming ? "+" : "−"}
                    {item.quantityAffected}
                  </p>
                )}
                <time dateTime={item.createdAt} className="text-xs font-medium text-zinc-500">
                  {formatDate(item.createdAt)}
                </time>
              </div>
            </div>
            {item.reason && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-zinc-600">
                <span className="font-medium text-zinc-700">Reason:</span> {item.reason}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
