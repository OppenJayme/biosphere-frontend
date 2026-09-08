"use client";

import { useState } from "react";
import { AvailableReportsList } from "./AvailableReportsList";
import { ReportFiltersPanel } from "./ReportFiltersPanel";
import { ReportHistoryTable } from "./ReportHistoryTable";
import { ExportReportModal, type ExportTarget } from "./ExportReportModal";
import type { ReportDefinition, ReportHistoryEntry } from "@/lib/dummy-data/reports";

export function ReportsWorkspace({
  reports,
  history,
}: {
  reports: ReportDefinition[];
  history: ReportHistoryEntry[];
}) {
  const [target, setTarget] = useState<ExportTarget | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <AvailableReportsList
          reports={reports}
          onSelect={(report) =>
            setTarget({ title: report.title, subtitle: report.dateRangeLabel, recordCount: report.recordCount })
          }
        />
        <ReportFiltersPanel />
      </div>

      <ReportHistoryTable
        entries={history}
        onDownload={(entry) =>
          setTarget({ title: entry.reportName, subtitle: entry.parameters, recordCount: entry.records })
        }
      />

      {target && <ExportReportModal key={target.title + target.subtitle} target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
