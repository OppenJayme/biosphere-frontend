"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AvailableReportsList } from "./AvailableReportsList";
import { ExportReportModal } from "./ExportReportModal";
import { ReportOptionsPanel } from "./ReportOptionsPanel";
import {
  buildReportRequest,
  initialReportFormState,
  type ReportFormState,
  type ReportRequestBody,
} from "@/features/reports/form";
import type { ReportDefinition, ReportStorageOption } from "@/features/reports/types";

const PERIOD_KEYS = new Set(["type", "format", "period", "month", "year", "from", "to"]);

function describePeriod(body: ReportRequestBody) {
  switch (body.period) {
    case "MONTHLY": {
      const [year, month] = String(body.month).split("-").map(Number);
      return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(Date.UTC(year, month - 1, 1)),
      );
    }
    case "YEARLY":
      return String(body.year);
    case "CUSTOM":
      return `${body.from} to ${body.to}`;
    default:
      return "All records";
  }
}

function describeScope(body: ReportRequestBody) {
  const filters = Object.keys(body).filter((key) => !PERIOD_KEYS.has(key)).length;
  const period = describePeriod(body);
  return filters > 0 ? `${period} · ${filters} filter${filters === 1 ? "" : "s"}` : period;
}

export function ReportsWorkspace({
  reports,
  storageOptions,
  storageError,
}: {
  reports: ReportDefinition[];
  storageOptions: ReportStorageOption[];
  storageError: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(reports[0]);
  const [form, setForm] = useState(() => initialReportFormState(reports[0]));
  const [error, setError] = useState<string | null>(null);
  const [exportScope, setExportScope] = useState<string | null>(null);

  const update = useCallback(<K extends keyof ReportFormState>(key: K, value: ReportFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }, []);

  function selectReport(report: ReportDefinition) {
    if (report.type === selected.type) return;
    setSelected(report);
    setError(null);
    // Keep the chosen period when the new report supports it; filters reset.
    setForm((current) => {
      const fresh = initialReportFormState(report);
      return report.periods.includes(current.period)
        ? { ...fresh, period: current.period, month: current.month, year: current.year, from: current.from, to: current.to }
        : fresh;
    });
  }

  function clearFilters() {
    setForm((current) => ({
      ...initialReportFormState(selected),
      period: current.period,
      month: current.month,
      year: current.year,
      from: current.from,
      to: current.to,
    }));
    setError(null);
  }

  function openExport() {
    // Validate the period and filters first; the modal only picks the format.
    const request = buildReportRequest(selected, selected.formats[0], form);
    if (!request.ok) {
      setError(request.error);
      return;
    }
    setExportScope(describeScope(request.body));
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
      <AvailableReportsList reports={reports} selected={selected.type} onSelect={selectReport} />
      <ReportOptionsPanel
        definition={selected}
        form={form}
        update={update}
        storageOptions={storageOptions}
        storageError={storageError}
        error={error}
        onClear={clearFilters}
        onExport={openExport}
      />

      {exportScope !== null && (
        <ExportReportModal
          key={selected.type}
          definition={selected}
          scope={exportScope}
          buildRequest={(format) => buildReportRequest(selected, format, form)}
          onClose={() => setExportScope(null)}
          onGenerated={() => router.refresh()}
        />
      )}
    </div>
  );
}
