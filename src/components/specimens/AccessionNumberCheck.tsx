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

  if (checking) {
    return (
      <p aria-live="polite" className="mt-1 text-xs text-zinc-500">
        Checking accession number…
      </p>
    );
  }
  if (state.status === "available") {
    return (
      <p aria-live="polite" className="mt-1 text-xs font-medium text-forest-700">
        This accession number is available.
      </p>
    );
  }
  if (state.status === "taken") {
    return (
      <p aria-live="polite" className="mt-1 text-xs font-medium text-red-700">
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
      </p>
    );
  }
  return null;
}
