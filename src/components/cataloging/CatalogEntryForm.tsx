"use client";

import { useState } from "react";
import { Field, fieldClasses } from "@/components/ui/Field";
import { TextField } from "@/components/ui/TextField";
import {
  ArchiveIcon,
  QrCodeIcon,
  DotsIcon,
  UploadIcon,
} from "@/components/icons";
import type { CatalogEntryDetail } from "@/lib/dummy-data/cataloging";
import { ManageSpecimenGroupTab } from "./ManageSpecimenGroupTab";

const TABS = ["Basic Info", "Taxonomy", "Storage & Media", "Manage Specimen Group"] as const;
type Tab = (typeof TABS)[number];

function BasicInfoTab({ entry }: { entry: CatalogEntryDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="accessionNo" label="Accession No. *" defaultValue={entry.accessionNo} />
        <TextField id="collectionName" label="Collection Name *" defaultValue={entry.collectionName} />
        <TextField id="commonName" label="Common Name *" defaultValue={entry.commonName} />
        <TextField id="scientificName" label="Scientific Name *" defaultValue={entry.scientificName} />
        <TextField id="specimenCategory" label="Specimen Category *" defaultValue={entry.specimenCategory} />
        <TextField id="gender" label="Gender *" defaultValue={entry.gender} />
        <TextField id="quantity" label="Quantity *" defaultValue={entry.quantity} />
        <TextField id="conditionClass" label="Condition *" defaultValue={entry.conditionClass} />
        <TextField id="collector" label="Collector" defaultValue={entry.collector} />
        <TextField id="donor" label="Donor" defaultValue={entry.donor} />
        <TextField id="collectionDate" label="Collection Date" type="date" defaultValue={entry.collectionDate} />
        <TextField id="collectionLocation" label="Collection Location" defaultValue={entry.collectionLocation} />
        <TextField id="preservationMethod" label="Preservation Method" defaultValue={entry.preservationMethod} />
        <TextField id="preservationType" label="Preservation Type" defaultValue={entry.preservationType} />
      </div>
      <Field label="Remarks" htmlFor="remarks">
        <textarea
          id="remarks"
          name="remarks"
          rows={3}
          defaultValue={entry.remarks}
          className={`${fieldClasses} resize-none`}
        />
      </Field>
    </div>
  );
}

function TaxonomyTab({ entry }: { entry: CatalogEntryDetail }) {
  const t = entry.taxonomy;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="kingdom" label="Kingdom" defaultValue={t.kingdom} />
        <TextField id="phylum" label="Phylum" defaultValue={t.phylum} />
        <TextField id="class" label="Class" defaultValue={t.class} />
        <TextField id="order" label="Order" defaultValue={t.order} />
        <TextField id="family" label="Family" defaultValue={t.family} />
        <TextField id="genus" label="Genus" defaultValue={t.genus} />
        <TextField id="species" label="Species" defaultValue={t.species} />
        <TextField id="conservationStatus" label="Conservation Status" defaultValue={t.conservationStatus} />
        <TextField id="habitat" label="Habitat" defaultValue={t.habitat} />
        <TextField id="ecologicalRole" label="Ecological Role" defaultValue={t.ecologicalRole} />
      </div>
      <Field label="Tag" htmlFor="tag">
        <div className="mt-1.5 flex gap-2">
          <input
            id="tag"
            name="tag"
            placeholder="eg. land"
            className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
          <button
            type="button"
            className="shrink-0 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Add Tag
          </button>
        </div>
      </Field>
      <div className="flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-forest-800"
          >
            {tag} <span className="ml-1 cursor-pointer text-forest-500">&times;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StorageMediaTab({ entry }: { entry: CatalogEntryDetail }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Storage Unit" htmlFor="storageUnit">
          <select id="storageUnit" name="storageUnit" defaultValue={entry.storageUnit} className={fieldClasses}>
            <option>Drawer 01</option>
            <option>Drawer 02</option>
            <option>Drawer 03</option>
            <option>Drawer 04</option>
          </select>
        </Field>

        <div>
          <p className="text-xs font-medium text-zinc-700">Storage Overview</p>
          <div className="mt-1.5 flex min-h-[120px] items-center justify-center rounded-lg border border-black/15 p-3 text-center text-xs text-zinc-400">
            Storage map preview will appear here.
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-zinc-700">Add Specimen Photos</p>
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-dashed border-black/20 px-3.5 py-3 text-xs text-zinc-500">
          <UploadIcon className="h-4 w-4 shrink-0" />
          <span>Drag photos here, or click Add Photo to upload</span>
          <button
            type="button"
            className="ml-auto shrink-0 rounded-lg bg-forest-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-forest-800"
          >
            Add Photo
          </button>
        </div>
      </div>
    </div>
  );
}

export function CatalogEntryForm({ entry }: { entry: CatalogEntryDetail }) {
  const [tab, setTab] = useState<Tab>("Basic Info");

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-black/10 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/10 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">Catalog Entry</h3>
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Unsaved changes
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-forest-700 px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50"
          >
            <ArchiveIcon className="h-3.5 w-3.5" />
            Save Draft
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-forest-700 px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50"
          >
            <QrCodeIcon className="h-3.5 w-3.5" />
            Generate QR
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-800"
          >
            Mark as Cataloged
          </button>
          <button type="button" aria-label="More options" className="text-zinc-400 hover:text-zinc-600">
            <DotsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto border-b border-black/10 px-5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 py-3 text-sm font-medium whitespace-nowrap ${
              tab === t ? "border-forest-700 text-forest-800" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {tab === "Basic Info" && <BasicInfoTab entry={entry} />}
        {tab === "Taxonomy" && <TaxonomyTab entry={entry} />}
        {tab === "Storage & Media" && <StorageMediaTab entry={entry} />}
        {tab === "Manage Specimen Group" && <ManageSpecimenGroupTab entry={entry} />}
      </div>
    </div>
  );
}
