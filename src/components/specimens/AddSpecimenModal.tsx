"use client";

import { useState } from "react";
import { Field, fieldClasses } from "@/components/ui/Field";
import { TextField } from "@/components/ui/TextField";
import { LizardIcon, CloseIcon, ArchiveIcon, QrCodeIcon, CubeIcon, CheckIcon, UploadIcon, MapPinIcon } from "@/components/icons";

const TABS = ["Basic Info", "Taxonomy", "Storage & Media"] as const;
type Tab = (typeof TABS)[number];

function BasicInfoTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="accessionNo" label="Accession No. *" placeholder="USCBM-HERP-2025-001" />
        <TextField id="collectionName" label="Collection Name *" placeholder="eg. Herpetology" />
        <TextField id="commonName" label="Common Name *" placeholder="eg. Ball Python" />
        <TextField id="scientificName" label="Scientific Name *" placeholder="eg. Python regius" />
        <TextField id="specimenCategory" label="Specimen Category *" placeholder="eg. Snakes" />
        <TextField id="gender" label="Gender *" placeholder="eg. Male" />
        <TextField id="quantity" label="Quantity *" placeholder="eg. 10" />
        <TextField id="conditionClass" label="Condition *" placeholder="eg. Class A" />
        <TextField id="collector" label="Collector" placeholder="eg. John Doe" />
        <TextField id="donor" label="Donor" placeholder="eg. Jane Doe" />
        <TextField id="collectionDate" label="Collection Date" type="date" />
        <TextField id="collectionLocation" label="Collection Location" placeholder="eg. University of San Carlos" />
        <TextField id="preservationMethod" label="Preservation Method" placeholder="eg. Alcohol (70%)" />
        <TextField id="preservationType" label="Preservation Type" placeholder="eg. Wet Preserved" />
      </div>
      <Field label="Remarks" htmlFor="remarks">
        <textarea
          id="remarks"
          name="remarks"
          rows={3}
          placeholder="Add remarks here"
          className={`${fieldClasses} resize-none`}
        />
      </Field>
    </div>
  );
}

function TaxonomyTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="kingdom" label="Kingdom" placeholder="eg. Animalia" />
        <TextField id="phylum" label="Phylum" placeholder="eg. Chordata" />
        <TextField id="class" label="Class" placeholder="eg. Reptilia" />
        <TextField id="order" label="Order" placeholder="eg. Squamata" />
        <TextField id="family" label="Family" placeholder="eg. Pythonidae" />
        <TextField id="genus" label="Genus" placeholder="eg. Python" />
        <TextField id="species" label="Species" placeholder="eg. regius" />
        <TextField id="conservationStatus" label="Conservation Status" placeholder="eg. Least Concern" />
        <TextField id="habitat" label="Habitat" placeholder="eg. Grassland" />
        <TextField id="ecologicalRole" label="Ecological Role" placeholder="eg. Mesopredator" />
      </div>
      <Field label="Tag" htmlFor="tag">
        <div className="mt-1.5 flex gap-2">
          <input id="tag" name="tag" placeholder="eg. land" className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700" />
          <button
            type="button"
            className="shrink-0 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Add Tag
          </button>
        </div>
      </Field>
    </div>
  );
}

function StorageMediaTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Storage Unit" htmlFor="storageUnit">
          <select id="storageUnit" name="storageUnit" defaultValue="Drawer 01" className={fieldClasses}>
            <option>Drawer 01</option>
            <option>Drawer 02</option>
            <option>Drawer 03</option>
            <option>Drawer 04</option>
          </select>
        </Field>

        <div>
          <p className="text-xs font-medium text-zinc-700">Storage Overview</p>
          <div className="mt-1.5 rounded-lg border border-black/15 p-3">
            <div className="mb-3 flex items-start gap-2 rounded-md bg-sage-50 px-2.5 py-2 text-xs">
              <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-700" />
              <div>
                <p className="font-semibold uppercase tracking-wide text-zinc-500">Current Location</p>
                <p className="text-zinc-800">Storage Room &rsaquo; Cabinet A &rsaquo; Drawer 01</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-1.5 font-medium text-zinc-700">
                <ArchiveIcon className="h-4 w-4" /> Storage Room
              </li>
              <li className="ml-5 flex items-center gap-1.5 font-medium text-zinc-700">
                <CubeIcon className="h-4 w-4" /> Cabinet A
              </li>
              <li className="ml-10 flex items-center gap-1.5 rounded-md bg-forest-50 px-2 py-1 font-medium text-forest-700 ring-1 ring-forest-200">
                <CheckIcon className="h-3.5 w-3.5" /> Drawer 01
              </li>
              <li className="ml-10 text-zinc-500">Drawer 02</li>
              <li className="ml-10 text-zinc-500">Drawer 03</li>
              <li className="ml-10 text-zinc-500">Drawer 04</li>
              <li className="ml-5 flex items-center gap-1.5 text-zinc-500">
                <CubeIcon className="h-4 w-4" /> Cabinet B
              </li>
              <li className="ml-5 flex items-center gap-1.5 text-zinc-500">
                <CubeIcon className="h-4 w-4" /> Cabinet C
              </li>
            </ul>
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
        <div className="mt-3 grid grid-cols-4 gap-3">
          {["python-001", "python-002", "python-003", "python-004"].map((name) => (
            <div
              key={name}
              className="flex aspect-square items-center justify-center rounded-lg bg-sage-100 text-forest-700"
            >
              <LizardIcon className="h-6 w-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddSpecimenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("Basic Info");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:items-center">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-black/10 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-900">Add Specimen</h2>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-forest-700 px-3.5 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50"
            >
              <ArchiveIcon className="h-3.5 w-3.5" />
              Save Draft
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-forest-700 px-3.5 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50"
            >
              <QrCodeIcon className="h-3.5 w-3.5" />
              Generate QR
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-forest-800"
            >
              Add Specimen
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-zinc-400 hover:text-zinc-600"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto border-b border-black/10 px-6">
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

        <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
          {tab === "Basic Info" && <BasicInfoTab />}
          {tab === "Taxonomy" && <TaxonomyTab />}
          {tab === "Storage & Media" && <StorageMediaTab />}
        </div>
      </div>
    </div>
  );
}
