"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type RefObject } from "react";
import { checkAccessionNumberAction } from "@/features/specimens/actions";
import type { AccessionCheckState } from "@/features/specimens/accession";

type AccessionNumberCheckProps = {
  formRef: RefObject<HTMLFormElement | null>;
  excludeSpecimenId?: string;
};

/**
 * Tells the curator, when they leave the accession field, whether the number is already
 * assigned (REQ-4.4-04). Advisory: the save re-checks and the field error then comes from
 * the server.
 */
export function AccessionNumberCheck({ formRef, excludeSpecimenId }: AccessionNumberCheckProps) {
  const [state, setState] = useState<AccessionCheckState>({ status: "idle" });
  const [checking, startTransition] = useTransition();
  const lastChecked = useRef<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const form = formRef.current;
    const input = form?.elements.namedItem("accessionNumber");
    if (!(input instanceof HTMLInputElement)) return;

    const onBlur = () => {
      const value = input.value.trim();
      if (value === lastChecked.current) return;
      lastChecked.current = value;
      const current = ++requestId.current;

      if (!value) {
        setState({ status: "idle" });
        return;
      }
      startTransition(async () => {
        const result = await checkAccessionNumberAction({
          accessionNumber: value,
          excludeSpecimenId,
        });
        // Ignore answers to values the curator has since changed.
        if (current === requestId.current) setState(result);
      });
    };
    const onInput = () => {
      requestId.current += 1;
      lastChecked.current = null;
      setState({ status: "idle" });
    };

    input.addEventListener("blur", onBlur);
    input.addEventListener("input", onInput);
    return () => {
      input.removeEventListener("blur", onBlur);
      input.removeEventListener("input", onInput);
    };
  }, [excludeSpecimenId, formRef]);

  // One line is always reserved, even when idle: the check starts on blur, often from the
  // pointer-down on Save, and a status line appearing then would push Save away before the
  // pointer is released (same failure as BB-SPC-01). The region also stays mounted, so screen
  // readers announce each change reliably.
  const tone = checking
    ? "text-zinc-500"
    : state.status === "available"
      ? "font-medium text-forest-700"
      : "font-medium text-red-700";
  return (
    <p aria-live="polite" className={`mt-1 min-h-4 text-xs leading-4 ${tone}`}>
      {checking ? (
        "Checking accession number…"
      ) : state.status === "available" ? (
        "This accession number is available."
      ) : state.status === "taken" ? (
        <>
          {state.message}{" "}
          {state.holder && (
            <Link
              href={`/specimens/${state.holder.id}`}
              target="_blank"
              className="underline underline-offset-2"
            >
              View record
            </Link>
          )}
        </>
      ) : null}
    </p>
  );
}
