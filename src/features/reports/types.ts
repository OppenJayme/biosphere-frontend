/** Runtime contracts for the curator-only reports API (SRS §4.7). */

import { z } from "zod";

export const REPORT_TYPES = [
  "CONSOLIDATED_OPERATIONS",
  "INVENTORY",
  "INQUIRY_SUMMARY",
  "VISIT_REQUEST_SUMMARY",
  "QR_AR_EXHIBITS",
] as const;
export const REPORT_FORMATS = ["PDF", "DOCX", "CSV"] as const;
export const REPORT_PERIODS = ["MONTHLY", "YEARLY", "CUSTOM", "ALL_TIME"] as const;
export const REPORT_HISTORY_RESULTS = ["SUCCESS", "FAILED"] as const;
export const REPORT_HISTORY_PAGE_SIZES = [10, 25, 50] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type ReportFormat = (typeof REPORT_FORMATS)[number];
export type ReportPeriod = (typeof REPORT_PERIODS)[number];
export type ReportHistoryResult = (typeof REPORT_HISTORY_RESULTS)[number];
export type ReportHistoryPageSize = (typeof REPORT_HISTORY_PAGE_SIZES)[number];

export const reportDefinitionSchema = z.object({
  type: z.enum(REPORT_TYPES),
  title: z.string().min(1),
  description: z.string(),
  formats: z.array(z.enum(REPORT_FORMATS)).min(1),
  periods: z.array(z.enum(REPORT_PERIODS)).min(1),
  filters: z.array(z.string()),
  periodAppliesTo: z.string(),
});

export const reportDefinitionListSchema = z.array(reportDefinitionSchema);

export const reportHistoryItemSchema = z.object({
  id: z.uuid(),
  type: z.enum(REPORT_TYPES).nullable(),
  title: z.string().nullable(),
  format: z.enum(REPORT_FORMATS).nullable(),
  periodLabel: z.string().nullable(),
  filters: z.record(z.string(), z.unknown()),
  rowCount: z.number().int().nonnegative().nullable(),
  fileName: z.string().nullable(),
  result: z.enum(["SUCCESS", "FAILED", "DENIED"]),
  error: z.string().nullable().optional(),
  generatedBy: z.object({ id: z.uuid(), fullName: z.string().min(1) }).nullable(),
  generatedAt: z.string().min(1),
});

export const reportHistoryPageSchema = z.object({
  items: z.array(reportHistoryItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
});

export const reportSummarySchema = z.object({
  totalGenerated: z.number().int().nonnegative(),
  generatedThisMonth: z.number().int().nonnegative(),
  mostGenerated: z
    .object({
      type: z.enum(REPORT_TYPES),
      title: z.string().min(1),
      count: z.number().int().nonnegative(),
    })
    .nullable(),
  lastGenerated: z
    .object({
      type: z.enum(REPORT_TYPES),
      title: z.string().min(1),
      format: z.enum(REPORT_FORMATS),
      generatedAt: z.string().min(1),
    })
    .nullable(),
});

export type ReportDefinition = z.infer<typeof reportDefinitionSchema>;
export type ReportHistoryItem = z.infer<typeof reportHistoryItemSchema>;
export type ReportHistoryPage = z.infer<typeof reportHistoryPageSchema>;
export type ReportSummary = z.infer<typeof reportSummarySchema>;

export type ReportHistoryQuery = {
  type: ReportType | "";
  result: ReportHistoryResult | "";
  page: number;
  limit: ReportHistoryPageSize;
};

/** A storage unit offered in the Inventory location filter. */
export type ReportStorageOption = {
  id: string;
  pathLabel: string;
  archived: boolean;
};

export const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  PDF: "PDF",
  DOCX: "Word document (.docx)",
  CSV: "CSV",
};

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  CUSTOM: "Custom range",
  ALL_TIME: "All records",
};

export const SPECIMEN_STATUS_OPTIONS = [
  ["UNCATALOGED", "Uncataloged"],
  ["CATALOGED", "Cataloged"],
  ["ARCHIVED", "Archived"],
] as const;

export const INQUIRY_STATUS_OPTIONS = [
  ["PENDING", "Pending"],
  ["REVIEWED", "Reviewed"],
  ["TURNED_TO_VISIT_REQUEST", "Turned to visit request"],
  ["CLOSED", "Closed"],
] as const;

export const VISIT_STATUS_OPTIONS = [
  ["PENDING", "Pending"],
  ["APPROVED_BY_CURATOR", "Approved by curator"],
  ["SUBMITTED_FOR_CAMPUS_ENTRY", "Submitted for campus entry"],
  ["DECLINED", "Declined"],
  ["CANCELLED", "Cancelled"],
  ["COMPLETED", "Completed"],
] as const;

export const EXHIBIT_STATUS_OPTIONS = [
  ["PUBLISHED", "Published"],
  ["UNPUBLISHED", "Unpublished"],
  ["DISABLED", "Disabled"],
] as const;

/** Labels for filter keys stored in the report history. */
export const REPORT_FILTER_LABELS: Record<string, string> = {
  specimenStatus: "Status",
  category: "Category",
  kingdom: "Kingdom",
  phylum: "Phylum",
  taxonClass: "Class",
  taxonOrder: "Order",
  family: "Family",
  genus: "Genus",
  species: "Species",
  conditionClass: "Condition",
  storageUnitId: "Storage location",
  includeDescendantUnits: "Include sub-locations",
  publicDisplay: "Public display",
  inquiryStatus: "Status",
  inquiryType: "Inquiry type",
  visitStatus: "Status",
  exhibitStatus: "Status",
  arEnabled: "AR enabled",
  remarks: "Remarks",
};
