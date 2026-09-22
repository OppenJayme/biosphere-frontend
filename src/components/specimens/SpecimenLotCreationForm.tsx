"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createSpecimenLotAction } from "@/features/specimen-lots/actions";
import {
  EMPTY_CREATE_LOT_FORM_VALUES,
  type CreateLotFormField,
  type CreateLotFormState,
} from "@/features/specimen-lots/form";
import type { StorageUnitOption } from "@/features/specimen-lots/types";

type SpecimenLotCreationFormProps = {
  specimenId: string;
  storageUnits: StorageUnitOption[];
};

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

function FieldError({ field, errors }: { field: CreateLotFormField; errors?: string[] }) {
  if (!errors?.length) return null;

  return (
    <p id={`${field}-error`} className="mt-1 text-xs font-medium text-red-700">
      {errors[0]}
    </p>
  );
}

export function SpecimenLotCreationForm({
  specimenId,
  storageUnits,
}: SpecimenLotCreationFormProps) {
  const action = createSpecimenLotAction.bind(null, specimenId);
  const [state, formAction, pending] = useActionState<CreateLotFormState, FormData>(
    action,
    { values: EMPTY_CREATE_LOT_FORM_VALUES },
  );
  const hasStorageUnits = storageUnits.length > 0;

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="mb-5 border-b border-black/5 pb-4">
          <h2 className="font-serif text-lg font-semibold text-forest-800">
            Initial lot details
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            A lot represents specimens sharing one storage location and condition. Its
            initial quantity is recorded in transaction and audit history.
          </p>
        </div>

        {!hasStorageUnits && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">No assignable storage location is available.</p>
            <p className="mt-1">
              Create or update an active storage unit that is allowed to hold specimens
              before adding this lot.
            </p>
            <Link href="/storage" className="mt-2 inline-flex font-semibold text-forest-800 hover:underline">
              Open storage locations
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="storageUnitId" className="block text-xs font-medium text-zinc-700">
              Storage location <span aria-hidden="true">*</span>
            </label>
            <select
              id="storageUnitId"
              name="storageUnitId"
              required
              disabled={!hasStorageUnits}
              defaultValue={state.values.storageUnitId}
              aria-invalid={Boolean(state.errors?.storageUnitId?.length)}
              aria-describedby={
                state.errors?.storageUnitId?.length ? "storageUnitId-error" : undefined
              }
              className={inputClasses}
            >
              <option value="">Select an active storage location</option>
              {storageUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.label}
                </option>
              ))}
            </select>
            <FieldError field="storageUnitId" errors={state.errors?.storageUnitId} />
          </div>

          <div>
            <label htmlFor="conditionClass" className="block text-xs font-medium text-zinc-700">
              Condition classification <span aria-hidden="true">*</span>
            </label>
            <input
              id="conditionClass"
              name="conditionClass"
              type="text"
              required
              defaultValue={state.values.conditionClass}
              placeholder="Enter the curator-confirmed condition"
              aria-invalid={Boolean(state.errors?.conditionClass?.length)}
              aria-describedby={
                state.errors?.conditionClass?.length ? "conditionClass-error" : undefined
              }
              className={inputClasses}
            />
            <p className="mt-1 text-xs text-zinc-500">
              This remains curator-managed text until the museum approves a controlled list.
            </p>
            <FieldError field="conditionClass" errors={state.errors?.conditionClass} />
          </div>

          <div>
            <label htmlFor="quantity" className="block text-xs font-medium text-zinc-700">
              Initial quantity <span aria-hidden="true">*</span>
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={2147483647}
              step={1}
              required
              defaultValue={state.values.quantity}
              aria-invalid={Boolean(state.errors?.quantity?.length)}
              aria-describedby={state.errors?.quantity?.length ? "quantity-error" : undefined}
              className={inputClasses}
            />
            <FieldError field="quantity" errors={state.errors?.quantity} />
          </div>

          <div>
            <label htmlFor="storageNotes" className="block text-xs font-medium text-zinc-700">
              Storage notes
            </label>
            <textarea
              id="storageNotes"
              name="storageNotes"
              rows={4}
              defaultValue={state.values.storageNotes}
              placeholder="Optional placement or handling notes"
              aria-invalid={Boolean(state.errors?.storageNotes?.length)}
              aria-describedby={
                state.errors?.storageNotes?.length ? "storageNotes-error" : undefined
              }
              className={inputClasses}
            />
            <FieldError field="storageNotes" errors={state.errors?.storageNotes} />
          </div>

          <div>
            <label htmlFor="reason" className="block text-xs font-medium text-zinc-700">
              Initial quantity reason
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={4}
              defaultValue={state.values.reason}
              placeholder="Optional context for the initial addition"
              aria-invalid={Boolean(state.errors?.reason?.length)}
              aria-describedby={state.errors?.reason?.length ? "reason-error" : undefined}
              className={inputClasses}
            />
            <FieldError field="reason" errors={state.errors?.reason} />
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
          href={`/specimens/${specimenId}`}
          className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending || !hasStorageUnits}
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating lot..." : "Create specimen lot"}
        </button>
      </div>
    </form>
  );
}
