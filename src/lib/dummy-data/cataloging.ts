// DUMMY DATA — placeholder for the Cataloging page UI.
// Stands in for real backend responses. Once the NestJS API is up, replace with
// calls through `features/specimens/api.ts` (cataloging is a specimen workflow) ->
// `apiFetch` (see docs/frontend-architecture.md) and delete this file.

export const CATALOGING_STATS = [
  { label: "Pending Catalog", value: "132", note: "+ 16 vs yesterday", tone: "positive", icon: "specimen" },
  { label: "Pending Duplicates", value: "12", note: "6.45% of total", tone: "positive", icon: "specimen" },
  { label: "Missing QR / Public Info", value: "12", note: "16.67% of total", tone: "positive", icon: "specimen" },
  { label: "Completed Today", value: "21", note: "+4 vs yesterday", tone: "positive", icon: "shield" },
  { label: "Upcoming Visits", value: "12", note: "+3 vs yesterday", tone: "danger", icon: "lock" },
] as const;

export type QueueStatus = "Draft" | "Missing Fields" | "Needs Review" | "Possible Duplicate" | "Ready for QR";

export type QueueItem = {
  accessionNo: string;
  commonName: string;
  scientificName: string;
  group: "insect" | "reptile" | "mammal" | "marine" | "botany";
  status: QueueStatus;
};

export const CATALOGING_QUEUE: QueueItem[] = [
  { accessionNo: "USCBM-IN-2025-1387", commonName: "Anise Swallowtail", scientificName: "Papilio zalicaon", group: "insect", status: "Draft" },
  { accessionNo: "USCBM-REP-2025-0901", commonName: "Texas Tortoise", scientificName: "Gopherus berlandieri", group: "reptile", status: "Missing Fields" },
  { accessionNo: "USCBM-BOT-2025-0456", commonName: "Texas Persimmon", scientificName: "Diospyros texana", group: "botany", status: "Possible Duplicate" },
  { accessionNo: "USCBM-MAM-2025-0287", commonName: "Tamandua", scientificName: "Tamandua mexicana", group: "mammal", status: "Possible Duplicate" },
  { accessionNo: "USCBM-MAR-2025-0312", commonName: "Tiger Cowrie", scientificName: "Cypraea tigris", group: "marine", status: "Possible Duplicate" },
  { accessionNo: "USCBM-HERP-2025-001", commonName: "Ball Python", scientificName: "Python regius", group: "reptile", status: "Needs Review" },
  { accessionNo: "USCBM-IN-2025-1402", commonName: "Golden Birdwing", scientificName: "Troides rhadamantus", group: "insect", status: "Draft" },
  { accessionNo: "USCBM-REP-2025-0179", commonName: "Texas Tortoise", scientificName: "Gopherus berlandieri", group: "reptile", status: "Ready for QR" },
  { accessionNo: "USCBM-BOT-2025-0460", commonName: "Texas Persimmon", scientificName: "Diospyros texana", group: "botany", status: "Missing Fields" },
];

export type CatalogEntryDetail = {
  accessionNo: string;
  collectionName: string;
  commonName: string;
  scientificName: string;
  specimenCategory: string;
  gender: string;
  quantity: string;
  conditionClass: string;
  collector: string;
  donor: string;
  collectionDate: string;
  collectionLocation: string;
  preservationMethod: string;
  preservationType: string;
  remarks: string;
  taxonomy: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
    conservationStatus: string;
    habitat: string;
    ecologicalRole: string;
  };
  tags: string[];
  storageUnit: string;
  storageLocation: string;
  condition: "Good" | "Fair" | "Poor";
  checklist: { label: string; done: boolean }[];
  duplicates: { accessionNo: string; commonName: string; similarityPct: number; group: QueueItem["group"] }[];
  qrHabitat: string;
  qrEcologicalRole: string;
  recentActivity: { timestamp: string; description: string; by: string }[];
  groupSize: number;
};

// Keyed by accessionNo — the entry shown in the middle/right panes when that queue item is selected.
export const CATALOG_ENTRIES: Record<string, CatalogEntryDetail> = {
  "USCBM-HERP-2025-001": {
    accessionNo: "USCBM-HERP-2025-001",
    collectionName: "Herpetology",
    commonName: "Ball Python",
    scientificName: "Python regius",
    specimenCategory: "Snakes",
    gender: "Male",
    quantity: "10",
    conditionClass: "Class A",
    collector: "John Doe",
    donor: "Jane Doe",
    collectionDate: "2025-05-12",
    collectionLocation: "University of San Carlos",
    preservationMethod: "Alcohol (70%)",
    preservationType: "Wet Preserved",
    remarks:
      "The condition is good upon arrival but needs a little bit of cleaning, some holes are spotted in the scales",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Reptilia",
      order: "Squamata",
      family: "Pythonidae",
      genus: "Python",
      species: "regius",
      conservationStatus: "Near Threatened",
      habitat: "Grassland",
      ecologicalRole: "Mesopredator",
    },
    tags: ["reptile", "python", "pet", "African Species"],
    storageUnit: "Drawer 01",
    storageLocation: "Room 1, Cabinet 4, Shelf A, Jar 12",
    condition: "Good",
    checklist: [
      { label: "Basic Information Completed", done: true },
      { label: "Taxonomy Completed", done: true },
      { label: "Storage Assigned", done: true },
      { label: "Preservation Recorded", done: true },
    ],
    duplicates: [
      { accessionNo: "USCBM-MAM-2025-0287", commonName: "Tamandua Mexican", similarityPct: 87, group: "mammal" },
      { accessionNo: "USCBM-MAM-2025-0287", commonName: "Tamandua Mexican", similarityPct: 87, group: "mammal" },
    ],
    qrHabitat: "Terrestrial lowland forest",
    qrEcologicalRole: "Predator / Mesopredator",
    recentActivity: [
      { timestamp: "May 22, 2025 · 10:30 AM", description: "Catalog entry created by Dr. Sarah Reyes", by: "Dr. Sarah Reyes" },
      { timestamp: "May 22, 2025 · 10:30 AM", description: "Basic info updated by Dr. Sarah Reyes", by: "Dr. Sarah Reyes" },
    ],
    groupSize: 10,
  },
};

export const DEFAULT_CATALOG_ENTRY = CATALOG_ENTRIES["USCBM-HERP-2025-001"];

export type GroupMember = {
  code: string;
  currentClass: string;
};

export const SPECIMEN_GROUP_MEMBERS: GroupMember[] = Array.from({ length: 10 }, (_, i) => ({
  code: `SPC-${String(i + 1).padStart(3, "0")}`,
  currentClass: "Class A",
}));

export const CONDITION_CLASS_OPTIONS = ["No Change", "Class A", "Class B", "Class C", "Needs Attention"] as const;

export const STORAGE_TREE = {
  current: "Storage Room > Cabinet A > Drawer 01",
  target: "Main Gallery > CAB-001 > Drawer 01",
};

export type CatalogingActivityRow = {
  accessionNo: string;
  specimen: string;
  updatedBy: string;
  lastUpdated: string;
  changes: string;
  status: "Cataloged" | "Draft" | "Needs Review";
};

export const RECENT_CATALOGING_ACTIVITY: CatalogingActivityRow[] = [
  { accessionNo: "USCBM-REP-2025-0178", specimen: "Hercules Beetle (Dynastes hercules)", updatedBy: "R. de la Cruz", lastUpdated: "May 22, 2025 10:15 AM", changes: "Added habitat, tags", status: "Cataloged" },
  { accessionNo: "USCBM-IN-2025-1402", specimen: "Golden Birdwing (Troides rhadamantus)", updatedBy: "R. de la Cruz", lastUpdated: "May 22, 2025 9:40 AM", changes: "Updated storage location", status: "Cataloged" },
  { accessionNo: "USCBM-MAM-2025-0291", specimen: "Philippine Deer (Rusa marianna)", updatedBy: "Dr. Sarah Reyes", lastUpdated: "May 21, 2025 4:10 PM", changes: "Condition reviewed", status: "Draft" },
  { accessionNo: "USCBM-MAR-2025-0315", specimen: "Tiger Cowrie (Cypraea tigris)", updatedBy: "Dr. Sarah Reyes", lastUpdated: "May 21, 2025 2:05 PM", changes: "Taxonomy completed", status: "Cataloged" },
  { accessionNo: "USCBM-BOT-2025-0460", specimen: "Texas Persimmon (Diospyros texana)", updatedBy: "R. de la Cruz", lastUpdated: "May 20, 2025 11:30 AM", changes: "Flagged missing fields", status: "Needs Review" },
  { accessionNo: "USCBM-REP-2025-0179", specimen: "Texas Tortoise (Gopherus berlandieri)", updatedBy: "Dr. Sarah Reyes", lastUpdated: "May 20, 2025 9:00 AM", changes: "QR generated", status: "Cataloged" },
];
