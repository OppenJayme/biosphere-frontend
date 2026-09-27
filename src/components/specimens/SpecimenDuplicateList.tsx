import Link from "next/link";
import { DUPLICATE_FIELD_LABELS, duplicateLabel } from "@/features/specimens/duplicates";
import type { PossibleDuplicate } from "@/features/specimens/types";

function fieldList(fields: PossibleDuplicate["matchedFields"]) {
  return fields.map((field) => DUPLICATE_FIELD_LABELS[field]).join(", ");
}

/** Possible duplicates as warnings only; the curator decides whether to edit or archive. */
export function SpecimenDuplicateList({ duplicates }: { duplicates: PossibleDuplicate[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {duplicates.map((duplicate) => (
        <li
          key={duplicate.specimenId}
          className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/specimens/${duplicate.specimenId}`}
              target="_blank"
              className="font-semibold text-forest-800 hover:underline"
            >
              {duplicateLabel(duplicate)}
            </Link>
            <span className="flex gap-1.5 text-xs font-semibold">
              <span
                className={
                  duplicate.confidence === "HIGH"
                    ? "rounded-full bg-red-100 px-2 py-0.5 text-red-800"
                    : "rounded-full bg-amber-100 px-2 py-0.5 text-amber-900"
                }
              >
                {duplicate.confidence === "HIGH" ? "High confidence" : "Medium confidence"}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700">
                {duplicate.status}
              </span>
            </span>
          </div>
          <p className="mt-1 text-zinc-700">{duplicate.message}</p>
          {duplicate.matchedFields.length > 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              Matches: {fieldList(duplicate.matchedFields)}
            </p>
          )}
          {duplicate.differingFields.length > 0 && (
            <p className="mt-0.5 text-xs text-zinc-500">
              Differs: {fieldList(duplicate.differingFields)}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
