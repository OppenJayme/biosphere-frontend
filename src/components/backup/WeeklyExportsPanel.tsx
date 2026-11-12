"use client";

/**
 * Weekly Excel export (backend spec 0003): schedule, overdue and failure
 * notices, "Run export now", and authenticated downloads. Files never get a
 * shareable link; the backend checks the role and audits every download.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DownloadIcon, RefreshIcon } from "@/components/icons";
import {
  EXPORT_FAILURE_LABELS,
  type ExportEntry,
  type ExportOverview,
} from "@/features/backup/exports-types";

const DAY_NAMES: Record<string, string> = {
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

function scheduleLabel(schedule: string) {
  const [day, time] = schedule.split(" ");
  const [h, m] = (time ?? "").split(":").map(Number);
  if (!DAY_NAMES[day] || Number.isNaN(h)) return schedule;
  const hour12 = ((h + 11) % 12) + 1;
  return `Every ${DAY_NAMES[day]} at ${hour12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function totalRows(entry: ExportEntry) {
  if (!entry.rowCounts) return null;
  return Object.values(entry.rowCounts).reduce((sum, n) => sum + n, 0);
}

const STATUS_STYLES: Record<ExportEntry["status"], string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-forest-100 text-forest-700",
  FAILED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<ExportEntry["status"], string> = {
  IN_PROGRESS: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

async function messageOf(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  return body && typeof body === "object" && "message" in body && typeof body.message === "string"
    ? body.message
    : fallback;
}

function fileNameOf(response: Response, fallback: string) {
  const header = response.headers.get("content-disposition") ?? "";
  return /filename="([^"]+)"/.exec(header)?.[1] ?? fallback;
}

export function WeeklyExportsPanel({
  overview,
  errorMessage,
}: {
  overview: ExportOverview | null;
  errorMessage?: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function runNow() {
    setRunning(true);
    setNotice(null);
    try {
      const response = await fetch("/api/backup-exports/run", { method: "POST" });
      if (!response.ok) {
        setNotice({ kind: "error", text: await messageOf(response, "The export failed. Nothing was saved.") });
      } else {
        const entry = (await response.json()) as ExportEntry;
        setNotice({
          kind: "ok",
          text: `Export completed: ${totalRows(entry) ?? 0} rows checked and saved. You can download it below.`,
        });
      }
    } catch {
      setNotice({ kind: "error", text: "The export could not be started. Check your connection and try again." });
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  async function download(entry: ExportEntry) {
    setDownloading(entry.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/backup-exports/${entry.id}/file`);
      if (!response.ok) {
        setNotice({ kind: "error", text: await messageOf(response, "The file could not be downloaded.") });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameOf(response, `BioSphere-export-${entry.exportDate ?? "file"}.xlsx`);
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setNotice({ kind: "error", text: "The file could not be downloaded. Check your connection and try again." });
    } finally {
      setDownloading(null);
    }
  }

  if (!overview) {
    return (
      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Weekly Excel export</h2>
        <p className="mt-2 text-sm text-zinc-600">
          {errorMessage ?? "The export status could not be loaded. Try again later."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-black/10 bg-white p-5" aria-labelledby="weekly-export-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="weekly-export-title" className="text-base font-semibold text-zinc-900">
            Weekly Excel export
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            A complete Excel copy of the inventory and visitor records, checked against the database before it is
            saved. Files are private: only curators can download them.
          </p>
        </div>
        <button
          type="button"
          onClick={runNow}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshIcon className={`h-4 w-4 ${running ? "animate-spin" : ""}`} aria-hidden="true" />
          {running ? "Exporting…" : "Run export now"}
        </button>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-zinc-50 p-3">
          <dt className="text-zinc-500">Schedule</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">
            {overview.enabled ? scheduleLabel(overview.schedule) : "Automatic exports are off"}
          </dd>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <dt className="text-zinc-500">Next scheduled export</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">
            {overview.enabled ? formatDate(overview.nextExportDate) : "—"}
          </dd>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <dt className="text-zinc-500">Last completed export</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{formatTimestamp(overview.lastCompletedAt)}</dd>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <dt className="text-zinc-500">Files kept</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">
            {overview.retentionWeeks ? `Latest ${overview.retentionWeeks} weeks` : "All (no retention set yet)"}
          </dd>
        </div>
      </dl>

      {overview.lastFailure && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          The latest export on {formatTimestamp(overview.lastFailure.at)} failed:{" "}
          {EXPORT_FAILURE_LABELS[overview.lastFailure.code ?? ""] ?? "unknown reason"}. No file was saved for it.
        </p>
      )}
      {overview.overdue && (
        <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {overview.lastCompletedAt
            ? "No export has completed in the last 8 days."
            : "No export has completed yet."}{" "}
          Run one now, and check that the backend is running.
        </p>
      )}
      {overview.fieldSet.status === "PROVISIONAL" && (
        <p className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Included visitor details are provisional ({overview.fieldSet.version}) until the Library confirms which
          fields to keep.
        </p>
      )}
      {notice && (
        <p
          role={notice.kind === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-sm ${
            notice.kind === "error"
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-forest-200 bg-forest-50 text-forest-800"
          }`}
        >
          {notice.text}
        </p>
      )}

      {overview.items.length === 0 ? (
        <p className="text-sm text-zinc-600">No exports yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">Export date</th>
                <th scope="col" className="py-2 pr-3 font-medium">Type</th>
                <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                <th scope="col" className="py-2 pr-3 font-medium">Rows</th>
                <th scope="col" className="py-2 pr-3 font-medium">Size</th>
                <th scope="col" className="py-2 pr-3 font-medium">Finished</th>
                <th scope="col" className="py-2 font-medium"><span className="sr-only">Download</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {overview.items.map((entry) => (
                <tr key={entry.id}>
                  <td className="py-2 pr-3 text-zinc-900">{formatDate(entry.exportDate)}</td>
                  <td className="py-2 pr-3 text-zinc-700">
                    {entry.type === "WEEKLY" ? "Scheduled" : `Manual${entry.startedBy ? ` (${entry.startedBy})` : ""}`}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[entry.status]}`}>
                      {STATUS_LABELS[entry.status]}
                    </span>
                    {entry.failureCode && (
                      <span className="mt-1 block text-xs text-red-700">
                        {EXPORT_FAILURE_LABELS[entry.failureCode] ?? entry.failureCode}
                      </span>
                    )}
                    {entry.expired && <span className="mt-1 block text-xs text-zinc-500">File removed (retention)</span>}
                  </td>
                  <td className="py-2 pr-3 text-zinc-700">{totalRows(entry) ?? "—"}</td>
                  <td className="py-2 pr-3 text-zinc-700">{formatBytes(entry.fileBytes)}</td>
                  <td className="py-2 pr-3 text-zinc-700">{formatTimestamp(entry.completedAt)}</td>
                  <td className="py-2 text-right">
                    {entry.downloadable && (
                      <button
                        type="button"
                        onClick={() => download(entry)}
                        disabled={downloading !== null}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                        {downloading === entry.id ? "Downloading…" : "Download"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
