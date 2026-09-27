import Link from "next/link";
import { getSpecimenPossibleDuplicates } from "@/features/specimens/api";
import {
  duplicateCheckOutcome,
  type DuplicateRecheckTrigger,
} from "@/features/specimens/duplicates";
import { SpecimenDuplicateList } from "./SpecimenDuplicateList";

type SpecimenSavedDuplicatesProps = {
  specimenId: string;
  /** The save that just happened; it only decides that a check runs, never its result. */
  trigger: DuplicateRecheckTrigger;
};

const SAVED_LABEL: Record<DuplicateRecheckTrigger, string> = {
  created: "The draft was saved.",
  updated: "The core changes were saved.",
  provenance: "The provenance was saved.",
};

const RETRY_QUERY: Record<DuplicateRecheckTrigger, string> = {
  created: "created=1",
  updated: "updated=1",
  provenance: "provenance=updated",
};

/**
 * Duplicate warning after a save that can change the result (accession, names, or
 * collector/donor/location/date). The backend is always asked through
 * GET /specimens/:id/possible-duplicates, so a clear result is never taken from the URL.
 */
export async function SpecimenSavedDuplicates({ specimenId, trigger }: SpecimenSavedDuplicatesProps) {
  const recheck = await getSpecimenPossibleDuplicates(specimenId).catch(() => null);
  const outcome = recheck ? duplicateCheckOutcome(recheck) : "unavailable";

  if (recheck && outcome === "found") {
    const count = recheck.possibleDuplicates.length;
    return (
      <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">
          {count === 1
            ? "1 existing specimen may be a duplicate of this record."
            : `${count} existing specimens may be duplicates of this record.`}
        </p>
        <p className="mt-1 text-amber-900">
          {SAVED_LABEL[trigger]} Review these records and edit or archive either one if they
          describe the same specimen.
        </p>
        <SpecimenDuplicateList duplicates={recheck.possibleDuplicates} />
      </div>
    );
  }

  if (outcome === "clear") {
    return (
      <p role="status" className="text-sm text-emerald-800">
        No possible duplicates were found for this record.
      </p>
    );
  }

  // The lookup failed or could not run: do not imply "no duplicates".
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p>
        {SAVED_LABEL[trigger]} The duplicate check could not run, so possible duplicates are
        unknown.{trigger === "created" && " Do not create the record again."}
      </p>
      <Link
        href={`/specimens/${specimenId}?${RETRY_QUERY[trigger]}`}
        className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
      >
        Check again
      </Link>
    </div>
  );
}
