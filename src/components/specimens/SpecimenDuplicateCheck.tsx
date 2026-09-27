"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type RefObject } from "react";
import { checkSpecimenDuplicatesAction } from "@/features/specimens/actions";
import { duplicateCheckCandidate, type DuplicateCheckState } from "@/features/specimens/duplicates";
import { SpecimenDuplicateList } from "./SpecimenDuplicateList";

const CHECKED_FIELDS = new Set(["accessionNumber", "scientificName", "commonName"]);

function formText(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

type SpecimenDuplicateCheckProps = {
  formRef: RefObject<HTMLFormElement | null>;
  excludeSpecimenId?: string;
};

/**
 * Checks accession and names against saved records when the curator leaves one of those
 * fields. Warning only: saving is never blocked (REQ-4.4-21/22).
 */
export function SpecimenDuplicateCheck({ formRef, excludeSpecimenId }: SpecimenDuplicateCheckProps) {
  const [state, setState] = useState<DuplicateCheckState>({ status: "idle" });
  const [checking, startTransition] = useTransition();
  const lastCheckedKey = useRef<string | null>(null);
  const requestId = useRef(0);

  const runCheck = useCallback(
    (force: boolean) => {
      const form = formRef.current;
      if (!form) return;

      const formData = new FormData(form);
      const candidate = duplicateCheckCandidate(
        {
          accessionNumber: formText(formData, "accessionNumber"),
          scientificName: formText(formData, "scientificName"),
          commonName: formText(formData, "commonName"),
        },
        excludeSpecimenId,
      );
      const key = JSON.stringify(candidate);
      if (!force && key === lastCheckedKey.current) return;
      lastCheckedKey.current = key;

      const current = ++requestId.current;
      if (!candidate) {
        setState({ status: "idle" });
        return;
      }

      startTransition(async () => {
        const result = await checkSpecimenDuplicatesAction(candidate);
        // Ignore answers to values the curator has since changed.
        if (current === requestId.current) setState(result);
      });
    },
    [excludeSpecimenId, formRef],
  );

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const onFocusOut = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement && CHECKED_FIELDS.has(target.name)) runCheck(false);
    };
    form.addEventListener("focusout", onFocusOut);
    return () => form.removeEventListener("focusout", onFocusOut);
  }, [formRef, runCheck]);

  if (state.status === "idle" && !checking) return null;

  return (
    <div aria-live="polite" className="rounded-xl border border-black/10 bg-white p-4 text-sm sm:p-5">
      {checking && <p className="text-zinc-600">Checking for possible duplicates…</p>}

      {!checking && state.status === "clear" && (
        <p className="text-emerald-800">
          No possible duplicates were found for this accession number and name.
        </p>
      )}

      {!checking && state.status === "found" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
          <p className="font-semibold">
            {state.duplicates.length === 1
              ? "1 existing specimen may be a duplicate."
              : `${state.duplicates.length} existing specimens may be duplicates.`}
          </p>
          <p className="mt-1 text-amber-900">
            You can still save. Review the records below and decide whether this is a separate
            specimen.
          </p>
          <SpecimenDuplicateList duplicates={state.duplicates} />
        </div>
      )}

      {!checking && state.status === "unavailable" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
          <p>
            The duplicate check could not run, so possible duplicates are unknown. You can still
            save.
          </p>
          <button
            type="button"
            onClick={() => runCheck(true)}
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100"
          >
            Check again
          </button>
        </div>
      )}
    </div>
  );
}
