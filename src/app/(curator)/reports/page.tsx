/** Curator Reports page (SRS §4.7, Figures 24–27) backed by the reports API. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReportHistoryTable } from "@/components/reports/ReportHistoryTable";
import { ReportsWorkspace } from "@/components/reports/ReportsWorkspace";
import { StatCard } from "@/components/ui/StatCard";
import {
  getReportSummary,
  listReportDefinitions,
  listReportHistory,
  listReportStorageOptions,
} from "@/features/reports/api";
import { formatReportTimestamp } from "@/features/reports/history";
import { parseReportHistoryQuery, reportHistoryHref } from "@/features/reports/query";
import { REPORT_FORMAT_LABELS, type ReportSummary } from "@/features/reports/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { PageHeader } from "@/components/curator/PageHeader";

export const metadata: Metadata = {
  title: "Reports",
};

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function loadError(reason: unknown, subject: string) {
  if (reason instanceof ApiError && reason.status === 403) {
    return "Only active curator accounts can use reports.";
  }
  return `Check the backend connection and try again. No sample ${subject} are shown.`;
}

const LAST_DATE = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });
const LAST_TIME = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" });

function statCards(summary: ReportSummary | null) {
  const last = summary?.lastGenerated;
  const lastAt = last ? new Date(last.generatedAt) : null;
  const validLast = lastAt && !Number.isNaN(lastAt.valueOf()) ? lastAt : null;
  return [
    {
      label: "Reports Generated",
      value: summary ? summary.totalGenerated.toLocaleString() : "—",
      note: summary ? "All time" : "Unavailable",
      tone: "neutral",
      icon: "chart",
    },
    {
      label: "Most Generated",
      // The count is the big number; the report name goes underneath so long titles never truncate.
      value: summary?.mostGenerated ? summary.mostGenerated.count.toLocaleString() : "0",
      note: summary?.mostGenerated?.title ?? "None yet",
      tone: "neutral",
      icon: "table",
    },
    {
      label: "Last Generated",
      value: validLast ? LAST_DATE.format(validLast) : last ? formatReportTimestamp(last.generatedAt) : "None yet",
      note: last ? `${validLast ? `${LAST_TIME.format(validLast)} · ` : ""}${REPORT_FORMAT_LABELS[last.format]}` : "—",
      tone: "neutral",
      icon: "calendar",
    },
    {
      label: "Exports This Month",
      value: summary ? summary.generatedThisMonth.toLocaleString() : "—",
      note: "Excel workbooks",
      tone: summary && summary.generatedThisMonth > 0 ? "positive" : "neutral",
      icon: "export",
    },
  ] as const;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  if (!(await verifySession())) redirect("/login?from=/reports");

  const historyQuery = parseReportHistoryQuery(await searchParams);
  const [definitions, summary, history, storage] = await Promise.allSettled([
    listReportDefinitions(),
    getReportSummary(),
    listReportHistory(historyQuery),
    listReportStorageOptions(),
  ]);

  for (const result of [definitions, summary, history, storage]) {
    if (result.status === "rejected" && result.reason instanceof ApiError && result.reason.status === 401) {
      redirect("/login?from=/reports");
    }
  }

  if (history.status === "fulfilled") {
    const lastPage = Math.max(1, Math.ceil(history.value.total / history.value.limit));
    if (historyQuery.page > lastPage) redirect(reportHistoryHref(historyQuery, lastPage));
  }

  const reports = definitions.status === "fulfilled" ? definitions.value : [];
  const storageOptions = storage.status === "fulfilled" ? storage.value : [];
  const storageLabels = new Map(storageOptions.map((option) => [option.id, option.pathLabel]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Generate and export the museum's operational reports. Reports with visitor details or storage locations are confidential and for authorized staff only."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards(summary.status === "fulfilled" ? summary.value : null).map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {reports.length > 0 ? (
        <ReportsWorkspace
          reports={reports}
          storageOptions={storageOptions}
          storageError={storage.status === "rejected"}
        />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">Reports could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            {definitions.status === "rejected"
              ? loadError(definitions.reason, "reports")
              : "The backend did not return any report types."}
          </p>
        </div>
      )}

      <ReportHistoryTable
        history={history.status === "fulfilled" ? history.value : null}
        query={historyQuery}
        reports={reports}
        storageLabels={storageLabels}
        errorMessage={history.status === "rejected" ? loadError(history.reason, "history entries") : undefined}
      />
    </div>
  );
}
