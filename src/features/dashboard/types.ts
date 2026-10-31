import { z } from "zod";

export type SectionResult<T> = { status: "ok"; data: T } | { status: "error" };

const specimenStatusSchema = z.enum(["UNCATALOGED", "CATALOGED", "ARCHIVED"]);

const dashboardSpecimenRowSchema = z.object({
  id: z.uuid(),
  accessionNumber: z.string().nullable(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  specimenCategory: z.string().nullable(),
  status: specimenStatusSchema,
  publicDisplay: z.boolean(),
  storageLocation: z.string().nullable(),
  condition: z.string().nullable(),
  updatedAt: z.string().min(1),
});

/** Contract of the backend's GET /dashboard/summary (counts computed in the database). */
export const dashboardSummarySchema = z.object({
  generatedAt: z.string().min(1),
  specimens: z.object({
    total: z.number().int().nonnegative(),
    byStatus: z.object({
      UNCATALOGED: z.number().int().nonnegative(),
      CATALOGED: z.number().int().nonnegative(),
      ARCHIVED: z.number().int().nonnegative(),
    }),
    addedThisMonth: z.number().int().nonnegative(),
    possibleDuplicates: z.number().int().nonnegative(),
    byCategory: z.array(z.object({ category: z.string(), count: z.number().int().nonnegative() })),
    addedByMonth: z.array(
      z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), count: z.number().int().nonnegative() }),
    ),
  }),
  submissions: z.object({
    pendingInquiries: z.number().int().nonnegative(),
    pendingVisitRequests: z.number().int().nonnegative(),
  }),
  exhibits: z.object({
    total: z.number().int().nonnegative(),
    live: z.number().int().nonnegative(),
    publishedUnavailable: z.number().int().nonnegative(),
    unpublished: z.number().int().nonnegative(),
    disabled: z.number().int().nonnegative(),
    pending: z.array(z.object({ id: z.uuid(), publicSlug: z.string() })),
  }),
  catalogingQueue: z.array(dashboardSpecimenRowSchema),
  recentSpecimens: z.array(dashboardSpecimenRowSchema),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardSpecimenRow = z.infer<typeof dashboardSpecimenRowSchema>;

export type DashboardStatTone = "positive" | "warning" | "danger" | "neutral";

export type DashboardStat = {
  key: string;
  label: string;
  value: string;
  note: string;
  tone: DashboardStatTone;
  icon: "specimen" | "draft" | "mail" | "lock" | "chart" | "log";
  /** The filtered list this card opens (SRS §4.3.2). */
  href: string;
};

export type CollectionTypeSegment = {
  label: string;
  value: number;
  pct: number;
  color: string;
};

export type CollectionByType = {
  segments: CollectionTypeSegment[];
  total: number;
};

export type CatalogingTrendPoint = {
  month: string;
  value: number;
};

export type QueueItem = {
  id: string;
  accessionNo: string;
  species: string;
  category: string | null;
};

export type SpecimenCatalogStatus = "Uncataloged" | "Cataloged" | "Archived";
export type SpecimenPublicStatus = "Public" | "Restricted";

export type RecentSpecimenRow = {
  id: string;
  accessionNo: string;
  commonName: string;
  category: string | null;
  storageLocation: string | null;
  condition: string | null;
  catalogStatus: SpecimenCatalogStatus;
  publicStatus: SpecimenPublicStatus;
  lastUpdated: string;
};

export type StorageOverviewItem = {
  id: string;
  location: string;
  unitType: string;
  storageType: string;
  capacity: number | null;
};

export type ActivityItem = {
  id: string;
  /** Plain-language sentence from describeAuditEntry, e.g. "Maria Santos archived the exhibit." */
  summary: string;
  timestamp: string;
  module: string;
  failed: boolean;
};

/** One line of the dashboard's "Needs your attention" list. */
export type AttentionItem = {
  key: string;
  count: number;
  /** Full sentence including the count, e.g. "5 general inquiries are waiting for a reply". */
  text: string;
  action: string;
  href: string;
};

export type QrReadinessPending = {
  id: string;
  publicSlug: string;
};

export type QrReadiness = {
  total: number;
  /** Published with an eligible specimen, so the QR page actually resolves. */
  live: number;
  /** Published, but the specimen is no longer cataloged/public, so the page 404s. */
  publishedUnavailable: number;
  unpublished: number;
  disabled: number;
  pending: QrReadinessPending[];
};

export type DashboardData = {
  stats: SectionResult<DashboardStat[]>;
  attention: SectionResult<AttentionItem[]>;
  collectionByType: SectionResult<CollectionByType>;
  catalogingTrend: SectionResult<CatalogingTrendPoint[]>;
  catalogingQueue: SectionResult<QueueItem[]>;
  recentSpecimens: SectionResult<RecentSpecimenRow[]>;
  storageOverview: SectionResult<StorageOverviewItem[]>;
  recentActivity: SectionResult<ActivityItem[]>;
  qrReadiness: SectionResult<QrReadiness>;
};
