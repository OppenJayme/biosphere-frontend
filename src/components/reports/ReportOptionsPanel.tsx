"use client";

import { DownloadIcon, InfoIcon } from "@/components/icons";
import type { ReportFormState } from "@/features/reports/form";
import {
  EXHIBIT_STATUS_OPTIONS,
  INQUIRY_STATUS_OPTIONS,
  REPORT_PERIOD_LABELS,
  SPECIMEN_STATUS_OPTIONS,
  VISIT_STATUS_OPTIONS,
  type ReportDefinition,
  type ReportStorageOption,
} from "@/features/reports/types";

const inputClasses =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

type Update = <K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) => void;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function TextFilter({
  label,
  name,
  form,
  update,
  placeholder,
}: {
  label: string;
  name: "category" | "kingdom" | "phylum" | "taxonClass" | "taxonOrder" | "family" | "genus" | "species" | "conditionClass" | "inquiryType";
  form: ReportFormState;
  update: Update;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        value={form[name]}
        onChange={(event) => update(name, event.target.value)}
        maxLength={100}
        placeholder={placeholder ?? "Any"}
        className={inputClasses}
      />
    </Field>
  );
}

function EnumFilter({
  label,
  name,
  options,
  form,
  update,
}: {
  label: string;
  name: "specimenStatus" | "inquiryStatus" | "visitStatus" | "exhibitStatus";
  options: readonly (readonly [string, string])[];
  form: ReportFormState;
  update: Update;
}) {
  return (
    <Field label={label}>
      <select value={form[name]} onChange={(event) => update(name, event.target.value)} className={inputClasses}>
        <option value="">All statuses</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
    </Field>
  );
}

export function ReportOptionsPanel({
  definition,
  form,
  update,
  storageOptions,
  storageError,
  error,
  onClear,
  onExport,
}: {
  definition: ReportDefinition;
  form: ReportFormState;
  update: Update;
  storageOptions: ReportStorageOption[];
  storageError: boolean;
  error: string | null;
  onClear: () => void;
  onExport: () => void;
}) {
  const accepts = new Set(definition.filters);

  return (
    <section className="flex flex-col rounded-xl border border-black/10 bg-white p-5" aria-labelledby="report-options-heading">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 id="report-options-heading" className="text-base font-semibold text-zinc-900">Report Filters</h2>
        <button type="button" onClick={onClear} className="text-xs font-medium text-forest-700 hover:text-forest-800">
          Clear all
        </button>
      </div>
      <p className="mb-4 text-xs text-zinc-500">{definition.title}</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Field label="Reporting period">
            <select
              value={form.period}
              onChange={(event) => update("period", event.target.value as ReportFormState["period"])}
              className={inputClasses}
            >
              {definition.periods.map((period) => (
                <option key={period} value={period}>{REPORT_PERIOD_LABELS[period]}</option>
              ))}
            </select>
          </Field>
          {form.period === "MONTHLY" && (
            <Field label="Month">
              <input type="month" value={form.month} onChange={(event) => update("month", event.target.value)} className={inputClasses} />
            </Field>
          )}
          {form.period === "YEARLY" && (
            <Field label="Year">
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                max={9999}
                value={form.year}
                onChange={(event) => update("year", event.target.value)}
                className={inputClasses}
              />
            </Field>
          )}
          {form.period === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="From">
                <input type="date" value={form.from} onChange={(event) => update("from", event.target.value)} className={inputClasses} />
              </Field>
              <Field label="To">
                <input type="date" value={form.to} onChange={(event) => update("to", event.target.value)} className={inputClasses} />
              </Field>
            </div>
          )}
          <p className="flex gap-1.5 text-[11px] leading-snug text-zinc-500">
            <InfoIcon className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>Period covers: {definition.periodAppliesTo} Dates follow Philippine time.</span>
          </p>
        </div>

        {accepts.has("specimenStatus") && (
          <div className="grid grid-cols-2 gap-3">
            <EnumFilter label="Specimen status" name="specimenStatus" options={SPECIMEN_STATUS_OPTIONS} form={form} update={update} />
            <Field label="Public display">
              <select
                value={form.publicDisplay}
                onChange={(event) => update("publicDisplay", event.target.value as ReportFormState["publicDisplay"])}
                className={inputClasses}
              >
                <option value="">Any</option>
                <option value="true">Allowed</option>
                <option value="false">Not allowed</option>
              </select>
            </Field>
            <TextFilter label="Category" name="category" form={form} update={update} placeholder="e.g. Insect" />
            <TextFilter label="Condition" name="conditionClass" form={form} update={update} placeholder="e.g. Good" />
          </div>
        )}

        {accepts.has("storageUnitId") && (
          <div className="space-y-2">
            <Field label="Storage location">
              <select
                value={form.storageUnitId}
                onChange={(event) => update("storageUnitId", event.target.value)}
                className={inputClasses}
                disabled={storageError}
              >
                <option value="">All locations</option>
                {storageOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.pathLabel}{option.archived ? " (archived)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            {storageError && (
              <p className="text-[11px] text-amber-700">Storage locations could not be loaded, so this filter is unavailable.</p>
            )}
            {form.storageUnitId && (
              <label className="flex items-center gap-2 text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.includeDescendantUnits}
                  onChange={(event) => update("includeDescendantUnits", event.target.checked)}
                  className="h-4 w-4 rounded border-black/20 accent-forest-700"
                />
                Include cabinets, drawers, and other units inside it
              </label>
            )}
          </div>
        )}

        {accepts.has("family") && (
          <details className="rounded-lg border border-black/10 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-zinc-700">Taxonomy</summary>
            <div className="mt-3 grid grid-cols-2 gap-3 pb-1">
              <TextFilter label="Kingdom" name="kingdom" form={form} update={update} />
              <TextFilter label="Phylum" name="phylum" form={form} update={update} />
              <TextFilter label="Class" name="taxonClass" form={form} update={update} />
              <TextFilter label="Order" name="taxonOrder" form={form} update={update} />
              <TextFilter label="Family" name="family" form={form} update={update} />
              <TextFilter label="Genus" name="genus" form={form} update={update} />
              <TextFilter label="Species" name="species" form={form} update={update} />
            </div>
          </details>
        )}

        {accepts.has("inquiryStatus") && (
          <div className="grid grid-cols-2 gap-3">
            <EnumFilter label="Inquiry status" name="inquiryStatus" options={INQUIRY_STATUS_OPTIONS} form={form} update={update} />
            <TextFilter label="Inquiry type" name="inquiryType" form={form} update={update} placeholder="e.g. Research" />
          </div>
        )}

        {accepts.has("visitStatus") && (
          <EnumFilter label="Visit-request status" name="visitStatus" options={VISIT_STATUS_OPTIONS} form={form} update={update} />
        )}

        {accepts.has("exhibitStatus") && (
          <div className="grid grid-cols-2 gap-3">
            <EnumFilter label="Exhibit status" name="exhibitStatus" options={EXHIBIT_STATUS_OPTIONS} form={form} update={update} />
            <Field label="AR">
              <select
                value={form.arEnabled}
                onChange={(event) => update("arEnabled", event.target.value as ReportFormState["arEnabled"])}
                className={inputClasses}
              >
                <option value="">Any</option>
                <option value="true">AR enabled</option>
                <option value="false">No AR</option>
              </select>
            </Field>
          </div>
        )}

        {accepts.has("remarks") && (
          <Field label="Curator remarks (optional)">
            <textarea
              value={form.remarks}
              onChange={(event) => update("remarks", event.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Printed in the report's Curator Remarks section."
              className={`${inputClasses} resize-y`}
            />
            <span className="mt-1 block text-right text-[11px] text-zinc-400">
              {form.remarks.length.toLocaleString()} / 5,000
            </span>
          </Field>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onExport}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
      >
        <DownloadIcon className="h-4 w-4" />
        Export report
      </button>
    </section>
  );
}
