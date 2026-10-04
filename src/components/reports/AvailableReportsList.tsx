import {
  ArchiveIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckIcon,
  MailIcon,
  QrCodeIcon,
} from "@/components/icons";
import type { ReportDefinition, ReportType } from "@/features/reports/types";

const REPORT_ICONS: Record<ReportType, typeof ChartBarIcon> = {
  CONSOLIDATED_OPERATIONS: ChartBarIcon,
  INVENTORY: ArchiveIcon,
  INQUIRY_SUMMARY: MailIcon,
  VISIT_REQUEST_SUMMARY: CalendarIcon,
  QR_AR_EXHIBITS: QrCodeIcon,
};

const FORMAT_NAMES = { PDF: "PDF", DOCX: "Word", CSV: "CSV" } as const;

export function AvailableReportsList({
  reports,
  selected,
  onSelect,
}: {
  reports: ReportDefinition[];
  selected: ReportType;
  onSelect: (report: ReportDefinition) => void;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-900">Available Reports</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Report type">
        {reports.map((report) => {
          const Icon = REPORT_ICONS[report.type];
          const active = report.type === selected;
          return (
            <button
              key={report.type}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(report)}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                active ? "border-forest-700 bg-sage-50" : "border-black/10 hover:bg-sage-50"
              } ${report.type === "CONSOLIDATED_OPERATIONS" ? "sm:col-span-2" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900">{report.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{report.description}</span>
                <span className="mt-2 block text-[11px] font-medium text-zinc-500">
                  {report.formats.map((format) => FORMAT_NAMES[format]).join(" · ")}
                </span>
              </span>
              {active && (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
