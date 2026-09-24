/** Curator forms for storage-unit creation, metadata updates, moves, and archival. */

"use client";

import { useActionState } from "react";
import {
  archiveStorageLocationAction,
  createStorageLocationAction,
  moveStorageLocationAction,
  updateStorageLocationAction,
} from "@/features/storage-locations/actions";
import { storageDescendantIds } from "@/features/storage-locations/hierarchy";
import type {
  StorageLocationCommandState,
  StorageLocationFormState,
  StorageLocationFormValues,
  StorageLocationMoveState,
} from "@/features/storage-locations/management";
import type { StorageUnit } from "@/features/storage-locations/types";

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
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Location label" name="label" defaultValue={values.label} required />
      <Field label="Unit type" name="unitType" defaultValue={values.unitType} required />
      <Field label="Storage type" name="storageType" defaultValue={values.storageType} required />
      <Field label="Size (optional)" name="size" defaultValue={values.size} />
      <Field label="Capacity (optional)" name="capacity" defaultValue={values.capacity} type="number" min="1" />
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
  required = false,
  type = "text",
  min,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  type?: "text" | "number";
  min?: string;
}) {
  return (
    <label className="text-xs font-medium text-zinc-700">
      {label}
      <input
        name={name}
        type={type}
        min={min}
        step={type === "number" ? "1" : undefined}
        defaultValue={defaultValue}
        required={required}
        className={`${inputClasses} mt-1`}
      />
    </label>
  );
}

function CreateStorageLocationForm({ units, parentId }: { units: StorageUnit[]; parentId: string }) {
  const activeParents = units.filter((unit) => !unit.archivedAt);
  const [state, action, pending] = useActionState<StorageLocationFormState, FormData>(
    createStorageLocationAction,
    { values: emptyValues(parentId) },
  );

  return (
    <details className="rounded-xl border border-black/10 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-forest-800">Add storage location</summary>
      <form action={action} className="mt-4">
        <p className="mb-3 text-xs text-zinc-500">
          Unit and storage types remain curator-managed text; no fixed type hierarchy is imposed here.
        </p>
        <StorageFields values={state.values} parents={activeParents} includeParent />
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create location"}
        </button>
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
    <details className="rounded-xl border border-black/10 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-forest-800">Edit selected location</summary>
      <form action={formAction} className="mt-4">
        <StorageFields values={state.values} parents={[]} includeParent={false} />
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
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
    <details className="rounded-xl border border-black/10 bg-white p-4">
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
          {pending ? "Moving..." : "Move location"}
        </button>
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
      <form
        action={formAction}
        className="mt-3"
        onSubmit={(event) => {
          if (!window.confirm(`Archive ${unit.label}? This preserves its history but cannot currently be undone.`)) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Archiving..." : "Archive location"}
        </button>
      </form>
      <FormMessage message={state.message} />
    </div>
  );
}

export function StorageLocationManagement({
  selected,
  units,
}: {
  selected?: StorageUnit;
  units: StorageUnit[];
}) {
  const defaultParentId = selected && !selected.archivedAt ? selected.id : "";

  return (
    <section className="space-y-3" aria-labelledby="storage-management-heading">
      <div>
        <h2 id="storage-management-heading" className="font-serif text-lg font-semibold text-forest-800">
          Manage storage locations
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Changes are validated, audited, and applied by the protected backend.
        </p>
      </div>
      <CreateStorageLocationForm units={units} parentId={defaultParentId} />
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
