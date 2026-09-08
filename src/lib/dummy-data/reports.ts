// DUMMY DATA — placeholder for the Reports page UI. Stands in for real
// backend responses. Once the NestJS API is up, replace with calls through
// `features/reports/api.ts` -> `apiFetch` (see docs/frontend-architecture.md)
// and delete this file.

export const REPORT_STATS = [
  { label: "Reports Generated", value: "128", note: "+18 this month", tone: "positive", icon: "chart" },
  { label: "Most Generated", value: "Inventory by Location", note: "32 times", tone: "neutral", icon: "table" },
  { label: "Last Generated", value: "May 22, 2025", note: "10:30 AM", tone: "neutral", icon: "calendar" },
  { label: "Exports This Month", value: "96", note: "PDF · Excel · CSV", tone: "neutral", icon: "export" },
] as const;

export type ReportKind = "inventory-type" | "inventory-location" | "inquiry-summary" | "visit-summary" | "audit-log";

export type ReportDefinition = {
  id: ReportKind;
  title: string;
  description: string;
  dateRangeLabel: string;
  recordCount: number;
};

export const AVAILABLE_REPORTS: ReportDefinition[] = [
  {
    id: "inventory-type",
    title: "Inventory by Type",
    description: "Summary of specimens grouped by collection type and category.",
    dateRangeLabel: "May 1 – May 22, 2025",
    recordCount: 8742,
  },
  {
    id: "inventory-location",
    title: "Inventory by Location",
    description: "Summary of specimens by storage location (room, cabinet, drawer, etc.).",
    dateRangeLabel: "May 1 – May 22, 2025",
    recordCount: 2431,
  },
  {
    id: "inquiry-summary",
    title: "Inquiry Summary",
    description: "Summary of general inquiries and their status.",
    dateRangeLabel: "May 1 – May 22, 2025",
    recordCount: 132,
  },
  {
    id: "visit-summary",
    title: "Visit Request Summary",
    description: "Summary of visit requests within a date range and their status.",
    dateRangeLabel: "May 1 – May 22, 2025",
    recordCount: 48,
  },
  {
    id: "audit-log",
    title: "Audit Log Report",
    description: "Summary of user activities and system logs.",
    dateRangeLabel: "May 1 – May 22, 2025",
    recordCount: 8742,
  },
];

export type FileType = "PDF" | "Excel" | "CSV";

export type ReportHistoryEntry = {
  id: string;
  reportName: string;
  parameters: string;
  generatedBy: string;
  generatedOn: string;
  fileType: FileType;
  records: number;
};

export const REPORT_HISTORY: ReportHistoryEntry[] = [
  {
    id: "rep-1",
    reportName: "Inventory by Location",
    parameters: "All Locations",
    generatedBy: "Dr. Sheldon",
    generatedOn: "May 22, 2025 10:30 AM",
    fileType: "PDF",
    records: 2431,
  },
  {
    id: "rep-2",
    reportName: "Specimen List",
    parameters: "Collection Type: Insects",
    generatedBy: "Dr. Sheldon",
    generatedOn: "May 21, 2025 3:15 PM",
    fileType: "Excel",
    records: 6782,
  },
  {
    id: "rep-3",
    reportName: "Condition Summary",
    parameters: "All Conditions",
    generatedBy: "Dr. Sheldon",
    generatedOn: "May 20, 2025 11:05 AM",
    fileType: "PDF",
    records: 2431,
  },
  {
    id: "rep-4",
    reportName: "Visit Request Summary",
    parameters: "Date Range: May 1 - May 20, 2025",
    generatedBy: "Dr. Sheldon",
    generatedOn: "May 20, 2025 9:20 AM",
    fileType: "Excel",
    records: 54,
  },
  {
    id: "rep-5",
    reportName: "Activity Log Report",
    parameters: "All Users",
    generatedBy: "Dr. Sheldon",
    generatedOn: "May 19, 2025 5:45 PM",
    fileType: "CSV",
    records: 1245,
  },
];
