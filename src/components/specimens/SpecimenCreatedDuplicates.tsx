import Link from "next/link";
import { getSpecimenPossibleDuplicates } from "@/features/specimens/api";
import { duplicateCheckOutcome, type DuplicateCheckOutcome } from "@/features/specimens/duplicates";
import { SpecimenDuplicateList } from "./SpecimenDuplicateList";

type SpecimenCreatedDuplicatesProps = {
  specimenId: string;
  /** Outcome of the lookup POST /specimens ran after saving. */
  outcome: DuplicateCheckOutcome;
};

/**
 * Duplicate warning shown right after a draft is created. The redirect only carries the
 * outcome, so the list is re-read from GET /specimens/:id/possible-duplicates, which is also
 * the backend's documented re-check when the post-save lookup was unavailable.
 */
export async function SpecimenCreatedDuplicates({
  specimenId,
  outcome,
}: SpecimenCreatedDuplicatesProps) {
  if (outcome === "clear") {
    return (
      <p role="status" className="text-sm text-emerald-800">
        No possible duplicates were found for this draft.
      </p>
    );
  }

  const recheck = await getSpecimenPossibleDuplicates(specimenId).catch(() => null);
  const recheckOutcome = recheck ? duplicateCheckOutcome(recheck) : "unavailable";

  if (recheck && recheckOutcome === "found") {
    const count = recheck.possibleDuplicates.length;
    return (
      <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold">
          {count === 1
            ? "1 existing specimen may be a duplicate of this draft."
            : `${count} existing specimens may be duplicates of this draft.`}
        </p>
        <p className="mt-1 text-amber-900">
          The draft was saved. Review these records and edit or archive either one if they
          describe the same specimen.
        </p>
        <SpecimenDuplicateList duplicates={recheck.possibleDuplicates} />
      </div>
    );
  }

  if (recheckOutcome === "clear") {
    return (
      <p role="status" className="text-sm text-emerald-800">
        No possible duplicates were found for this draft.
      </p>
    );
  }

  // Both the post-save lookup and the re-check failed: do not imply "no duplicates".
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
    >
      <p>
        The draft was saved, but the duplicate check could not run, so possible duplicates are
        unknown. Do not create the record again.
      </p>
      <Link
        href={`/specimens/${specimenId}?created=1&duplicates=unavailable`}
        className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
      >
        Check again
      </Link>
    </div>
  );
}
