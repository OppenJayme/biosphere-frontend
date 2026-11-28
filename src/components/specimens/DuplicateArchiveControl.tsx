/**
 * Archive from the duplicate review page, with the same confirmation and backend rule as the
 * details page. While active lots remain it explains why and links to them; it never changes
 * lots or quantities itself.
 */

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { archiveBlockReason } from "@/features/specimens/lifecycle";
import {
  archiveFromDuplicateReviewAction,
  type LifecycleActionState,
} from "@/features/specimens/lifecycle-actions";
import type { DuplicateReviewRecord } from "@/features/specimens/types";

export function DuplicateArchiveControl({ record, label }: { record: DuplicateReviewRecord; label: string }) {
  const action = archiveFromDuplicateReviewAction.bind(null, record.specimenId);
  const [state, formAction, pending] = useActionState<LifecycleActionState, FormData>(action, {});
  const blocked = archiveBlockReason(record.status, record.activeLotCount);

  if (blocked) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-950">
        <p>Can&apos;t archive yet: {blocked}</p>
        <Link
          href={`/specimens/${record.specimenId}/lots`}
          className="mt-1 inline-block font-semibold text-forest-800 hover:underline"
        >
          Go to lots
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <ConfirmButton
        label="Archive"
        question={`Archive ${label}?`}
        confirmLabel="Yes, archive"
        detail="History is preserved and public eligibility is disabled. It leaves this review list and the active catalog; you can restore it later."
        tone="danger"
        pending={pending}
        pendingLabel="Archiving…"
        className="w-full rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {state.message && (
        <p role="alert" className="mt-1.5 text-xs text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
