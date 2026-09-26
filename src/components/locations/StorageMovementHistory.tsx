/** Read-only history of storage-unit reparenting; this does not represent specimen movement. */

import { ClockIcon } from "@/components/icons";
import type { StorageMovement, StorageUnit } from "@/features/storage-locations/types";

const DISPLAY_LIMIT = 10;
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

type StorageMovementHistoryProps = {
  movements: StorageMovement[];
  units: StorageUnit[];
  errorMessage?: string;
  loading?: boolean;
};

export function StorageMovementHistory({
  movements,
  units,
  errorMessage,
  loading = false,
}: StorageMovementHistoryProps) {
  const labelById = new Map(units.map((unit) => [unit.id, unit.label]));
  const visible = movements.slice(0, DISPLAY_LIMIT);

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4 text-forest-700" />
        <h3 className="text-sm font-semibold text-zinc-900">Location movement history</h3>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Records changes to this storage unit&rsquo;s parent location, not specimen transfers.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500" role="status">Loading movement history...</p>
      ) : errorMessage ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {errorMessage}
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No location movements have been recorded.</p>
      ) : (
        <ol className="mt-4 space-y-3 border-l border-zinc-200 pl-4">
          {visible.map((movement) => (
            <li key={movement.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-forest-600" />
              <p className="text-sm font-medium text-zinc-900">
                {locationLabel(movement.fromStorageUnitId, labelById)}
                <span className="mx-2 text-zinc-400">&rarr;</span>
                {locationLabel(movement.toStorageUnitId, labelById)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatDate(movement.movedAt)} &middot; account {shortId(movement.movedBy)}
              </p>
              {movement.reason && <p className="mt-1 text-sm text-zinc-700">{movement.reason}</p>}
            </li>
          ))}
        </ol>
      )}

      {!loading && !errorMessage && movements.length > DISPLAY_LIMIT && (
        <p className="mt-4 text-xs text-zinc-500">
          Showing the {DISPLAY_LIMIT} most recent of {movements.length} recorded movements.
        </p>
      )}
    </section>
  );
}

function locationLabel(id: string | null, labels: Map<string, string>) {
  if (!id) return "Top level";
  return labels.get(id) ?? `Unknown location (${shortId(id)})`;
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : dateFormatter.format(date);
}
