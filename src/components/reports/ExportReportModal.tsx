"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckIcon,
  CloseIcon,
  DocumentTextIcon,
  DownloadIcon,
  GridIcon,
} from "@/components/icons";
import { attachmentFileName, type ReportRequestResult } from "@/features/reports/form";
import type { ReportDefinition, ReportFormat } from "@/features/reports/types";

const FORMATS: Record<ReportFormat, { label: string; description: string; icon: typeof GridIcon; tint: string }> = {
  CSV: {
    label: "CSV",
    description: "Raw data, best for spreadsheets and further analysis",
    icon: GridIcon,
    tint: "bg-amber-50 text-amber-600",
  },
  DOCX: {
    label: "Word document (.docx)",
    description: "Formatted layout, easy to annotate or share for review",
    icon: DocumentTextIcon,
    tint: "bg-sky-50 text-sky-600",
  },
  PDF: {
    label: "PDF",
    description: "Fixed layout, best for printing or official records",
    icon: ArchiveIcon,
    tint: "bg-red-50 text-red-600",
  },
};

// CSV first, then Word, then PDF, as in the SRS export modal.
const FORMAT_ORDER: ReportFormat[] = ["CSV", "DOCX", "PDF"];

type Status =
  | { kind: "idle" }
  | { kind: "generating" }
  | { kind: "done"; fileName: string }
  | { kind: "error"; message: string };

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before releasing it.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function errorMessage(response: Response) {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }
  return "The report could not be generated. No file was created.";
}

export function ExportReportModal({
  definition,
  scope,
  buildRequest,
  onClose,
  onGenerated,
}: {
  definition: ReportDefinition;
  /** One-line summary of the period and filters, e.g. "September 2026 · 2 filters". */
  scope: string;
  buildRequest: (format: ReportFormat) => ReportRequestResult;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const formats = FORMAT_ORDER.filter((format) => definition.formats.includes(format));
  const [format, setFormat] = useState<ReportFormat>(formats[0]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const generating = status.kind === "generating";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  function close() {
    if (!generating) onClose();
  }

  async function exportReport() {
    const request = buildRequest(format);
    if (!request.ok) {
      setStatus({ kind: "error", message: request.error });
      return;
    }

    setStatus({ kind: "generating" });
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request.body),
      });
      if (!response.ok) {
        setStatus({ kind: "error", message: await errorMessage(response) });
        if (response.status === 400) onGenerated(); // the failed attempt is in the history
        return;
      }
      const fileName = attachmentFileName(
        response.headers.get("content-disposition"),
        `${definition.type.toLowerCase()}.${format.toLowerCase()}`,
      );
      downloadBlob(await response.blob(), fileName);
      setStatus({ kind: "done", fileName });
      onGenerated();
    } catch {
      setStatus({
        kind: "error",
        message: "The report could not be downloaded. Check your connection and try again.",
      });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-busy={generating}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-start justify-between gap-3 border-b border-black/10 px-6 py-4">
        <div>
          <h2 id={titleId} className="text-base font-semibold text-zinc-900">Export report</h2>
          <p className="text-xs text-zinc-500">Choose a file format to download this report.</p>
        </div>
        <button
          type="button"
          onClick={close}
          disabled={generating}
          aria-label="Close"
          className="shrink-0 text-zinc-400 hover:text-zinc-600 disabled:opacity-40"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="flex items-center gap-3 rounded-lg bg-sage-50 px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-forest-700">
            <GridIcon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{definition.title}</p>
            <p className="text-xs text-zinc-500">{scope}</p>
          </div>
        </div>

        {status.kind === "done" ? (
          <div role="status" className="rounded-lg border border-forest-100 bg-sage-50 px-4 py-4 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-forest-700 text-white">
              <CheckIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-zinc-900">Report downloaded</p>
            <p className="mt-1 break-all text-xs text-zinc-600">{status.fileName}</p>
            <p className="mt-2 text-[11px] text-zinc-500">
              Edits to this file never change BioSphere records. Generate it again for current data.
            </p>
          </div>
        ) : (
          <fieldset disabled={generating}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">File format</legend>
            <div className="space-y-2">
              {formats.map((value) => {
                const option = FORMATS[value];
                const selected = value === format;
                return (
                  <label
                    key={value}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-forest-700 ${
                      selected ? "border-forest-700 bg-sage-50" : "border-black/10 hover:bg-sage-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-format"
                      value={value}
                      checked={selected}
                      onChange={() => {
                        setFormat(value);
                        if (status.kind === "error") setStatus({ kind: "idle" });
                      }}
                      className="sr-only"
                    />
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/10 ${option.tint}`}>
                      <option.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-900">{option.label}</span>
                      <span className="block text-xs text-zinc-500">{option.description}</span>
                    </span>
                    <span
                      aria-hidden
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-forest-700" : "border-black/20"
                      }`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-forest-700" />}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {status.kind === "error" && (
          <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangleIcon className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>{status.message}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-black/10 px-6 py-4">
        <button
          type="button"
          onClick={close}
          disabled={generating}
          className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100 disabled:opacity-50"
        >
          {status.kind === "done" ? "Close" : "Cancel"}
        </button>
        {status.kind !== "done" && (
          <button
            type="button"
            onClick={exportReport}
            disabled={generating}
            autoFocus
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-wait disabled:opacity-70"
          >
            {generating ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
            ) : (
              <DownloadIcon className="h-3.5 w-3.5" />
            )}
            {generating ? "Generating…" : "Export report"}
          </button>
        )}
      </div>
    </dialog>
  );
}
