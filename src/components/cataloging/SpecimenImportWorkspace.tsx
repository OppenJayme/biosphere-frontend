/** Interactive review surface for the backend's retry-safe specimen CSV import. */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  AlertTriangleIcon,
  CheckIcon,
  DownloadIcon,
  UploadIcon,
} from "@/components/icons";
import {
  commitSpecimenImportAction,
} from "@/features/specimens/import-actions";
import {
  MAX_SPECIMEN_IMPORT_FILE_BYTES,
  selectedWarningCount,
  specimenImportPreviewSchema,
  validateImportFileMetadata,
  validImportRowNumbers,
  type SpecimenImportCommit,
  type SpecimenImportPreview,
  type SpecimenImportPreviewRow,
} from "@/features/specimens/import-types";

function rowIdentity(row: SpecimenImportPreviewRow) {
  return (
    row.data.accessionNumber ??
    row.data.commonName ??
    row.data.scientificName ??
    `CSV row ${row.rowNumber}`
  );
}

function formatExpiry(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(date);
}

export function SpecimenImportWorkspace() {
  const router = useRouter();
  const [preview, setPreview] = useState<SpecimenImportPreview | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
  const [commitResult, setCommitResult] = useState<SpecimenImportCommit | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPreviewing, startPreview] = useTransition();
  const [isCommitting, startCommit] = useTransition();

  const selectedWarnings = useMemo(
    () => (preview ? selectedWarningCount(preview, selected) : 0),
    [preview, selected],
  );
  const validRows = preview?.rows.filter((row) => row.valid) ?? [];
  const allValidSelected = validRows.length > 0 && validRows.every((row) => selected.has(row.rowNumber));

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    const fileError = file instanceof File
      ? validateImportFileMetadata(file)
      : "Choose a non-empty CSV file to preview.";
    setMessage(null);
    setPreview(null);
    setCommitResult(null);
    setSelected(new Set());
    setWarningsAcknowledged(false);

    if (fileError) {
      setMessage(fileError);
      return;
    }

    startPreview(async () => {
      let response: Response;
      try {
        response = await fetch("/api/cataloging/specimens/import/preview", {
          method: "POST",
          body: formData,
        });
      } catch {
        setMessage("The CSV preview is unavailable. Check your connection and try again.");
        return;
      }

      const body: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push("/login?from=/cataloging/import");
        return;
      }
      if (!response.ok) {
        const candidate =
          body && typeof body === "object" && "message" in body
            ? (body as { message?: unknown }).message
            : null;
        setMessage(
          typeof candidate === "string"
            ? candidate
            : Array.isArray(candidate) && candidate.every((item) => typeof item === "string")
              ? candidate.join(" ")
              : "The CSV could not be previewed. Check the file and try again.",
        );
        return;
      }

      const parsed = specimenImportPreviewSchema.safeParse(body);
      if (!parsed.success) {
        setMessage("The backend returned an invalid specimen-import preview.");
        return;
      }
      setPreview(parsed.data);
      setSelected(new Set(validImportRowNumbers(parsed.data)));
    });
  }

  function toggleRow(rowNumber: number) {
    setCommitResult(null);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
    setWarningsAcknowledged(false);
  }

  function toggleAllValid() {
    setCommitResult(null);
    setSelected(allValidSelected ? new Set() : new Set(validRows.map((row) => row.rowNumber)));
    setWarningsAcknowledged(false);
  }

  function handleCommit() {
    if (!preview || selected.size === 0 || (selectedWarnings > 0 && !warningsAcknowledged)) return;
    setMessage(null);
    setCommitResult(null);

    startCommit(async () => {
      const result = await commitSpecimenImportAction({
        previewId: preview.previewId,
        rowNumbers: [...selected],
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setCommitResult(result.data);
      const failedRows = result.data.results
        .filter((row) => !row.success)
        .map((row) => row.rowNumber);
      setSelected(new Set(failedRows));
      setWarningsAcknowledged(failedRows.length > 0 && warningsAcknowledged);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">1. Upload and validate</h2>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            CSV only, up to 5 MB and 500 data rows. Previewing does not save records.
          </p>
          <a
            href="/templates/specimen-import-template.csv"
            download
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-900"
          >
            <DownloadIcon className="h-3.5 w-3.5" /> Download CSV template
          </a>
        </div>
        <form onSubmit={handlePreview} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-medium text-zinc-600">Specimen CSV</span>
            <input
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              disabled={isPreviewing || isCommitting}
              className="block w-full rounded-lg border border-black/15 bg-white text-sm text-zinc-700 file:mr-3 file:border-0 file:border-r file:border-black/10 file:bg-sage-50 file:px-3 file:py-2.5 file:font-semibold file:text-forest-800"
            />
          </label>
          <button
            type="submit"
            disabled={isPreviewing || isCommitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:pointer-events-none disabled:opacity-50"
          >
            <UploadIcon className="h-4 w-4" />
            {isPreviewing ? "Validating…" : "Preview CSV"}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-zinc-400">
          Maximum upload: {(MAX_SPECIMEN_IMPORT_FILE_BYTES / 1024 / 1024).toFixed(0)} MB. The file itself is not retained by this page.
        </p>
      </section>

      {message && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {message}
        </div>
      )}

      {preview && (
        <section className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">2. Review validated rows</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Preview expires {formatExpiry(preview.expiresAt)}. Invalid rows cannot be selected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700">{preview.totalRows} total</span>
              <span className="rounded-full bg-forest-100 px-3 py-1.5 text-forest-700">{preview.validRows} valid</span>
              <span className="rounded-full bg-red-100 px-3 py-1.5 text-red-700">{preview.invalidRows} invalid</span>
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">{preview.rowsWithWarnings} warned</span>
            </div>
          </div>

          {preview.unmappedColumns.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
              <p className="font-semibold">Unmapped columns were ignored:</p>
              <p className="mt-1 break-words">{preview.unmappedColumns.join(", ")}</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-sage-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-3 py-3">
                    <input type="checkbox" aria-label="Select all valid rows" checked={allValidSelected} onChange={toggleAllValid} disabled={validRows.length === 0 || isCommitting} />
                  </th>
                  <th className="px-3 py-3">Row</th>
                  <th className="px-3 py-3">Specimen</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Classification</th>
                  <th className="px-3 py-3">Review result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {preview.rows.map((row) => (
                  <tr key={row.rowNumber} className={row.valid ? "hover:bg-sage-50/60" : "bg-red-50/40"}>
                    <td className="px-3 py-3 align-top">
                      <input type="checkbox" aria-label={`Select CSV row ${row.rowNumber}`} checked={selected.has(row.rowNumber)} onChange={() => toggleRow(row.rowNumber)} disabled={!row.valid || isCommitting} />
                    </td>
                    <td className="px-3 py-3 align-top font-medium text-zinc-700">{row.rowNumber}</td>
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium text-zinc-900">{rowIdentity(row)}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{row.data.scientificName ?? "Scientific name not provided"}</p>
                    </td>
                    <td className="px-3 py-3 align-top text-zinc-600">{row.data.specimenCategory ?? "Not provided"}</td>
                    <td className="px-3 py-3 align-top text-zinc-600">{row.data.classificationStatus ?? "Not provided"}</td>
                    <td className="max-w-[360px] px-3 py-3 align-top">
                      {row.errors.length > 0 && <ul className="list-disc space-y-1 pl-4 text-xs text-red-700">{row.errors.map((error, index) => <li key={`${row.rowNumber}-error-${index}`}>{error}</li>)}</ul>}
                      {row.duplicateWarnings.length > 0 && <ul className="list-disc space-y-1 pl-4 text-xs text-amber-800">{row.duplicateWarnings.map((warning, index) => <li key={`${row.rowNumber}-warning-${index}`}>{warning}</li>)}</ul>}
                      {row.valid && row.duplicateWarnings.length === 0 && <span className="inline-flex items-center gap-1 text-xs font-medium text-forest-700"><CheckIcon className="h-3.5 w-3.5" /> Ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedWarnings > 0 && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <input type="checkbox" checked={warningsAcknowledged} onChange={(event) => setWarningsAcknowledged(event.target.checked)} disabled={isCommitting} className="mt-0.5" />
              <span>
                I reviewed the duplicate warning{selectedWarnings === 1 ? "" : "s"} on {selectedWarnings} selected row{selectedWarnings === 1 ? "" : "s"} and intentionally want to import them.
              </span>
            </label>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
            <p className="text-xs text-zinc-500">{selected.size} valid row{selected.size === 1 ? "" : "s"} selected</p>
            <button
              type="button"
              onClick={handleCommit}
              disabled={isCommitting || isPreviewing || selected.size === 0 || (selectedWarnings > 0 && !warningsAcknowledged)}
              className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:pointer-events-none disabled:opacity-50"
            >
              {isCommitting ? "Importing…" : commitResult?.failedCount ? "Retry failed rows" : "Import selected rows"}
            </button>
          </div>
        </section>
      )}

      {commitResult && (
        <section className={`rounded-xl border p-5 ${commitResult.failedCount > 0 ? "border-amber-200 bg-amber-50" : "border-forest-200 bg-forest-50"}`}>
          <div className="flex items-start gap-3">
            {commitResult.failedCount > 0 ? <AlertTriangleIcon className="mt-0.5 h-5 w-5 text-amber-700" /> : <CheckIcon className="mt-0.5 h-5 w-5 text-forest-700" />}
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-zinc-900">Import request completed</h2>
              <p className="mt-1 text-sm text-zinc-700">{commitResult.createdCount} successful, {commitResult.failedCount} failed. Safe retries return the original successful records.</p>
              <p className="mt-1 truncate text-xs text-zinc-500" title={commitResult.importBatchId}>Batch ID: {commitResult.importBatchId}</p>
              {commitResult.failedCount > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-red-700">
                  {commitResult.results.filter((row) => !row.success).map((row) => <li key={row.rowNumber}>Row {row.rowNumber}: {row.errors?.join(" ") ?? "Import failed."}</li>)}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/cataloging" className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800">View cataloging queue</Link>
                <Link href="/audit-logs?module=specimens&action=IMPORT_SPECIMEN" className="rounded-lg border border-forest-700 px-3.5 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-100">View import audit records</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
