"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createTaxonomyAction,
  updateTaxonomyAction,
} from "@/features/specimens/taxonomy-actions";
import {
  type TaxonomyFormField,
  type TaxonomyFormMode,
  type TaxonomyFormState,
  type TaxonomyFormValues,
} from "@/features/specimens/taxonomy-form";

type SpecimenTaxonomyFormProps = {
  specimenId: string;
  mode: TaxonomyFormMode;
  initialValues: TaxonomyFormValues;
};

const fields: Array<{
  name: TaxonomyFormField;
  label: string;
  maxLength: number;
  placeholder: string;
  wide?: boolean;
}> = [
  { name: "kingdom", label: "Kingdom", maxLength: 100, placeholder: "e.g. Animalia" },
  { name: "phylum", label: "Phylum", maxLength: 100, placeholder: "e.g. Chordata" },
  { name: "class", label: "Class", maxLength: 100, placeholder: "e.g. Aves" },
  { name: "orderName", label: "Order", maxLength: 100, placeholder: "e.g. Accipitriformes" },
  { name: "family", label: "Family", maxLength: 100, placeholder: "e.g. Accipitridae" },
  { name: "genus", label: "Genus", maxLength: 100, placeholder: "e.g. Pithecophaga" },
  { name: "species", label: "Species", maxLength: 100, placeholder: "e.g. jefferyi" },
  {
    name: "ecologicalRole",
    label: "Ecological role",
    maxLength: 100,
    placeholder: "e.g. Apex predator",
  },
  {
    name: "conservationStatus",
    label: "Conservation status",
    maxLength: 100,
    placeholder: "Enter curator-confirmed status",
  },
  {
    name: "habitat",
    label: "Habitat",
    maxLength: 250,
    placeholder: "Enter the recorded habitat",
    wide: true,
  },
];

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

export function SpecimenTaxonomyForm({
  specimenId,
  mode,
  initialValues,
}: SpecimenTaxonomyFormProps) {
  const action: (
    state: TaxonomyFormState,
    formData: FormData,
  ) => Promise<TaxonomyFormState> =
    mode === "create"
      ? createTaxonomyAction.bind(null, specimenId)
      : updateTaxonomyAction.bind(null, specimenId);
  const [state, formAction, pending] = useActionState(action, { values: initialValues });

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-black/5 pb-4">
          <h2 className="font-serif text-lg font-semibold text-forest-800">
            Taxonomic classification
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Record only curator-confirmed values. Partial classification is allowed, and no field
            is guessed from another field.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {fields.map((field) => {
            const errorId = `${field.name}-error`;
            const errors = state.errors?.[field.name];

            return (
              <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
                <label htmlFor={field.name} className="block text-xs font-medium text-zinc-700">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  maxLength={field.maxLength}
                  defaultValue={state.values[field.name]}
                  placeholder={field.placeholder}
                  aria-invalid={Boolean(errors?.length)}
                  aria-describedby={errors?.length ? errorId : undefined}
                  className={inputClasses}
                />
                {errors?.length ? (
                  <p id={errorId} className="mt-1 text-xs font-medium text-red-700">
                    {errors[0]}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {state.message && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.message}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href={`/specimens/${specimenId}`}
          className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Saving..."
            : mode === "create"
              ? "Create taxonomy record"
              : "Save taxonomy changes"}
        </button>
      </div>
    </form>
  );
}
