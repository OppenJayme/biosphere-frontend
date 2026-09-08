import { GridIcon, MapPinIcon, MailIcon, CalendarIcon, ClipboardIcon, ChevronRightIcon } from "@/components/icons";
import type { ReportDefinition, ReportKind } from "@/lib/dummy-data/reports";

const REPORT_ICONS: Record<ReportKind, typeof GridIcon> = {
  "inventory-type": GridIcon,
  "inventory-location": MapPinIcon,
  "inquiry-summary": MailIcon,
  "visit-summary": CalendarIcon,
  "audit-log": ClipboardIcon,
};

export function AvailableReportsList({
  reports,
  onSelect,
}: {
  reports: ReportDefinition[];
  onSelect: (report: ReportDefinition) => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-900">Available Reports</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {reports.map((report) => {
          const Icon = REPORT_ICONS[report.id];
          return (
            <button
              key={report.id}
              type="button"
              onClick={() => onSelect(report)}
              className="flex items-start gap-3 rounded-lg border border-black/10 p-4 text-left transition-colors hover:bg-sage-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{report.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{report.description}</p>
              </div>
              <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
