/**
 * Controlled inventory workflows for one active specimen lot: movement, condition change,
 * quantity adjustment, and storage notes. Quantity, location, and condition are never edited
 * directly; each change goes through its backend command so transaction history is kept.
 */

"use client";

import { useActionState, useState } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import {
  adjustSpecimenLotQuantityAction,
  changeSpecimenLotConditionAction,
  moveSpecimenLotAction,
  updateSpecimenLotNotesAction,
  type LotSnapshot,
} from "@/features/specimen-lots/actions";
import {
  ADJUSTMENT_REASON_MAX,
  ADJUSTMENT_TYPE_OPTIONS,
  EMPTY_ADJUST_QUANTITY_VALUES,
  adjustmentDirection,
  emptyChangeConditionValues,
  emptyMoveLotValues,
  type AdjustQuantityFormState,
  type ChangeConditionFormState,
  type LotNotesFormState,
  type MoveLotFormState,
} from "@/features/specimen-lots/operations";
import type { QuantityAdjustmentType, StorageUnitOption } from "@/features/specimen-lots/types";

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

const submitClasses =
  "rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60";

type Tab = "move" | "condition" | "adjust" | "notes";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "move", label: "Move" },
  { id: "condition", label: "Change condition" },
  { id: "adjust", label: "Adjust quantity" },
  { id: "notes", label: "Storage notes" },
];

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-700">
      {errors[0]}
    </p>
  );
}

function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message}
    </div>
  );
}

function describedBy(id: string, errors?: string[]) {
  return errors?.length ? `${id}-error` : undefined;
}

function QuantityField({
  id,
  label,
  max,
  defaultValue,
  errors,
  hint,
}: {
  id: string;
  label: string;
  max?: number;
  defaultValue: string;
  errors?: string[];
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-700">
        {label} <span aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        name="quantity"
        type="number"
        inputMode="numeric"
        min={1}
        max={max ?? 2147483647}
        step={1}
        required
        defaultValue={defaultValue}
        aria-invalid={Boolean(errors?.length)}
        aria-describedby={describedBy(id, errors)}
        className={inputClasses}
      />
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      <FieldError id={id} errors={errors} />
    </div>
  );
}

function OptionalReasonField({
  id,
  defaultValue,
  errors,
  placeholder,
}: {
  id: string;
  defaultValue: string;
  errors?: string[];
  placeholder: string;
}) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="block text-xs font-medium text-zinc-700">
        Reason
      </label>
      <textarea
        id={id}
        name="reason"
        rows={3}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={Boolean(errors?.length)}
        aria-describedby={describedBy(id, errors)}
        className={inputClasses}
      />
      <FieldError id={id} errors={errors} />
    </div>
  );
}

function MoveLotForm({
  lot,
  storageUnits,
}: {
  lot: LotSnapshot;
  storageUnits: StorageUnitOption[];
}) {
  const [state, formAction, pending] = useActionState<MoveLotFormState, FormData>(
    moveSpecimenLotAction.bind(null, lot),
    { values: emptyMoveLotValues(lot.quantity) },
  );
  const destinations = storageUnits.filter((unit) => unit.id !== lot.storageUnitId);

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-sm leading-6 text-zinc-600">
        Move all or part of this lot to another storage location. The specimen total does not
        change. Moving into a location that already holds this condition merges into that lot.
      </p>
      {destinations.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          No other active storage location can hold specimens.
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="move-target" className="block text-xs font-medium text-zinc-700">
            Destination storage location <span aria-hidden="true">*</span>
          </label>
          <select
            id="move-target"
            name="targetStorageUnitId"
            required
            disabled={destinations.length === 0}
            defaultValue={state.values.targetStorageUnitId}
            aria-invalid={Boolean(state.errors?.targetStorageUnitId?.length)}
            aria-describedby={describedBy("move-target", state.errors?.targetStorageUnitId)}
            className={inputClasses}
          >
            <option value="">Select a destination</option>
            {destinations.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
          <FieldError id="move-target" errors={state.errors?.targetStorageUnitId} />
        </div>
        <QuantityField
          id="move-quantity"
          label="Quantity to move"
          max={lot.quantity}
          defaultValue={state.values.quantity}
          errors={state.errors?.quantity}
          hint={`Up to ${lot.quantity}. Moving all of it empties this lot.`}
        />
        <OptionalReasonField
          id="move-reason"
          defaultValue={state.values.reason}
          errors={state.errors?.reason}
          placeholder="Optional context, e.g. drawer reorganization"
        />
      </div>
      <FormMessage message={state.message} />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || destinations.length === 0}
          className={submitClasses}
        >
          Move specimens
        </button>
        <PendingOverlay pending={pending} label="Moving specimens…" />
      </div>
    </form>
  );
}

function ChangeConditionForm({ lot }: { lot: LotSnapshot }) {
  const [state, formAction, pending] = useActionState<ChangeConditionFormState, FormData>(
    changeSpecimenLotConditionAction.bind(null, lot),
    { values: emptyChangeConditionValues(lot.quantity) },
  );

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-sm leading-6 text-zinc-600">
        Reclassify all or part of this lot. The specimens stay in the same location and the total
        does not change. Current condition: <span className="font-medium">{lot.conditionClass}</span>.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="condition-target" className="block text-xs font-medium text-zinc-700">
            New condition <span aria-hidden="true">*</span>
          </label>
          <input
            id="condition-target"
            name="targetConditionClass"
            type="text"
            required
            defaultValue={state.values.targetConditionClass}
            placeholder="Enter the curator-confirmed condition"
            aria-invalid={Boolean(state.errors?.targetConditionClass?.length)}
            aria-describedby={describedBy(
              "condition-target",
              state.errors?.targetConditionClass,
            )}
            className={inputClasses}
          />
          <FieldError id="condition-target" errors={state.errors?.targetConditionClass} />
        </div>
        <QuantityField
          id="condition-quantity"
          label="Quantity affected"
          max={lot.quantity}
          defaultValue={state.values.quantity}
          errors={state.errors?.quantity}
          hint={`Up to ${lot.quantity}.`}
        />
        <OptionalReasonField
          id="condition-reason"
          defaultValue={state.values.reason}
          errors={state.errors?.reason}
          placeholder="Optional context, e.g. inspection findings"
        />
      </div>
      <FormMessage message={state.message} />
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={submitClasses}>
          Change condition
        </button>
        <PendingOverlay pending={pending} label="Changing condition…" />
      </div>
    </form>
  );
}

function AdjustQuantityForm({ lot }: { lot: LotSnapshot }) {
  const [state, formAction, pending] = useActionState<AdjustQuantityFormState, FormData>(
    adjustSpecimenLotQuantityAction.bind(null, lot),
    { values: EMPTY_ADJUST_QUANTITY_VALUES },
  );
  const [type, setType] = useState(state.values.adjustmentType);
  const direction = type ? adjustmentDirection(type as QuantityAdjustmentType) : null;

  // Submitted from the confirm dialog, where native validation bubbles would be hidden behind
  // the modal; the action validates and returns field errors instead.
  return (
    <form action={formAction} noValidate className="space-y-5">
      <p className="text-sm leading-6 text-zinc-600">
        Record an authorized change to the physical count of this lot (current quantity{" "}
        <span className="font-medium">{lot.quantity}</span>). Use Move for internal relocation;
        Transfer out means specimens leave the museum collection.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="adjust-type" className="block text-xs font-medium text-zinc-700">
            Adjustment type <span aria-hidden="true">*</span>
          </label>
          <select
            id="adjust-type"
            name="adjustmentType"
            required
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-invalid={Boolean(state.errors?.adjustmentType?.length)}
            aria-describedby={describedBy("adjust-type", state.errors?.adjustmentType)}
            className={inputClasses}
          >
            <option value="">Select an adjustment type</option>
            {ADJUSTMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {direction && direction !== "either" && (
            <p className="mt-1 text-xs text-zinc-500">
              {direction === "increase" ? "Adds to" : "Removes from"} this lot.
            </p>
          )}
          <FieldError id="adjust-type" errors={state.errors?.adjustmentType} />
        </div>

        {direction === "either" && (
          <fieldset>
            <legend className="block text-xs font-medium text-zinc-700">
              Correction direction <span aria-hidden="true">*</span>
            </legend>
            <div className="mt-2.5 flex gap-4 text-sm text-zinc-800">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="direction"
                  value="increase"
                  defaultChecked={state.values.direction === "increase"}
                />
                Increase
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="direction"
                  value="decrease"
                  defaultChecked={state.values.direction !== "increase"}
                />
                Decrease
              </label>
            </div>
          </fieldset>
        )}

        <QuantityField
          id="adjust-quantity"
          label="Quantity"
          max={direction === "decrease" ? lot.quantity : undefined}
          defaultValue={state.values.quantity}
          errors={state.errors?.quantity}
          hint={
            direction === "decrease"
              ? `Up to ${lot.quantity}. Removing all of it marks this lot inactive.`
              : undefined
          }
        />

        <div className="sm:col-span-2">
          <label htmlFor="adjust-reason" className="block text-xs font-medium text-zinc-700">
            Reason <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="adjust-reason"
            name="reason"
            rows={3}
            required
            maxLength={ADJUSTMENT_REASON_MAX}
            defaultValue={state.values.reason}
            placeholder="Required. Recorded in the transaction and revision history."
            aria-invalid={Boolean(state.errors?.reason?.length)}
            aria-describedby={describedBy("adjust-reason", state.errors?.reason)}
            className={inputClasses}
          />
          <FieldError id="adjust-reason" errors={state.errors?.reason} />
        </div>
      </div>
      <FormMessage message={state.message} />
      <div className="flex justify-end">
        <ConfirmButton
          label="Record adjustment"
          question="Record this quantity adjustment?"
          detail="Quantity adjustments change the specimen total and are kept permanently in the lot history."
          confirmLabel="Yes, record it"
          pending={pending}
          pendingLabel="Recording adjustment…"
          className={submitClasses}
        />
      </div>
    </form>
  );
}

function LotNotesForm({ lot }: { lot: LotSnapshot }) {
  const [state, formAction, pending] = useActionState<LotNotesFormState, FormData>(
    updateSpecimenLotNotesAction.bind(null, lot),
    { values: { storageNotes: lot.storageNotes ?? "" } },
  );

  return (
    <form action={formAction} className="space-y-5">
      <p className="text-sm leading-6 text-zinc-600">
        Placement or handling notes for this lot. Clearing the field removes the notes.
      </p>
      <div>
        <label htmlFor="lot-notes" className="block text-xs font-medium text-zinc-700">
          Storage notes
        </label>
        <textarea
          id="lot-notes"
          name="storageNotes"
          rows={4}
          defaultValue={state.values.storageNotes}
          placeholder="Optional placement or handling notes"
          aria-invalid={Boolean(state.errors?.storageNotes?.length)}
          aria-describedby={describedBy("lot-notes", state.errors?.storageNotes)}
          className={inputClasses}
        />
        <FieldError id="lot-notes" errors={state.errors?.storageNotes} />
      </div>
      <FormMessage message={state.message} />
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={submitClasses}>
          Save notes
        </button>
        <PendingOverlay pending={pending} label="Saving storage notes…" />
      </div>
    </form>
  );
}

export function SpecimenLotOperations({
  lot,
  storageUnits,
}: {
  lot: LotSnapshot;
  /** Null when storage locations could not be loaded; moves are then unavailable. */
  storageUnits: StorageUnitOption[] | null;
}) {
  const [tab, setTab] = useState<Tab>("move");

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <h2 className="text-base font-semibold text-zinc-900">Inventory actions</h2>
      <div
        role="tablist"
        aria-label="Lot inventory actions"
        className="mt-4 flex flex-wrap gap-1.5 border-b border-black/5 pb-3"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`lot-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`lot-panel-${item.id}`}
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? "rounded-lg bg-forest-700 px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-sage-100"
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`lot-panel-${tab}`}
        aria-labelledby={`lot-tab-${tab}`}
        className="pt-4"
      >
        {tab === "move" &&
          (storageUnits ? (
            <MoveLotForm lot={lot} storageUnits={storageUnits} />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Storage locations could not be loaded, so this lot cannot be moved right now. Reload
              to try again.
            </div>
          ))}
        {tab === "condition" && <ChangeConditionForm lot={lot} />}
        {tab === "adjust" && <AdjustQuantityForm lot={lot} />}
        {tab === "notes" && <LotNotesForm lot={lot} />}
      </div>
    </section>
  );
}
