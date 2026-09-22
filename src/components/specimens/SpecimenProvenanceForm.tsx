"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createProvenanceAction,
  updateProvenanceAction,
} from "@/features/specimens/provenance-actions";
import {
  type ProvenanceFormField,
  type ProvenanceFormMode,
  type ProvenanceFormState,
  type ProvenanceFormValues,
} from "@/features/specimens/provenance-form";

type SpecimenProvenanceFormProps = {
  specimenId: string;
  mode: ProvenanceFormMode;
  initialValues: ProvenanceFormValues;
};

const textFields: Array<{
  name: Exclude<ProvenanceFormField, "collectionDate">;
  label: string;
  placeholder: string;
}> = [
  { name: "collector", label: "Collector", placeholder: "Enter the recorded collector" },
  { name: "donor", label: "Donor", placeholder: "Enter the recorded donor" },
  {
    name: "collectionLocation",
    label: "Collection location",
    placeholder: "Enter the recorded collection location",
  },
  {
    name: "preservationType",
    label: "Preservation type",
    placeholder: "Enter the curator-confirmed preservation type",
  },
  {
    name: "preservationMethod",
    label: "Preservation method",
    placeholder: "Enter the curator-confirmed preservation method",
  },
];

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

function FieldError({ field, errors }: { field: ProvenanceFormField; errors?: string[] }) {
  if (!errors?.length) return null;

  return (
    <p id={`${field}-error`} className="mt-1 text-xs font-medium text-red-700">
      {errors[0]}
    </p>
  );
}

export function SpecimenProvenanceForm({
  specimenId,
  mode,
  initialValues,
}: SpecimenProvenanceFormProps) {
  const action: (
    state: ProvenanceFormState,
    formData: FormData,
  ) => Promise<ProvenanceFormState> =
    mode === "create"
      ? createProvenanceAction.bind(null, specimenId)
      : updateProvenanceAction.bind(null, specimenId);
  const [state, formAction, pending] = useActionState(action, { values: initialValues });

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-black/5 pb-4">
          <h2 className="font-serif text-lg font-semibold text-forest-800">
            Provenance and preservation
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Record only confirmed museum information. Preservation values remain curator-managed
            rather than being restricted to an unapproved fixed list.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {textFields.slice(0, 2).map((field) => {
            const errors = state.errors?.[field.name];
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-xs font-medium text-zinc-700">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  maxLength={255}
                  defaultValue={state.values[field.name]}
                  placeholder={field.placeholder}
                  aria-invalid={Boolean(errors?.length)}
                  aria-describedby={errors?.length ? `${field.name}-error` : undefined}
                  className={inputClasses}
                />
                <FieldError field={field.name} errors={errors} />
              </div>
            );
          })}

          <div>
            <label htmlFor="collectionDate" className="block text-xs font-medium text-zinc-700">
              Collection date
            </label>
            <input
              id="collectionDate"
              name="collectionDate"
              type="date"
              defaultValue={state.values.collectionDate}
              aria-invalid={Boolean(state.errors?.collectionDate?.length)}
              aria-describedby={
                state.errors?.collectionDate?.length ? "collectionDate-error" : undefined
              }
              className={inputClasses}
            />
            <FieldError field="collectionDate" errors={state.errors?.collectionDate} />
          </div>

          {textFields.slice(2).map((field) => {
            const errors = state.errors?.[field.name];
            return (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-xs font-medium text-zinc-700">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  maxLength={255}
                  defaultValue={state.values[field.name]}
                  placeholder={field.placeholder}
                  aria-invalid={Boolean(errors?.length)}
                  aria-describedby={errors?.length ? `${field.name}-error` : undefined}
                  className={inputClasses}
                />
                <FieldError field={field.name} errors={errors} />
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
              ? "Create provenance record"
              : "Save provenance changes"}
        </button>
      </div>
    </form>
  );
}
