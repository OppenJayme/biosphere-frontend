// DUMMY DATA — placeholder for the curator dashboard UI.
// Every export here stands in for a real backend response. Once the NestJS API is
// up, replace these with calls through `features/dashboard/api.ts` -> `apiFetch`
// (see docs/frontend-architecture.md) and delete this file.

export const CURATOR = {
  name: "Dr. Sheldon",
  role: "Curator",
  initials: "DS",
};

export const SYNC_STATUS = {
  lastSyncLabel: "Last sync 5 min ago",
  offlineReady: true,
};

export const STATS = [
  {
    label: "Total Specimens",
    value: "24,318",
    note: "+ 312 this month",
    tone: "positive",
    icon: "specimen",
  },
  {
    label: "Draft / Incomplete",
    value: "186",
    note: "Awaiting in Catalog",
    tone: "positive",
    icon: "specimen",
  },
  {
    label: "Pending Request",
    value: "21",
    note: "Visit, Meeting Donations",
    tone: "warning",
    icon: "mail",
  },
  {
    label: "Possible Duplicates",
    value: "12",
    note: "Requires Verification",
    tone: "danger",
    icon: "lock",
  },
] as const;

export const COLLECTION_BY_TYPE = [
  { label: "Insects", value: 9842, pct: 40.5, color: "#c0392b" },
  { label: "Reptiles", value: 4256, pct: 17.5, color: "#c4922c" },
  { label: "Birds", value: 4102, pct: 16.9, color: "#2f6fa8" },
  { label: "Mammals", value: 2901, pct: 11.9, color: "#2c5c42" },
  { label: "Marine", value: 2191, pct: 9.0, color: "#1f3a5f" },
  { label: "Botany", value: 702, pct: 2.9, color: "#4a8f7b" },
  { label: "Others", value: 324, pct: 1.3, color: "#9aa39a" },
] as const;

export const COLLECTION_TOTAL = COLLECTION_BY_TYPE.reduce((sum, s) => sum + s.value, 0);

export const CATALOGING_TREND = [
  { month: "Jun", value: 1.6 },
  { month: "Jul", value: 1.9 },
  { month: "Aug", value: 2.0 },
  { month: "Sep", value: 1.7 },
  { month: "Oct", value: 2.3 },
  { month: "Nov", value: 2.5 },
  { month: "Dec", value: 2.3 },
  { month: "Jan", value: 2.6 },
  { month: "Feb", value: 3.0 },
  { month: "Mar", value: 3.8 },
  { month: "Apr", value: 3.0 },
  { month: "May", value: 2.6 },
] as const;

export const CATALOGING_QUEUE = [
  {
    accessionNo: "USCBM-IN-2025-1387",
    species: "Papilio zalmoxis",
    group: "insect",
    status: "Draft",
  },
  {
    accessionNo: "USCBM-REP-2025-0901",
    species: "Gopherus berlandieri",
    group: "reptile",
    status: "Missing Fields",
  },
  {
    accessionNo: "USCBM-BOT-2025-0456",
    species: "Diospyros texana",
    group: "botany",
    status: "Needs Review",
  },
  {
    accessionNo: "USCBM-MAM-2025-0287",
    species: "Tamandua mexicana",
    group: "mammal",
    status: "Possible Duplicate",
  },
  {
    accessionNo: "USCBM-MAR-2025-0312",
    species: "Cypraea tigris",
    group: "marine",
    status: "Needs Review",
  },
] as const;

export const QUICK_ACTIONS = [
  { label: "Add new specimen", icon: "plus", href: "/specimens/new" },
  { label: "Continue Cataloging", icon: "pencil", href: "/cataloging" },
  { label: "Generate Report", icon: "chart", href: "/reports" },
  { label: "Create Exhibit", icon: "grid", href: "/exhibits/new" },
] as const;

export const RECENT_SPECIMENS = [
  {
    accessionNo: "USCBM-REP-2025-0178",
    commonName: "Python",
    group: "reptile",
    storageLocation: "Herpetology Room 2",
    condition: "Good",
    catalogStatus: "Cataloged",
    publicStatus: "Public",
    lastUpdated: "May 21, 2025",
  },
  {
    accessionNo: "USCBM-IN-2025-1402",
    commonName: "Golden Birdwing",
    group: "insect",
    storageLocation: "Entomology Cabinet 004",
    condition: "Good",
    catalogStatus: "Cataloged",
    publicStatus: "Public",
    lastUpdated: "May 21, 2025",
  },
  {
    accessionNo: "USCBM-MAM-2025-0291",
    commonName: "Philippine Deer",
    group: "mammal",
    storageLocation: "Mammalogy Cabinet 002",
    condition: "Fair",
    catalogStatus: "Draft",
    publicStatus: "Restricted",
    lastUpdated: "May 20, 2025",
  },
  {
    accessionNo: "USCBM-MAR-2025-0315",
    commonName: "Tiger Cowrie",
    group: "marine",
    storageLocation: "Marine Glass Display 001",
    condition: "Good",
    catalogStatus: "Cataloged",
    publicStatus: "Public",
    lastUpdated: "May 20, 2025",
  },
  {
    accessionNo: "USCBM-BOT-2025-0460",
    commonName: "Texas Persimmon",
    group: "botany",
    storageLocation: "Botany Cabinet 011",
    condition: "Good",
    catalogStatus: "Cataloged",
    publicStatus: "Public",
    lastUpdated: "May 19, 2025",
  },
  {
    accessionNo: "USCBM-REP-2025-0179",
    commonName: "Texas Tortoise",
    group: "reptile",
    storageLocation: "Herpetology Room 2",
    condition: "Good",
    catalogStatus: "Archived",
    publicStatus: "Restricted",
    lastUpdated: "May 19, 2025",
  },
  {
    accessionNo: "USCBM-IN-2025-1405",
    commonName: "Atlas Moth",
    group: "insect",
    storageLocation: "Entomology Cabinet 004",
    condition: "Fair",
    catalogStatus: "Cataloged",
    publicStatus: "Public",
    lastUpdated: "May 18, 2025",
  },
] as const;

export const STORAGE_HEALTH = [
  { location: "Herpetology Cabinet 001", capacityPct: 85, alerts: 2 },
  { location: "Entomology Cabinet 004", capacityPct: 78, alerts: 1 },
  { location: "Marine Glass Display 001", capacityPct: 26, alerts: 0 },
  { location: "Mammalogy Cabinet 002", capacityPct: 50, alerts: 3 },
  { location: "Mammalogy Cabinet 023", capacityPct: 92, alerts: 1 },
  { location: "Herpetology Cabinet 013", capacityPct: 43, alerts: 2 },
] as const;

export const RECENT_ACTIVITY = [
  {
    action: "Taxonomy Completed",
    species: "Diospyros texana",
    by: "Dr. Sarah Reyes",
    timestamp: "May 22, 2025 · 9:42 AM",
    icon: "bug",
    tone: "forest",
  },
  {
    action: "Specimen Cataloged",
    species: "Cypraea tigris",
    by: "Dr. Sarah Reyes",
    timestamp: "May 22, 2025 · 9:10 AM",
    icon: "fish",
    tone: "blue",
  },
  {
    action: "Location Updated",
    species: "Gopherus berlandieri",
    by: "Dr. Sarah Reyes",
    timestamp: "May 21, 2025 · 4:55 PM",
    icon: "leaf",
    tone: "red",
  },
  {
    action: "Image Added",
    species: "Tamandua mexicana",
    by: "Dr. Sarah Reyes",
    timestamp: "May 21, 2025 · 2:20 PM",
    icon: "sparkle",
    tone: "purple",
  },
  {
    action: "Condition Reviewed",
    species: "Papilio zalmoxis",
    by: "Dr. Sarah Reyes",
    timestamp: "May 21, 2025 · 11:05 AM",
    icon: "mail",
    tone: "gold",
  },
] as const;

export const PUBLIC_QR_READINESS = [
  { label: "Ready for QR", value: "31", note: "Needs QR generated" },
  { label: "QR Generated", value: "8,742", note: "Publicly accessible" },
  { label: "Private", value: "15,545", note: "Not for public view" },
] as const;
