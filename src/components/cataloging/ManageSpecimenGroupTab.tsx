"use client";

import { useState } from "react";
import { fieldClasses } from "@/components/ui/Field";
import { ArchiveIcon, CubeIcon, CheckIcon } from "@/components/icons";
import {
  SPECIMEN_GROUP_MEMBERS,
  CONDITION_CLASS_OPTIONS,
  STORAGE_TREE,
  type CatalogEntryDetail,
} from "@/lib/dummy-data/cataloging";

type Mode = "Change Location" | "Change Condition";

export function ManageSpecimenGroupTab({ entry }: { entry: CatalogEntryDetail }) {
  const [mode, setMode] = useState<Mode>("Change Condition");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sage-50 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Accession No.</p>
          <p className="text-sm font-medium text-zinc-900">
            {entry.accessionNo} &middot; {entry.commonName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Specimens in Group</p>
          <p className="text-sm font-semibold text-forest-800">{entry.groupSize}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-sage-50 p-1">
        {(["Change Location", "Change Condition"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-forest-700 text-white" : "text-zinc-600 hover:text-forest-800"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "Change Condition" ? (
        <div className="space-y-4">
          <p className="text-xs font-medium text-zinc-700">Apply to</p>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-black/10 p-2">
            {SPECIMEN_GROUP_MEMBERS.map((member) => (
              <div key={member.code} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-sage-50">
                <input type="checkbox" className="h-4 w-4 rounded border-black/20 accent-forest-700" />
                <span className="flex-1 text-sm text-zinc-800">{member.code}</span>
                <span className="rounded-full bg-forest-700 px-3 py-1 text-xs font-medium text-white">
                  {member.currentClass}
                </span>
                <select
                  defaultValue="No Change"
                  className="rounded-lg border border-black/15 px-2.5 py-1.5 text-xs text-zinc-700 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
                >
                  {CONDITION_CLASS_OPTIONS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Select a new class for each specimen you&rsquo;re re-assessing. Unselected specimens keep their current
            class.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-medium text-zinc-700">Move to Storage Unit</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-700" htmlFor="newStorageUnit">
                New Storage Unit
              </label>
              <select id="newStorageUnit" defaultValue={STORAGE_TREE.target} className={fieldClasses}>
                <option>{STORAGE_TREE.target}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700" htmlFor="currentLocation">
                Current Location
              </label>
              <input
                id="currentLocation"
                readOnly
                value={STORAGE_TREE.current}
                className={`${fieldClasses} bg-zinc-50 text-zinc-500`}
              />
            </div>
          </div>

          <div className="rounded-lg border border-black/15 p-3">
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-1.5 font-medium text-zinc-700">
                <ArchiveIcon className="h-4 w-4" /> Cabinet A
              </li>
              <li className="ml-5 flex items-center justify-between rounded-md bg-forest-50 px-2 py-1 font-medium text-forest-700 ring-1 ring-forest-200">
                <span className="flex items-center gap-1.5">
                  <CubeIcon className="h-4 w-4" /> Drawer 01
                </span>
                <span className="rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Current
                </span>
              </li>
              <li className="ml-5 flex items-center gap-1.5 font-medium text-zinc-700">
                <ArchiveIcon className="h-4 w-4" /> Main Gallery
              </li>
              <li className="ml-10 flex items-center gap-1.5 font-medium text-zinc-700">
                <CubeIcon className="h-4 w-4" /> CAB-001
              </li>
              <li className="ml-14 flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
                <CheckIcon className="h-3.5 w-3.5" /> Drawer 01
              </li>
            </ul>
          </div>

          <p className="text-xs text-zinc-500">
            Note: All checked specimens will be reassigned to the new storage unit. This does not affect their
            condition or taxonomy records.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-zinc-700" htmlFor="reasonOfChange">
          Reason of Change (optional)
        </label>
        <input
          id="reasonOfChange"
          placeholder="e.g. Relocated during cabinet reorganization, or re-assessed after cleaning"
          className={fieldClasses}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-black/10 pt-4">
        <button
          type="button"
          className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
        >
          Cancel
        </button>
        <button
          type="button"
          className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
}
