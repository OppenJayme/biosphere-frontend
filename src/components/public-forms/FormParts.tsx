/** Pieces shared by the public General Inquiry and Request-a-Visit forms. */

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError, fieldErrorId } from "@/components/ui/Field";
import { AlertTriangleIcon, CheckIcon } from "@/components/icons";
import type { SubmissionReceipt } from "@/features/public-submissions/submit";

/**
 * Consent to the privacy notice (RA 10173). The backend rejects a submission without it.
 * TODO(curators): replace the wording with the museum's approved privacy notice once issued.
 */
export function PrivacyConsent({ id, purpose, error }: { id: string; purpose: string; error?: string }) {
  return (
    <div>
      <div className="flex gap-3 rounded-xl bg-brand-soft p-4">
        <input
          id={id}
          name="consent"
          type="checkbox"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? fieldErrorId(id) : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-solid)]"
        />
        <label htmlFor={id} className="text-sm leading-relaxed text-ink">
          I agree that the USC Biological Museum may keep and use the details above only to respond
          to {purpose}, in line with the Data Privacy Act of 2012 (RA 10173).
        </label>
      </div>
      {error && <FieldError id={fieldErrorId(id)}>{error}</FieldError>}
    </div>
  );
}

/** Submission-level error (network, rate limit, rejected fields). Takes focus so screen readers hear it. */
export function FormAlert({ message, details }: { message: string; details: string[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [message]);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 outline-none"
    >
      <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">{message}</p>
        {details.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-red-800">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Shown in place of the form once the backend has stored the submission. */
export function SubmissionSuccess({
  title,
  receipt,
  children,
  onDone,
  onAnother,
}: {
  title: string;
  receipt: SubmissionReceipt;
  children: ReactNode;
  onDone?: () => void;
  onAnother: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status" className="space-y-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <CheckIcon className="h-6 w-6" />
      </span>
      <h3 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold tracking-tight text-ink outline-none">
        {title}
      </h3>
      <div className="space-y-3 text-sm leading-relaxed text-ink-muted">{children}</div>
      {receipt.referenceCode && (
        <p className="text-sm text-ink-muted">
          Reference number{" "}
          <span className="rounded-md bg-brand-soft px-2 py-1 font-mono text-xs text-ink">
            {receipt.referenceCode}
          </span>
          <span className="mt-2 block text-xs">Mention it if you contact the museum about this request.</span>
        </p>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        {onDone && (
          <Button variant="solid-forest" onClick={onDone}>
            Done
          </Button>
        )}
        <Button variant="outline-forest" onClick={onAnother}>
          Send another
        </Button>
      </div>
    </div>
  );
}

/** Moves focus to the first invalid control after a failed client-side check. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
