"use client";

import { useState } from "react";
import { Field, fieldClasses } from "@/components/ui/Field";
import { TextField } from "@/components/ui/TextField";
import {
  CloseIcon,
  SearchIcon,
  LayersIcon,
  InfoIcon,
  ImageIcon,
  CubeIcon,
  GridIcon,
  ListIcon,
  UploadIcon,
  GripIcon,
  StarIcon,
  TrashIcon,
  LockIcon,
} from "@/components/icons";
import { SPECIMENS, type Specimen } from "@/lib/dummy-data/specimens";
import type { PublicLayout } from "@/lib/dummy-data/exhibits";

const CATALOGED_SPECIMENS = SPECIMENS.filter((s) => s.catalogStatus === "Cataloged");

const TABS = ["Basic Info", "Taxonomy & Ecology", "Media", "AR Model"] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, typeof InfoIcon> = {
  "Basic Info": InfoIcon,
  "Taxonomy & Ecology": LayersIcon,
  Media: ImageIcon,
  "AR Model": CubeIcon,
};

function ShowBadge({ value }: { value: string }) {
  return value.trim() ? (
    <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[11px] font-medium text-forest-700">Will show</span>
  ) : (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">Hidden</span>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-zinc-700">{label}</label>
        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
          <LockIcon className="h-3 w-3" />
          From specimen
        </span>
      </div>
      <input
        readOnly
        value={value}
        className={`${fieldClasses} bg-sage-50 text-zinc-600`}
      />
    </div>
  );
}

function LayoutOption({
  active,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof GridIcon;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 rounded-lg border p-4 text-left transition-colors ${
        active ? "border-forest-700 bg-forest-50" : "border-black/15 hover:bg-sage-50"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Icon className="h-4 w-4 text-forest-700" />
        {title}
      </span>
      <span className="mt-1 block text-xs text-zinc-500">{description}</span>
      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-forest-700 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3 w-3">
            <path d="m5 13 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

function BasicInfoTab({
  specimen,
  description,
  setDescription,
  distribution,
  setDistribution,
  diet,
  setDiet,
  funFacts,
  setFunFacts,
}: {
  specimen: Specimen;
  description: string;
  setDescription: (v: string) => void;
  distribution: string;
  setDistribution: (v: string) => void;
  diet: string;
  setDiet: (v: string) => void;
  funFacts: string;
  setFunFacts: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LockedField label="Common Name" value={specimen.commonName} />
        <LockedField label="Scientific Name" value={specimen.scientificName} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-zinc-700">Tags</label>
          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
            <LockIcon className="h-3 w-3" />
            From specimen
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {specimen.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-forest-800">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-zinc-500 underline">Edit tags from Catalog Entry &rarr;</p>
      </div>

      <Field label="Public Description" htmlFor="description">
        <div className="mb-1 flex justify-end"><ShowBadge value={description} /></div>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What visitors will read about this specimen"
          className={`${fieldClasses} mt-0 resize-none`}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Distribution" htmlFor="distribution">
          <div className="mb-1 flex justify-end"><ShowBadge value={distribution} /></div>
          <input
            id="distribution"
            value={distribution}
            onChange={(e) => setDistribution(e.target.value)}
            placeholder="eg. Mindanao, Philippines"
            className={`${fieldClasses} mt-0`}
          />
        </Field>
        <Field label="Diet" htmlFor="diet">
          <div className="mb-1 flex justify-end"><ShowBadge value={diet} /></div>
          <input
            id="diet"
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            placeholder="eg. Sap, Fruits"
            className={`${fieldClasses} mt-0`}
          />
        </Field>
      </div>

      <Field label="Fun Facts" htmlFor="funFacts">
        <div className="mb-1 flex justify-end"><ShowBadge value={funFacts} /></div>
        <textarea
          id="funFacts"
          rows={2}
          value={funFacts}
          onChange={(e) => setFunFacts(e.target.value)}
          placeholder="Optional — shown as a 'Fun Facts' section on the public page"
          className={`${fieldClasses} mt-0 resize-none`}
        />
        <p className="mt-1.5 text-xs text-zinc-500">Leave blank to hide this section entirely.</p>
      </Field>
    </div>
  );
}

function TaxonomyEcologyTab({ specimen }: { specimen: Specimen }) {
  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 rounded-lg bg-sage-50 px-3.5 py-2.5 text-xs text-zinc-600">
        <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
        Inherited from the linked specimen&rsquo;s catalog record &mdash; edit in Catalog Entry, not here.
      </p>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Classification</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id="kingdom" label="Kingdom" placeholder="eg. Animalia" />
          <TextField id="phylum" label="Phylum" placeholder="eg. Arthropoda" />
          <TextField id="class" label="Class" placeholder="eg. Insecta" />
          <TextField id="order" label="Order" defaultValue={specimen.order} readOnly className="bg-sage-50 text-zinc-600" />
          <TextField id="family" label="Family" defaultValue={specimen.family} readOnly className="bg-sage-50 text-zinc-600" />
          <TextField id="genus" label="Genus" placeholder="eg. Titanus" />
        </div>
        <div className="mt-4">
          <TextField id="species" label="Species" placeholder="eg. giganteus" />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Habitat &amp; Ecology</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id="habitat" label="Habitat" placeholder="eg. Tropical rainforest" />
          <TextField id="ecologicalRole" label="Ecological Role" placeholder="eg. Ecosystem engineers" />
        </div>
        <div className="mt-4">
          <TextField id="conservationStatus" label="Conservation Status" placeholder="eg. Least Concern" />
        </div>
      </div>
    </div>
  );
}

function MediaTab() {
  const [photos, setPhotos] = useState(["beetle-front.jpg", "beetle-side.jpg"]);
  const [cover, setCover] = useState(0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Exhibit Photos</p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-sage-100"
        >
          <UploadIcon className="h-3.5 w-3.5" />
          Upload Image
        </button>
      </div>

      <div className="space-y-2">
        {photos.map((name, i) => (
          <div key={name} className="flex items-center gap-3 rounded-lg border border-black/10 px-3.5 py-2.5">
            <GripIcon className="h-4 w-4 shrink-0 cursor-grab text-zinc-300" />
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
              <ImageIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">{name}</span>
            {cover === i ? (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-medium text-gold-700">
                <StarIcon className="h-3 w-3" />
                Cover photo
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setCover(i)}
                className="shrink-0 text-[11px] font-medium text-zinc-500 hover:text-forest-700"
              >
                Set as cover
              </button>
            )}
            <button
              type="button"
              onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
              aria-label="Remove photo"
              className="shrink-0 text-zinc-400 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Drag to reorder. The cover photo appears first in the public carousel and as the thumbnail in exhibit lists.
      </p>
    </div>
  );
}

function ArModelTab({ arEnabled, setArEnabled }: { arEnabled: boolean; setArEnabled: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-black/10 p-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900">Enable AR Viewing</p>
        <p className="mt-1 text-xs text-zinc-500">Adds a &ldquo;View in AR&rdquo; button to the public exhibit page.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={arEnabled}
        onClick={() => setArEnabled(!arEnabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${arEnabled ? "bg-forest-700" : "bg-zinc-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            arEnabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function CreateExhibitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [accessionNo, setAccessionNo] = useState<string | null>(null);
  const [layout, setLayout] = useState<PublicLayout>("card-grid");
  const [tab, setTab] = useState<Tab>("Basic Info");
  const [description, setDescription] = useState("");
  const [distribution, setDistribution] = useState("");
  const [diet, setDiet] = useState("");
  const [funFacts, setFunFacts] = useState("");
  const [arEnabled, setArEnabled] = useState(false);

  if (!open) return null;

  const specimen = CATALOGED_SPECIMENS.find((s) => s.accessionNo === accessionNo) ?? null;
  const results =
    query.trim().length > 0
      ? CATALOGED_SPECIMENS.filter(
          (s) =>
            s.commonName.toLowerCase().includes(query.toLowerCase()) ||
            s.scientificName.toLowerCase().includes(query.toLowerCase()) ||
            s.accessionNo.toLowerCase().includes(query.toLowerCase()),
        )
      : CATALOGED_SPECIMENS;

  function reset() {
    setAccessionNo(null);
    setQuery("");
    setTab("Basic Info");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:items-center">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Create Exhibit</h2>
            <p className="text-xs text-zinc-500">Public-facing exhibit content</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-600">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Linked Specimen</p>
          {specimen ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-forest-50 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-forest-800">{specimen.commonName}</p>
                <p className="truncate text-xs italic text-forest-700/70">{specimen.scientificName}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs font-medium text-zinc-500">{specimen.accessionNo}</span>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs font-semibold text-forest-700 underline hover:text-forest-800"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by accession no., common name, or scientific name..."
                className="w-full rounded-lg border border-black/15 py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </div>
          )}
          {!specimen && (
            <>
              <p className="mt-1.5 text-xs text-zinc-500">
                Select a cataloged specimen to link this exhibit to. Name, taxonomy, and tags will be pulled in automatically.
              </p>
              {results.length > 0 && (
                <div className="mt-2 max-h-40 divide-y divide-black/5 overflow-y-auto rounded-lg border border-black/10">
                  {results.map((s) => (
                    <button
                      key={s.accessionNo}
                      type="button"
                      onClick={() => setAccessionNo(s.accessionNo)}
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-sage-50"
                    >
                      <span>
                        <span className="font-medium text-zinc-900">{s.commonName}</span>{" "}
                        <span className="italic text-zinc-500">{s.scientificName}</span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-400">{s.accessionNo}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Public Page Layout</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LayoutOption
              active={layout === "card-grid"}
              onClick={() => setLayout("card-grid")}
              icon={GridIcon}
              title="Card Grid"
              description="Hero image, description panel, split classification & ecology cards."
            />
            <LayoutOption
              active={layout === "mobile-accordion"}
              onClick={() => setLayout("mobile-accordion")}
              icon={ListIcon}
              title="Mobile Accordion"
              description="Compact hero, collapsible sections — Description, Classification, Habitat, Fun Facts."
            />
          </div>

          <div className="mt-5 flex gap-5 overflow-x-auto border-b border-black/10">
            {TABS.map((t) => {
              const Icon = TAB_ICONS[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  disabled={!specimen}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 py-3 text-sm font-medium whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${
                    tab === t ? "border-forest-700 text-forest-800" : "border-transparent text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t}
                </button>
              );
            })}
          </div>

          <div className="pt-5">
            {!specimen ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <LayersIcon className="h-8 w-8 text-zinc-300" />
                <p className="text-sm font-semibold text-zinc-700">Link a specimen to continue</p>
                <p className="max-w-xs text-xs text-zinc-500">
                  Common name, scientific name, taxonomy, and tags come from the cataloged specimen record.
                </p>
              </div>
            ) : (
              <>
                {tab === "Basic Info" && (
                  <BasicInfoTab
                    specimen={specimen}
                    description={description}
                    setDescription={setDescription}
                    distribution={distribution}
                    setDistribution={setDistribution}
                    diet={diet}
                    setDiet={setDiet}
                    funFacts={funFacts}
                    setFunFacts={setFunFacts}
                  />
                )}
                {tab === "Taxonomy & Ecology" && <TaxonomyEcologyTab specimen={specimen} />}
                {tab === "Media" && <MediaTab />}
                {tab === "AR Model" && <ArModelTab arEnabled={arEnabled} setArEnabled={setArEnabled} />}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-6 py-4">
          <p className="text-xs text-zinc-500">
            {specimen ? "Fields left blank won't appear on the public exhibit page." : "Link a specimen to enable saving."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!specimen}
              onClick={onClose}
              className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={!specimen}
              onClick={onClose}
              className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Publish Exhibit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
