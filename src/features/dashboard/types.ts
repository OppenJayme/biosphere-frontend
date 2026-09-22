export type SectionResult<T> = { status: "ok"; data: T } | { status: "error" };

export type DashboardStatTone = "positive" | "warning" | "danger" | "neutral";

export type DashboardStat = {
  key: string;
  label: string;
  value: string;
  note: string;
  tone: DashboardStatTone;
  icon: "specimen" | "draft" | "mail" | "lock";
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

export type StorageHealthItem = {
  id: string;
  location: string;
  capacityPct: number | null;
  alerts: number;
};

export type ActivityItem = {
  id: string;
  action: string;
  detail: string;
  by: string;
  timestamp: string;
  module: string;
  failed: boolean;
};

export type DashboardData = {
  stats: SectionResult<DashboardStat[]>;
  collectionByType: SectionResult<CollectionByType>;
  catalogingTrend: SectionResult<CatalogingTrendPoint[]>;
  catalogingQueue: SectionResult<QueueItem[]>;
  recentSpecimens: SectionResult<RecentSpecimenRow[]>;
  storageHealth: SectionResult<StorageHealthItem[]>;
  recentActivity: SectionResult<ActivityItem[]>;
};
