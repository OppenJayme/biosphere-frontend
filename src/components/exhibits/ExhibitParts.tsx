/** Small building blocks shared by the curator exhibit table, panel, editor, and create dialog. */

import type { ReactNode } from "react";
import { EXHIBIT_LAYOUT_LABELS, EXHIBIT_LAYOUTS, EXHIBIT_STATUS_LABELS, type ExhibitStatus } from "@/features/exhibits-qr/types";
import type { ExhibitContentValues } from "@/features/exhibits-qr/form";
import { GridIcon, ListIcon } from "@/components/icons";

const STATUS_STYLES: Record<ExhibitStatus, string> = {
  PUBLISHED: "bg-forest-100 text-forest-700",
  UNPUBLISHED: "bg-zinc-100 text-zinc-600",
  DISABLED: "bg-amber-100 text-amber-800",
};

export function ExhibitStatusBadge({ status }: { status: ExhibitStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>
      {EXHIBIT_STATUS_LABELS[status]}
    </span>
  );
}

export const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 aria-invalid:border-red-600 disabled:cursor-not-allowed disabled:bg-zinc-100";

export function FormMessage({ ok, message }: { ok?: boolean; message?: string }) {
  if (!message) return null;
  return ok ? (
    <p role="status" className="text-xs font-medium text-forest-700">{message}</p>
  ) : (
    <p role="alert" className="text-xs font-medium text-red-700">{message}</p>
  );
}

function FieldLabel({ htmlFor, label, hint, error, children }: {
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function errorProps(id: string, error?: string) {
  return error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};
}

const LAYOUT_DESCRIPTIONS = {
  "mobile-accordion": "Photo carousel with collapsible sections. Best for phones.",
  "card-grid": "Large photo, description panel, then classification and ecology cards.",
} as const;

const LAYOUT_ICONS = { "mobile-accordion": ListIcon, "card-grid": GridIcon } as const;

/**
 * The curator-controlled public content of an exhibit (REQ-4.12-03). Name, taxonomy, habitat, and
 * conservation status come from the specimen record and are edited in Cataloging.
 */
export function ExhibitContentFields({
  idPrefix,
  values,
  errors = {},
}: {
  idPrefix: string;
  values: ExhibitContentValues;
  errors?: Partial<Record<keyof ExhibitContentValues, string>>;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-xs font-medium text-zinc-700">Public page layout</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {EXHIBIT_LAYOUTS.map((layout) => {
            const Icon = LAYOUT_ICONS[layout];
            return (
              <label
                key={layout}
                className="flex cursor-pointer gap-3 rounded-lg border border-black/15 p-3 has-checked:border-forest-700 has-checked:bg-forest-50 has-focus-visible:ring-2 has-focus-visible:ring-forest-700"
              >
                <input
                  type="radio"
                  name="layoutType"
                  value={layout}
                  defaultChecked={values.layoutType === layout}
                  className="mt-0.5 accent-forest-700"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                    <Icon className="h-4 w-4 text-forest-700" />
                    {EXHIBIT_LAYOUT_LABELS[layout]}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{LAYOUT_DESCRIPTIONS[layout]}</span>
                </span>
              </label>
            );
          })}
        </div>
        {errors.layoutType && <p className="mt-1 text-xs font-medium text-red-700">{errors.layoutType}</p>}
      </fieldset>

      <FieldLabel
        htmlFor={id("publicDescription")}
        label="Public description"
        hint="What visitors read about this specimen. Leave blank to hide the section."
        error={errors.publicDescription}
      >
        <textarea
          id={id("publicDescription")}
          name="publicDescription"
          rows={4}
          defaultValue={values.publicDescription}
          className={`${inputClasses} resize-y`}
          {...errorProps(id("publicDescription"), errors.publicDescription)}
        />
      </FieldLabel>

      <FieldLabel
        htmlFor={id("interestingFacts")}
        label="Interesting facts"
        hint="One fact per line. Shown as a list; leave blank to hide it."
        error={errors.interestingFacts}
      >
        <textarea
          id={id("interestingFacts")}
          name="interestingFacts"
          rows={3}
          defaultValue={values.interestingFacts}
          className={`${inputClasses} resize-y`}
          {...errorProps(id("interestingFacts"), errors.interestingFacts)}
        />
      </FieldLabel>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel htmlFor={id("distribution")} label="Distribution" error={errors.distribution}>
          <input
            id={id("distribution")}
            name="distribution"
            maxLength={255}
            defaultValue={values.distribution}
            placeholder="e.g. Mindanao, Philippines"
            className={inputClasses}
            {...errorProps(id("distribution"), errors.distribution)}
          />
        </FieldLabel>
        <FieldLabel htmlFor={id("diet")} label="Diet" error={errors.diet}>
          <input
            id={id("diet")}
            name="diet"
            maxLength={255}
            defaultValue={values.diet}
            placeholder="e.g. Fruits, seeds"
            className={inputClasses}
            {...errorProps(id("diet"), errors.diet)}
          />
        </FieldLabel>
      </div>
    </div>
  );
}
