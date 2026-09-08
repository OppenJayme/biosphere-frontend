"use client";

import { useEffect, useState } from "react";
import {
  CloseIcon,
  GridIcon,
  DocumentTextIcon,
  ArchiveIcon,
  DownloadIcon,
  CheckIcon,
} from "@/components/icons";

export type ExportTarget = {
  title: string;
  subtitle: string;
  recordCount: number;
};

type FileFormat = "CSV" | "Word" | "PDF";

const FORMATS: { value: FileFormat; label: string; description: string; icon: typeof GridIcon }[] = [
  { value: "CSV", label: "CSV", description: "Raw data, best for spreadsheets and further analysis", icon: GridIcon },
  { value: "Word", label: "Word document (.docx)", description: "Formatted layout, easy to annotate or share for review", icon: DocumentTextIcon },
  { value: "PDF", label: "PDF", description: "Fixed layout, best for printing or official records", icon: ArchiveIcon },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ExportReportModal({ target, onClose }: { target: ExportTarget; onClose: () => void }) {
  const [format, setFormat] = useState<FileFormat>("CSV");
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (progress === null || progress >= 100) return;
    const timer = setTimeout(() => setProgress((p) => Math.min(100, (p ?? 0) + 20)), 150);
    return () => clearTimeout(timer);
  }, [progress]);

  const exporting = progress !== null;
  const done = progress === 100;
  const filename = `${slugify(target.title)}_2025-05-22.${format.toLowerCase() === "word" ? "docx" : format.toLowerCase()}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:items-center">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {!exporting ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-black/10 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Export report</h2>
                <p className="text-xs text-zinc-500">Choose a file format to download this report.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-zinc-400 hover:text-zinc-600">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="flex items-center gap-3 rounded-lg bg-sage-50 px-3.5 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-forest-700">
                  <GridIcon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{target.title}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {target.subtitle} &middot; {target.recordCount.toLocaleString()} records
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">File Format</p>
                <div className="space-y-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFormat(f.value)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                        format === f.value ? "border-forest-700 bg-forest-50" : "border-black/10 hover:bg-sage-50"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-forest-700 ring-1 ring-black/10">
                        <f.icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-zinc-900">{f.label}</span>
                        <span className="block text-xs text-zinc-500">{f.description}</span>
                      </span>
                      <span
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                          format === f.value ? "border-forest-700" : "border-black/20"
                        }`}
                      >
                        {format === f.value && <span className="h-2 w-2 rounded-full bg-forest-700" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-black/10 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setProgress(0)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export report
              </button>
            </div>
          </>
        ) : (
          <div className="px-6 py-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-sage-100 text-forest-700">
              <GridIcon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              {done ? "Export Complete" : `Exporting to ${format}`}
            </h2>
            <p className="mt-1 truncate rounded-lg bg-sage-50 px-3 py-1.5 text-xs text-zinc-600">{filename}</p>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-500">
                <span>{done ? "Done" : "Exporting…"}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-sage-100">
                <div
                  className="h-full rounded-full bg-forest-700 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              <span className="font-semibold text-zinc-800">{target.recordCount.toLocaleString()}</span> records &middot; ~184 KB
            </p>

            <button
              type="button"
              disabled={!done}
              onClick={onClose}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Download {format}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-lg border border-black/15 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
            >
              Cancel
            </button>

            {done && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-forest-700">
                <CheckIcon className="h-3.5 w-3.5" />
                {target.recordCount.toLocaleString()} records exported &middot; 184 KB
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
