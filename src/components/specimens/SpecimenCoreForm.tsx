"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createSpecimenAction, updateSpecimenAction } from "@/features/specimens/actions";
import {
  type SpecimenFormField,
  type SpecimenFormState,
  type SpecimenFormValues,
} from "@/features/specimens/form";
import { SPECIMEN_GENDERS, type MuseumCollection } from "@/features/specimens/types";

type SpecimenCoreFormProps = {
  mode: "create" | "edit";
  collections: MuseumCollection[];
  initialValues: SpecimenFormValues;
  specimenId?: string;
};

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

function genderLabel(gender: (typeof SPECIMEN_GENDERS)[number]) {
  return gender
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;

  return (
    <p id={id} className="mt-1 text-xs font-medium text-red-700">
      {errors[0]}
    </p>
  );
}

function fieldErrorId(field: SpecimenFormField) {
  return `${field}-error`;
}

export function SpecimenCoreForm({
  mode,
  collections,
  initialValues,
  specimenId,
}: SpecimenCoreFormProps) {
  const action: (
    state: SpecimenFormState,
    formData: FormData,
  ) => Promise<SpecimenFormState> =
    mode === "edit" && specimenId
      ? updateSpecimenAction.bind(null, specimenId)
      : createSpecimenAction;
  const [state, formAction, pending] = useActionState(action, { values: initialValues });
  const cancelHref = mode === "edit" && specimenId ? `/specimens/${specimenId}` : "/specimens";

  const describedBy = (field: SpecimenFormField) =>
    state.errors?.[field]?.length ? fieldErrorId(field) : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-black/5 pb-4">
          <h2 className="font-serif text-lg font-semibold text-forest-800">Core record</h2>
          <p className="mt-1 text-sm text-zinc-600">
            All fields may remain empty while this is an uncataloged draft. Add only confirmed
            museum information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="collectionId" className="block text-xs font-medium text-zinc-700">
              Collection
            </label>
            <select
              id="collectionId"
              name="collectionId"
              defaultValue={state.values.collectionId}
              aria-describedby={describedBy("collectionId")}
              aria-invalid={Boolean(state.errors?.collectionId?.length)}
              className={inputClasses}
            >
              <option value="">Not assigned</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.collectionName}
                </option>
              ))}
            </select>
            <FieldError id={fieldErrorId("collectionId")} errors={state.errors?.collectionId} />
          </div>

          <div>
            <label htmlFor="accessionNumber" className="block text-xs font-medium text-zinc-700">
              Accession number
            </label>
            <input
              id="accessionNumber"
              name="accessionNumber"
              type="text"
              maxLength={100}
              defaultValue={state.values.accessionNumber}
              aria-describedby={describedBy("accessionNumber")}
              aria-invalid={Boolean(state.errors?.accessionNumber?.length)}
              className={inputClasses}
              placeholder="e.g. USCBM-2026-001"
            />
            <FieldError
              id={fieldErrorId("accessionNumber")}
              errors={state.errors?.accessionNumber}
            />
          </div>

          <div>
            <label htmlFor="specimenCategory" className="block text-xs font-medium text-zinc-700">
              Specimen category
            </label>
            <input
              id="specimenCategory"
              name="specimenCategory"
              type="text"
              maxLength={100}
              defaultValue={state.values.specimenCategory}
              aria-describedby={describedBy("specimenCategory")}
              aria-invalid={Boolean(state.errors?.specimenCategory?.length)}
              className={inputClasses}
              placeholder="e.g. Bird"
            />
            <FieldError
              id={fieldErrorId("specimenCategory")}
              errors={state.errors?.specimenCategory}
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-xs font-medium text-zinc-700">
              Specimen gender
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={state.values.gender}
              aria-describedby={describedBy("gender")}
              aria-invalid={Boolean(state.errors?.gender?.length)}
              className={inputClasses}
            >
              <option value="">Not recorded</option>
              {SPECIMEN_GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {genderLabel(gender)}
                </option>
              ))}
            </select>
            <FieldError id={fieldErrorId("gender")} errors={state.errors?.gender} />
          </div>

          <div>
            <label htmlFor="commonName" className="block text-xs font-medium text-zinc-700">
              Common name
            </label>
            <input
              id="commonName"
              name="commonName"
              type="text"
              maxLength={255}
              defaultValue={state.values.commonName}
              aria-describedby={describedBy("commonName")}
              aria-invalid={Boolean(state.errors?.commonName?.length)}
              className={inputClasses}
              placeholder="e.g. Philippine eagle"
            />
            <FieldError id={fieldErrorId("commonName")} errors={state.errors?.commonName} />
          </div>

          <div>
            <label htmlFor="scientificName" className="block text-xs font-medium text-zinc-700">
              Scientific name
            </label>
            <input
              id="scientificName"
              name="scientificName"
              type="text"
              maxLength={255}
              defaultValue={state.values.scientificName}
              aria-describedby={describedBy("scientificName")}
              aria-invalid={Boolean(state.errors?.scientificName?.length)}
              className={inputClasses}
              placeholder="e.g. Pithecophaga jefferyi"
            />
            <FieldError
              id={fieldErrorId("scientificName")}
              errors={state.errors?.scientificName}
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="classificationStatus"
              className="block text-xs font-medium text-zinc-700"
            >
              Classification status
            </label>
            <input
              id="classificationStatus"
              name="classificationStatus"
              type="text"
              defaultValue={state.values.classificationStatus}
              aria-describedby={describedBy("classificationStatus")}
              aria-invalid={Boolean(state.errors?.classificationStatus?.length)}
              className={inputClasses}
              placeholder="Enter the curator-approved classification status"
            />
            <FieldError
              id={fieldErrorId("classificationStatus")}
              errors={state.errors?.classificationStatus}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="remarks" className="block text-xs font-medium text-zinc-700">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={5}
              defaultValue={state.values.remarks}
              aria-describedby={describedBy("remarks")}
              aria-invalid={Boolean(state.errors?.remarks?.length)}
              className={`${inputClasses} resize-y`}
              placeholder="Record relevant notes without adding unverified assumptions"
            />
            <FieldError id={fieldErrorId("remarks")} errors={state.errors?.remarks} />
          </div>
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
          href={cancelHref}
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
              ? "Save uncataloged draft"
              : "Save core changes"}
        </button>
      </div>
    </form>
  );
}
