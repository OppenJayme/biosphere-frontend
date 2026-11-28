/**
 * Field styling for the public General Inquiry and Request-a-Visit forms. Panel feedback asked
 * for a friendlier, easier-to-read palette there, so these use darker, larger labels, softly
 * tinted inputs and plain-language section titles. Curator forms keep components/ui/Field.
 */

import type { ReactNode } from "react";
import { FieldError, fieldErrorId } from "@/components/ui/Field";
import { InfoIcon } from "@/components/icons";

export const publicFieldClasses =
  "mt-1.5 w-full rounded-xl border border-forest-900/15 bg-sage-50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 transition-colors hover:border-forest-900/30 focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 aria-invalid:border-red-600 aria-invalid:bg-red-50/50 aria-invalid:focus:ring-red-600/20";

export function PublicField({
  label,
  htmlFor,
  optional = false,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Marks the label "(optional)" so required fields don't each need an asterisk. */
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {children}
      {error && <FieldError id={fieldErrorId(htmlFor)}>{error}</FieldError>}
    </div>
  );
}

/** A titled group of fields, with an optional one-line explanation under the title. */
export function FormSection({
  title,
  description,
  headingId,
  children,
}: {
  title: string;
  description?: ReactNode;
  headingId?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 id={headingId} className="text-base font-semibold text-ink">
          {title}
        </h3>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/** A short rule or tip, set apart from the fields so it reads as guidance rather than another input. */
export function FormHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} className="flex gap-2.5 rounded-xl bg-brand-soft/70 px-3.5 py-3 text-sm leading-relaxed text-ink">
      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}
