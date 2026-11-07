/** Curator forms for storage-unit creation, metadata updates, moves, and archival. */

"use client";

import { useActionState, useId } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import {
  archiveStorageLocationAction,
  createStorageLocationAction,
  moveStorageLocationAction,
  updateStorageLocationAction,
} from "@/features/storage-locations/actions";
import {
  STORAGE_ARRANGEMENT_HINT,
  STORAGE_TYPE_SUGGESTIONS,
  STORAGE_UNIT_TYPE_SUGGESTIONS,
} from "@/features/storage-locations/arrangement";
import { storageDescendantIds } from "@/features/storage-locations/hierarchy";
import type {
  StorageLocationCommandState,
  StorageLocationFormState,
  StorageLocationFormValues,
  StorageLocationMoveState,
} from "@/features/storage-locations/management";
import type { StorageUnit } from "@/features/storage-locations/types";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";

/** Lets the Add location button beside the hierarchy reach this form. */
export const ADD_LOCATION_FORM_ID = "add-storage-location";

const inputClasses =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

function emptyValues(parentId = ""): StorageLocationFormValues {
  return {
    label: "",
    unitType: "",
    storageType: "",
    size: "",
    parentId,
    holdsSpecimens: false,
    capacity: "",
  };
}

function valuesFromUnit(unit: StorageUnit): StorageLocationFormValues {
  return {
    label: unit.label,
    unitType: unit.unitType,
    storageType: unit.storageType,
    size: unit.size ?? "",
    parentId: unit.parentId ?? "",
    holdsSpecimens: unit.holdsSpecimens,
    capacity: unit.capacity === null ? "" : String(unit.capacity),
  };
}

function FormMessage({ message }: { message?: string }) {
  return message ? <p role="alert" className="mt-3 text-xs font-medium text-red-700">{message}</p> : null;
}

function StorageFields({
  values,
  parents,
  includeParent,
}: {
  values: StorageLocationFormValues;
  parents: StorageUnit[];
  includeParent: boolean;
}) {
  // Create and edit forms can be on the page together, so each needs its own list id.
  const unitTypeListId = useId();
  const storageTypeListId = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Location label" name="label" defaultValue={values.label} placeholder="e.g. Cabinet A" required />
      <Field
        label="Unit type"
        name="unitType"
        defaultValue={values.unitType}
        placeholder="e.g. Cabinet"
        required
        list={unitTypeListId}
      />
      <datalist id={unitTypeListId}>
        {STORAGE_UNIT_TYPE_SUGGESTIONS.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <Field
        label="Storage type"
        name="storageType"
        defaultValue={values.storageType}
        placeholder="e.g. Dry storage"
        required
        list={storageTypeListId}
      />
      <datalist id={storageTypeListId}>
        {STORAGE_TYPE_SUGGESTIONS.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <Field label="Size (optional)" name="size" defaultValue={values.size} placeholder="e.g. Large" />
      <Field
        label="Capacity (optional)"
        name="capacity"
        defaultValue={values.capacity}
        placeholder="e.g. 50"
        type="number"
        min="1"
      />
      {includeParent && (
        <label className="text-xs font-medium text-zinc-700">
          Parent location
          <select name="parentId" defaultValue={values.parentId} className={`${inputClasses} mt-1`}>
            <option value="">Top level (no parent)</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.label} — {parent.unitType}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2">
        <input
          type="checkbox"
          name="holdsSpecimens"
          defaultChecked={values.holdsSpecimens}
          className="h-4 w-4 rounded border-zinc-300 text-forest-700 focus:ring-forest-700"
        />
        This unit may directly hold specimen lots
      </label>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required = false,
  type = "text",
  min,
  list,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "number";
  min?: string;
  list?: string;
}) {
  return (
    <label className="text-xs font-medium text-zinc-700">
      {label}
      <input
        name={name}
        type={type}
        min={min}
        list={list}
        step={type === "number" ? "1" : undefined}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={`${inputClasses} mt-1`}
      />
    </label>
  );
}

function CreateStorageLocationForm({
  units,
  parentId,
  open,
  onOpenChange,
}: {
  units: StorageUnit[];
  parentId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const activeParents = units.filter((unit) => !unit.archivedAt);
  const [state, action, pending] = useActionState<StorageLocationFormState, FormData>(
    createStorageLocationAction,
    { values: emptyValues(parentId) },
  );

  return (
    <details
      id={ADD_LOCATION_FORM_ID}
      open={open}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      className="scroll-mt-20 rounded-xl border border-black/10 bg-white p-5"
    >
      <summary className="cursor-pointer text-sm font-semibold text-forest-800">Add storage location</summary>
      <form action={action} className="mt-4">
        <p className="mb-3 text-xs text-zinc-500">
          {STORAGE_ARRANGEMENT_HINT} Capacity is optional; actual quantities are tracked from specimen lots either way.
        </p>
        <StorageFields values={state.values} parents={activeParents} includeParent />
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create location
        </button>
        <PendingOverlay pending={pending} label="Creating location…" />
        <FormMessage message={state.message} />
      </form>
    </details>
  );
}

function UpdateStorageLocationForm({ unit }: { unit: StorageUnit }) {
  const action = updateStorageLocationAction.bind(null, unit.id);
  const [state, formAction, pending] = useActionState<StorageLocationFormState, FormData>(
    action,
    { values: valuesFromUnit(unit) },
  );

  return (
    <details className="rounded-xl border border-black/10 bg-white p-5">
      <summary className="cursor-pointer text-sm font-semibold text-forest-800">Edit selected location</summary>
      <form action={formAction} className="mt-4">
        <StorageFields values={state.values} parents={[]} includeParent={false} />
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save changes
        </button>
        <PendingOverlay pending={pending} label="Saving location…" />
        <FormMessage message={state.message} />
      </form>
    </details>
  );
}

function MoveStorageLocationForm({ unit, units }: { unit: StorageUnit; units: StorageUnit[] }) {
  const descendants = storageDescendantIds(units, unit.id);
  const parents = units.filter(
    (candidate) =>
      !candidate.archivedAt &&
      candidate.id !== unit.id &&
      candidate.id !== unit.parentId &&
      !descendants.has(candidate.id),
  );
  const action = moveStorageLocationAction.bind(null, unit.id);
  const [state, formAction, pending] = useActionState<StorageLocationMoveState, FormData>(
    action,
    { values: { newParentId: "", reason: "" } },
  );

  return (
    <details className="rounded-xl border border-black/10 bg-white p-5">
      <summary className="cursor-pointer text-sm font-semibold text-forest-800">Move selected location</summary>
      <form action={formAction} className="mt-4">
        <label className="text-xs font-medium text-zinc-700">
          New parent
          <select name="newParentId" defaultValue={state.values.newParentId} className={`${inputClasses} mt-1`}>
            <option value="">Top level (no parent)</option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.label} — {parent.unitType}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-xs font-medium text-zinc-700">
          Movement reason (optional)
          <textarea
            name="reason"
            defaultValue={state.values.reason}
            rows={3}
            className={`${inputClasses} mt-1 resize-y`}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg border border-forest-700 px-4 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Move location
        </button>
        <PendingOverlay pending={pending} label="Moving location…" />
        <FormMessage message={state.message} />
      </form>
    </details>
  );
}

function ArchiveStorageLocationForm({ unit }: { unit: StorageUnit }) {
  const action = archiveStorageLocationAction.bind(null, unit.id);
  const [state, formAction, pending] = useActionState<StorageLocationCommandState, FormData>(action, {});

  return (
    <div className="rounded-xl border border-red-100 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-900">Archive selected location</p>
      <p className="mt-1 text-xs text-zinc-600">
        Active children and specimen lots must be resolved first. There is currently no restore action.
      </p>
      <form action={formAction} className="mt-3">
        <ConfirmButton
          label="Archive location"
          confirmLabel="Yes, archive"
          question={`Archive ${unit.label}?`}
          detail="History is preserved, but this cannot currently be undone."
          tone="danger"
          pending={pending}
          pendingLabel="Archiving location…"
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </form>
      <FormMessage message={state.message} />
    </div>
  );
}

export function StorageLocationManagement({
  selected,
  units,
  addOpen,
  onAddOpenChange,
}: {
  selected?: StorageUnit;
  units: StorageUnit[];
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
}) {
  const defaultParentId = selected && !selected.archivedAt ? selected.id : "";

  return (
    <section className="space-y-3" aria-labelledby="storage-management-heading">
      <div>
        <h2 id="storage-management-heading" className="text-sm font-semibold text-zinc-900">
          Manage storage locations
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">Every change is recorded in the audit log.</p>
      </div>
      <CreateStorageLocationForm
        units={units}
        parentId={defaultParentId}
        open={addOpen}
        onOpenChange={onAddOpenChange}
      />
      {selected && !selected.archivedAt ? (
        <>
          <UpdateStorageLocationForm unit={selected} />
          <MoveStorageLocationForm unit={selected} units={units} />
          <ArchiveStorageLocationForm unit={selected} />
        </>
      ) : selected ? (
        <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-600">
          Archived locations are read-only.
        </div>
      ) : null}
    </section>
  );
}
