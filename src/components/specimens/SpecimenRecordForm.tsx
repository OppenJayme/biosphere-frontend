"use client";

/**
 * The one-page catalog form (panel recommendation, 2026-11-28): basic details, taxonomy,
 * provenance and the first lot on one page, with a live checklist and two outcomes, "Save as
 * draft" or "Save and catalog", each a single click that saves everything in one request.
 * Fields, option lists and helper checks are the same as on the separate edit pages.
 */
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { saveSpecimenRecordAction, type RecordFormState } from "@/features/specimens/record-actions";
import {
  REMEMBERED_FIELDS,
  REMEMBERED_STORAGE_KEY,
  RECORD_SECTION_LABELS,
  applyRemembered,
  readRecordFormValues,
  recordChecklist,
  type RecordContext,
  type RecordFormField,
  type RecordFormValues,
  type RecordSection,
  type RememberedField,
} from "@/features/specimens/record-form";
import {
  CLASSIFICATION_STATUS_OPTIONS,
  CONSERVATION_STATUS_OPTIONS,
  ECOLOGICAL_ROLE_OPTIONS,
  KINGDOM_OPTIONS,
  PRESERVATION_TYPE_OPTIONS,
  SPECIMEN_CATEGORY_OPTIONS,
  classSuggestions,
  phylumSuggestions,
  preservationMethodSuggestions,
} from "@/features/specimens/field-options";
import { SPECIMEN_GENDERS, type MuseumCollection } from "@/features/specimens/types";
import type { StorageUnitOption } from "@/features/specimen-lots/types";
import { museumToday } from "@/lib/museum-date";
import { AccessionNumberCheck } from "./AccessionNumberCheck";
import { ConditionField } from "./ConditionField";
import { OptionField } from "./OptionField";
import { SpecimenDuplicateCheck } from "./SpecimenDuplicateCheck";

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

const REMEMBERED_LABELS: Record<RememberedField, string> = {
  collectionId: "collection",
  storageUnitId: "storage location",
  preservationType: "preservation type",
  preservationMethod: "preservation method",
};

type SpecimenRecordFormProps = RecordContext & {
  specimenId?: string;
  collections: MuseumCollection[];
  storageUnits: StorageUnitOption[];
  initialValues: RecordFormValues;
  /** Completing a draft that already has lots: how many are active. */
  activeLotCount?: number;
};

function genderLabel(gender: (typeof SPECIMEN_GENDERS)[number]) {
  return gender
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readRemembered(): Partial<Record<RememberedField, string>> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(REMEMBERED_STORAGE_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? (parsed as Partial<Record<RememberedField, string>>) : {};
  } catch {
    return {};
  }
}

function writeRemembered(values: RecordFormValues) {
  try {
    const kept = Object.fromEntries(REMEMBERED_FIELDS.map((field) => [field, values[field].trim()]));
    window.localStorage.setItem(REMEMBERED_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // A private window or blocked storage just means nothing is remembered.
  }
}

function forgetRemembered() {
  try {
    window.localStorage.removeItem(REMEMBERED_STORAGE_KEY);
  } catch {
    // Nothing to forget.
  }
}

export function SpecimenRecordForm({
  mode,
  hasActiveLot,
  specimenId,
  collections,
  storageUnits,
  initialValues,
  activeLotCount = 0,
}: SpecimenRecordFormProps) {
  const context: RecordContext = { mode, hasActiveLot };
  // Fixed for the life of the form. The page re-renders in the background (data refreshes), which
  // hands in new prop objects; nothing here may treat that as a reason to reset what was typed.
  const [initialState] = useState<RecordFormState>(() => ({ values: initialValues }));
  const startupValues = useRef(initialValues);
  const [state, formAction, pending] = useActionState(
    saveSpecimenRecordAction.bind(null, { mode, hasActiveLot, specimenId }),
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [defaults, setDefaults] = useState(initialValues);
  const [formKey, setFormKey] = useState(0);
  const [live, setLive] = useState(initialValues);
  const [remembered, setRemembered] = useState<RememberedField[]>([]);
  const [intent, setIntent] = useState<"draft" | "catalog" | null>(null);

  // Fill blank fields from the last specimen saved on this device (new records only). Once, on
  // mount: the server render cannot see this device's storage, and a later run would overwrite
  // what the curator has typed since.
  const rememberedApplied = useRef(false);
  useEffect(() => {
    if (mode !== "create" || rememberedApplied.current) return;
    rememberedApplied.current = true;
    const { values, applied } = applyRemembered(startupValues.current, readRemembered(), {
      collectionIds: new Set(collections.map((collection) => collection.id)),
      storageUnitIds: new Set(storageUnits.map((unit) => unit.id)),
    });
    if (applied.length === 0) return;
    setDefaults(values);
    setLive(values);
    setRemembered(applied);
    setFormKey((key) => key + 1);
  }, [mode, collections, storageUnits]);

  // A "Fix →" link opens this page at a section (#section-…). The page streams in after its
  // loading screen, so the browser's own jump finds nothing; scroll once the form exists.
  useEffect(() => {
    const target = window.location.hash.slice(1);
    if (target.startsWith("section-")) document.getElementById(target)?.scrollIntoView({ block: "start" });
  }, []);

  // After a refused save, show what the curator entered (React resets the fields on submit).
  // Only a new action result does this: `state` changes identity only when the action returns.
  useEffect(() => {
    if (state === initialState) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDefaults(state.values);
    setLive(state.values);
    setFormKey((key) => key + 1);
  }, [state, initialState]);

  const checks = recordChecklist(live, context);
  const done = checks.filter((check) => check.passed).length;
  const ready = done === checks.length;
  const missingBySection = new Set(checks.filter((check) => !check.passed).map((check) => check.section));

  function refreshLive() {
    if (formRef.current) setLive(readRecordFormValues(new FormData(formRef.current)));
  }

  function clearRemembered() {
    forgetRemembered();
    const cleared = { ...defaults };
    for (const field of remembered) cleared[field] = initialValues[field];
    setDefaults(cleared);
    setLive(cleared);
    setRemembered([]);
    setFormKey((key) => key + 1);
  }

  const errorsFor = (field: RecordFormField) => state.errors?.[field];
  const field = (name: RecordFormField) => ({
    defaultValue: defaults[name],
    invalid: Boolean(errorsFor(name)?.length),
    describedBy: errorsFor(name)?.length ? `${name}-error` : undefined,
  });

  return (
    <form
      key={formKey}
      ref={formRef}
      action={formAction}
      onInput={refreshLive}
      onChange={refreshLive}
      onSubmit={() => {
        if (formRef.current) writeRemembered(readRecordFormValues(new FormData(formRef.current)));
      }}
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]"
    >
      <div className="min-w-0 space-y-5">
        {remembered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-950">
            <p>
              Filled in from your last specimen on this device:{" "}
              {remembered.map((name) => REMEMBERED_LABELS[name]).join(", ")}.
            </p>
            <button type="button" onClick={clearRemembered} className="text-xs font-semibold text-sky-900 hover:underline">
              Clear them
            </button>
          </div>
        )}

        <Section id="basic" missing={missingBySection.has("basic")} description="Who and what the specimen is.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Labeled name="collectionId" label="Collection" required errors={errorsFor("collectionId")}>
              <select id="collectionId" name="collectionId" defaultValue={defaults.collectionId} {...aria(field("collectionId"))} className={inputClasses}>
                <option value="">Not assigned</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.collectionName}
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled
              name="accessionNumber"
              label="Accession number"
              required
              errors={errorsFor("accessionNumber")}
              hint={
                mode === "create"
                  ? `Leave blank and BioSphere assigns the next number (USC-BM-${new Date().getFullYear()}-NNNN) when you save.`
                  : "Stays with the record. It can be corrected but not cleared."
              }
            >
              <input
                id="accessionNumber"
                name="accessionNumber"
                type="text"
                maxLength={100}
                defaultValue={defaults.accessionNumber}
                placeholder={mode === "create" ? "Leave blank to assign automatically" : "e.g. USC-BM-2026-0001"}
                {...aria(field("accessionNumber"))}
                className={inputClasses}
              />
              {!errorsFor("accessionNumber")?.length && (
                <AccessionNumberCheck formRef={formRef} excludeSpecimenId={mode === "complete" ? specimenId : undefined} />
              )}
            </Labeled>

            <Labeled name="commonName" label="Common name" required errors={errorsFor("commonName")}>
              <input id="commonName" name="commonName" type="text" maxLength={255} defaultValue={defaults.commonName} placeholder="e.g. Philippine eagle" {...aria(field("commonName"))} className={inputClasses} />
            </Labeled>

            <Labeled name="scientificName" label="Scientific name" errors={errorsFor("scientificName")}>
              <input id="scientificName" name="scientificName" type="text" maxLength={255} defaultValue={defaults.scientificName} placeholder="e.g. Pithecophaga jefferyi" {...aria(field("scientificName"))} className={inputClasses} />
            </Labeled>

            <Labeled name="specimenCategory" label="Specimen category" errors={errorsFor("specimenCategory")}>
              <OptionField id="specimenCategory" name="specimenCategory" list={SPECIMEN_CATEGORY_OPTIONS} label="specimen category" maxLength={100} {...field("specimenCategory")} className={inputClasses} onValueChange={refreshLive} />
            </Labeled>

            <Labeled name="gender" label="Specimen gender" errors={errorsFor("gender")}>
              <select id="gender" name="gender" defaultValue={defaults.gender} {...aria(field("gender"))} className={inputClasses}>
                <option value="">Not recorded</option>
                {SPECIMEN_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {genderLabel(gender)}
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled name="classificationStatus" label="Classification status" wide errors={errorsFor("classificationStatus")}>
              <OptionField id="classificationStatus" name="classificationStatus" list={CLASSIFICATION_STATUS_OPTIONS} label="classification status" maxLength={100} {...field("classificationStatus")} className={inputClasses} />
            </Labeled>

            <Labeled name="remarks" label="Remarks" wide errors={errorsFor("remarks")}>
              <textarea id="remarks" name="remarks" rows={3} defaultValue={defaults.remarks} placeholder="Record relevant notes without adding unverified assumptions" {...aria(field("remarks"))} className={`${inputClasses} resize-y`} />
            </Labeled>
          </div>
          <div className="mt-4">
            <SpecimenDuplicateCheck formRef={formRef} excludeSpecimenId={mode === "complete" ? specimenId : undefined} />
          </div>
        </Section>

        <Section id="taxonomy" missing={missingBySection.has("taxonomy")} description="Only curator-confirmed values. Partial classification is fine.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Labeled name="kingdom" label="Kingdom" required errors={errorsFor("kingdom")}>
              <OptionField id="kingdom" name="kingdom" list={KINGDOM_OPTIONS} label="kingdom" maxLength={100} {...field("kingdom")} className={inputClasses} onValueChange={refreshLive} />
            </Labeled>
            <SuggestedText name="phylum" label="Phylum" placeholder="e.g. Chordata" suggestions={phylumSuggestions(live.kingdom)} defaults={defaults} errors={errorsFor("phylum")} />
            <SuggestedText name="class" label="Class" placeholder="e.g. Aves" suggestions={classSuggestions(live.phylum)} defaults={defaults} errors={errorsFor("class")} />
            <SuggestedText name="orderName" label="Order" placeholder="e.g. Accipitriformes" defaults={defaults} errors={errorsFor("orderName")} />
            <SuggestedText name="family" label="Family" placeholder="e.g. Accipitridae" defaults={defaults} errors={errorsFor("family")} />
            <SuggestedText name="genus" label="Genus" placeholder="e.g. Pithecophaga" defaults={defaults} errors={errorsFor("genus")} />
            <SuggestedText name="species" label="Species" placeholder="e.g. jefferyi" defaults={defaults} errors={errorsFor("species")} />
            <Labeled name="ecologicalRole" label="Ecological role" errors={errorsFor("ecologicalRole")}>
              <OptionField id="ecologicalRole" name="ecologicalRole" list={ECOLOGICAL_ROLE_OPTIONS} label="ecological role" maxLength={100} {...field("ecologicalRole")} className={inputClasses} />
            </Labeled>
            <Labeled name="conservationStatus" label="Conservation status" errors={errorsFor("conservationStatus")}>
              <OptionField id="conservationStatus" name="conservationStatus" list={CONSERVATION_STATUS_OPTIONS} label="conservation status" maxLength={100} {...field("conservationStatus")} className={inputClasses} />
            </Labeled>
            <SuggestedText name="habitat" label="Habitat" placeholder="Enter the recorded habitat" maxLength={250} wide defaults={defaults} errors={errorsFor("habitat")} />
          </div>
        </Section>

        <Section id="provenance" missing={missingBySection.has("provenance")} description="Where it came from and how it is preserved.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Labeled name="collectionDate" label="Collection date" required errors={errorsFor("collectionDate")}>
              <input id="collectionDate" name="collectionDate" type="date" max={museumToday()} defaultValue={defaults.collectionDate} {...aria(field("collectionDate"))} className={inputClasses} />
            </Labeled>
            <SuggestedText name="collectionLocation" label="Collection location" placeholder="Enter the recorded collection location" maxLength={255} defaults={defaults} errors={errorsFor("collectionLocation")} />
            <Labeled name="preservationType" label="Preservation type" required errors={errorsFor("preservationType")}>
              <OptionField id="preservationType" name="preservationType" list={PRESERVATION_TYPE_OPTIONS} label="preservation type" maxLength={255} {...field("preservationType")} className={inputClasses} onValueChange={refreshLive} />
            </Labeled>
            <SuggestedText
              name="preservationMethod"
              label="Preservation method"
              required
              placeholder="Pick a suggestion or type the method"
              maxLength={255}
              suggestions={preservationMethodSuggestions(live.preservationType)}
              defaults={defaults}
              errors={errorsFor("preservationMethod")}
            />
            <SuggestedText name="collector" label="Collector" placeholder="Enter the recorded collector" maxLength={255} defaults={defaults} errors={errorsFor("collector")} />
            <SuggestedText name="donor" label="Donor" placeholder="Enter the recorded donor" maxLength={255} defaults={defaults} errors={errorsFor("donor")} />
          </div>
        </Section>

        <Section
          id="storage"
          missing={missingBySection.has("storage")}
          description={
            hasActiveLot
              ? undefined
              : "Where the physical specimen is kept. Leave blank to add it later; it is needed to catalog."
          }
        >
          {hasActiveLot ? (
            <p className="text-sm text-zinc-700">
              This specimen already has {activeLotCount} active lot{activeLotCount === 1 ? "" : "s"}. Moves and quantity
              changes stay on the specimen&apos;s lots page.
            </p>
          ) : storageUnits.length === 0 ? (
            <p className="text-sm text-amber-900">
              No storage location can hold specimens yet. Add one under Locations, then come back to finish this record.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Labeled name="storageUnitId" label="Storage location" required wide errors={errorsFor("storageUnitId")}>
                <select id="storageUnitId" name="storageUnitId" defaultValue={defaults.storageUnitId} {...aria(field("storageUnitId"))} className={inputClasses}>
                  <option value="">Select an active storage location</option>
                  {storageUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </Labeled>
              <Labeled name="conditionClass" label="Condition" required errors={errorsFor("conditionClass")}>
                <ConditionField id="conditionClass" name="conditionClass" defaultValue={defaults.conditionClass} emptyLabel="Select a condition" invalid={field("conditionClass").invalid} describedBy={field("conditionClass").describedBy} className={inputClasses} onValueChange={refreshLive} />
              </Labeled>
              <Labeled name="quantity" label="Quantity" required errors={errorsFor("quantity")}>
                <input id="quantity" name="quantity" type="number" inputMode="numeric" min={1} step={1} defaultValue={defaults.quantity} {...aria(field("quantity"))} className={inputClasses} />
              </Labeled>
              <Labeled name="storageNotes" label="Storage notes" wide errors={errorsFor("storageNotes")}>
                <textarea id="storageNotes" name="storageNotes" rows={2} defaultValue={defaults.storageNotes} placeholder="Optional placement or handling notes" {...aria(field("storageNotes"))} className={`${inputClasses} resize-y`} />
              </Labeled>
            </div>
          )}
        </Section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Ready to catalog?</h2>
            <span className="text-xs font-medium text-zinc-500 tabular-nums">
              {done} of {checks.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100" aria-hidden>
            <div className="h-full rounded-full bg-forest-700 transition-[width]" style={{ width: `${(done / checks.length) * 100}%` }} />
          </div>
          <ul id="record-checklist" className="mt-4 space-y-2" aria-label="Catalog requirements">
            {checks.map((check) => (
              <li key={check.key} className="flex items-start gap-2.5 text-sm">
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold ${
                    check.passed ? "bg-forest-100 text-forest-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {check.passed ? "✓" : "!"}
                </span>
                <span className="min-w-0 flex-1">
                  {check.passed ? (
                    <span className="text-zinc-600">{check.label}</span>
                  ) : (
                    <a href={`#section-${check.section}`} className="font-medium text-amber-950 hover:underline">
                      {check.label}
                    </a>
                  )}
                  <span className="sr-only">{check.passed ? " (met)" : " (missing)"}</span>
                  {check.note && <span className="block text-xs text-zinc-500">{check.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {state.message && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium">{state.message}</p>
            {state.missingRequirements && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
                {state.missingRequirements.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-2">
          <button
            type="submit"
            name="intent"
            value="catalog"
            disabled={!ready || pending}
            aria-describedby="catalog-button-hint"
            onClick={() => setIntent("catalog")}
            className="w-full rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
          >
            {pending && intent === "catalog" ? "Saving and cataloging…" : "Save and catalog"}
          </button>
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={pending}
            onClick={() => setIntent("draft")}
            className="w-full rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && intent === "draft" ? "Saving draft…" : "Save as draft"}
          </button>
          <p id="catalog-button-hint" className="text-xs text-zinc-500">
            {ready
              ? "Everything required is filled in. Cataloging can be reopened later if something needs fixing."
              : "Save as draft keeps what you have as Uncataloged. Save and catalog turns on once the checklist is complete."}
          </p>
          <Link href={mode === "complete" && specimenId ? `/specimens/${specimenId}` : "/specimens"} className="block pt-1 text-center text-xs font-semibold text-zinc-600 hover:underline">
            Cancel
          </Link>
        </div>
      </aside>
    </form>
  );
}

function aria({ invalid, describedBy }: { invalid: boolean; describedBy?: string }) {
  return { "aria-invalid": invalid, "aria-describedby": describedBy };
}

function Section({
  id,
  missing,
  description,
  children,
}: {
  id: RecordSection;
  missing: boolean;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={`section-${id}`} aria-labelledby={`section-${id}-heading`} className="scroll-mt-24 rounded-xl border border-black/10 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2 border-b border-black/5 pb-4">
        <div>
          <h2 id={`section-${id}-heading`} className="text-base font-semibold text-zinc-900">
            {RECORD_SECTION_LABELS[id]}
          </h2>
          {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            missing ? "bg-amber-50 text-amber-900" : "bg-forest-50 text-forest-800"
          }`}
        >
          {missing ? "Needed to catalog" : "Complete"}
        </span>
      </div>
      {children}
    </section>
  );
}

function Labeled({
  name,
  label,
  required = false,
  wide = false,
  hint,
  errors,
  children,
}: {
  name: RecordFormField;
  label: string;
  required?: boolean;
  wide?: boolean;
  hint?: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className="block text-xs font-medium text-zinc-700">
        {label}
        {required && (
          <span className="ml-1 text-amber-700" title="Needed to catalog">
            *<span className="sr-only"> needed to catalog</span>
          </span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      {errors?.length ? (
        <p id={`${name}-error`} className="mt-1 text-xs font-medium text-red-700">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

function SuggestedText({
  name,
  label,
  placeholder,
  suggestions,
  maxLength = 100,
  required = false,
  wide = false,
  defaults,
  errors,
}: {
  name: RecordFormField;
  label: string;
  placeholder: string;
  suggestions?: readonly string[];
  maxLength?: number;
  required?: boolean;
  wide?: boolean;
  defaults: RecordFormValues;
  errors?: string[];
}) {
  const listId = suggestions?.length ? `${name}-suggestions` : undefined;
  return (
    <Labeled name={name} label={label} required={required} wide={wide} errors={errors}>
      <input
        id={name}
        name={name}
        type="text"
        maxLength={maxLength}
        defaultValue={defaults[name]}
        placeholder={placeholder}
        list={listId}
        aria-invalid={Boolean(errors?.length)}
        aria-describedby={errors?.length ? `${name}-error` : undefined}
        className={inputClasses}
      />
      {listId && (
        <datalist id={listId}>
          {suggestions!.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      )}
    </Labeled>
  );
}
