// DUMMY DATA — placeholder for the Specimens page UI.
// Stands in for real backend responses. Once the NestJS API is up, replace with
// calls through `features/specimens/api.ts` -> `apiFetch` (see
// docs/frontend-architecture.md) and delete this file.

export const SPECIMEN_FILTERS = {
  collectionType: ["Collection Type", "All", "Entomology", "Herpetology", "Mammalogy", "Marine Biology", "Botany"],
  status: ["Status", "All", "Cataloged", "Draft", "Needs Review", "Archived"],
  condition: ["Condition", "All", "Good", "Fair", "Poor"],
  storageLocation: [
    "Storage Location",
    "All",
    "Herpetology Room 1",
    "Herpetology Room 2",
    "Entomology Cabinet 004",
    "Mammalogy Cabinet 002",
    "Marine Glass Display 001",
    "Botany Cabinet 011",
  ],
  dateAdded: ["Date Added", "All time", "Last 7 days", "Last 30 days", "Last 90 days", "This year"],
} as const;

export type SpecimenGroup = "reptile" | "insect" | "mammal" | "marine" | "botany";
export type Condition = "Good" | "Fair" | "Poor";
export type CatalogStatus = "Cataloged" | "Draft" | "Needs Review" | "Archived";

export type ActivityEntry = {
  timestamp: string;
  description: string;
  by: string;
};

export type Specimen = {
  accessionNo: string;
  group: SpecimenGroup;
  commonName: string;
  scientificName: string;
  family: string;
  order: string;
  collectionType: string;
  dateCollection: string;
  collector: string;
  donor: string;
  storageLocation: string;
  condition: Condition;
  preservation: string;
  catalogStatus: CatalogStatus;
  lastUpdated: string;
  tags: string[];
  recentActivity: ActivityEntry[];
};

export const SPECIMENS: Specimen[] = [
  {
    accessionNo: "USCBM-REP-2025-001",
    group: "reptile",
    commonName: "Ball Python",
    scientificName: "Python regius",
    family: "Pythonidae",
    order: "Squamata",
    collectionType: "Zoology - Herpetology",
    dateCollection: "May 12, 2025",
    collector: "A. Dela Cruz",
    donor: "Jane Doe",
    storageLocation: "Herpetology Room 1 - Shelf A",
    condition: "Good",
    preservation: "Alcohol (70%)",
    catalogStatus: "Needs Review",
    lastUpdated: "May 20, 2025",
    tags: ["non-venomous", "pythonidae", "philippines"],
    recentActivity: [
      { timestamp: "May 20, 2025 · 10:30 AM", description: "Catalog Status updated to Cataloged", by: "Dr. Sarah Reyes" },
      { timestamp: "May 20, 2025 · 10:15 AM", description: "Catalog Status updated to Needs Review", by: "Dr. Sarah Reyes" },
    ],
  },
  {
    accessionNo: "USCBM-IN-2025-142",
    group: "insect",
    commonName: "Golden Birdwing",
    scientificName: "Troides rhadamantus",
    family: "Papilionidae",
    order: "Lepidoptera",
    collectionType: "Zoology - Entomology",
    dateCollection: "May 8, 2025",
    collector: "M. Santos",
    donor: "—",
    storageLocation: "Entomology Cabinet 004 - Drawer 2",
    condition: "Good",
    preservation: "Pinned, dry",
    catalogStatus: "Cataloged",
    lastUpdated: "May 19, 2025",
    tags: ["endemic", "protected", "philippines"],
    recentActivity: [
      { timestamp: "May 19, 2025 · 2:05 PM", description: "Image added", by: "Dr. Sarah Reyes" },
    ],
  },
  {
    accessionNo: "USCBM-MAM-2025-078",
    group: "mammal",
    commonName: "Philippine Deer",
    scientificName: "Rusa marianna",
    family: "Cervidae",
    order: "Artiodactyla",
    collectionType: "Zoology - Mammalogy",
    dateCollection: "Apr 30, 2025",
    collector: "R. Villanueva",
    donor: "DENR Region VII",
    storageLocation: "Mammalogy Cabinet 002",
    condition: "Fair",
    preservation: "Taxidermy mount",
    catalogStatus: "Draft",
    lastUpdated: "May 18, 2025",
    tags: ["vulnerable", "philippines"],
    recentActivity: [
      { timestamp: "May 18, 2025 · 9:40 AM", description: "Condition reviewed, downgraded to Fair", by: "Dr. Sarah Reyes" },
    ],
  },
  {
    accessionNo: "USCBM-MAR-2025-063",
    group: "marine",
    commonName: "Tiger Cowrie",
    scientificName: "Cypraea tigris",
    family: "Cypraeidae",
    order: "Littorinimorpha",
    collectionType: "Zoology - Marine Biology",
    dateCollection: "Apr 22, 2025",
    collector: "L. Fernandez",
    donor: "—",
    storageLocation: "Marine Glass Display 001",
    condition: "Good",
    preservation: "Dry shell",
    catalogStatus: "Cataloged",
    lastUpdated: "May 17, 2025",
    tags: ["shell", "philippines"],
    recentActivity: [
      { timestamp: "May 17, 2025 · 4:12 PM", description: "Specimen cataloged", by: "Dr. Sarah Reyes" },
    ],
  },
  {
    accessionNo: "USCBM-BOT-2025-051",
    group: "botany",
    commonName: "Texas Persimmon",
    scientificName: "Diospyros texana",
    family: "Ebenaceae",
    order: "Ericales",
    collectionType: "Botany",
    dateCollection: "Apr 15, 2025",
    collector: "J. Cruz",
    donor: "—",
    storageLocation: "Botany Cabinet 011",
    condition: "Good",
    preservation: "Pressed, mounted",
    catalogStatus: "Cataloged",
    lastUpdated: "May 16, 2025",
    tags: ["herbarium"],
    recentActivity: [
      { timestamp: "May 16, 2025 · 11:20 AM", description: "Taxonomy completed", by: "Dr. Sarah Reyes" },
    ],
  },
  {
    accessionNo: "USCBM-REP-2025-002",
    group: "reptile",
    commonName: "Texas Tortoise",
    scientificName: "Gopherus berlandieri",
    family: "Testudinidae",
    order: "Testudines",
    collectionType: "Zoology - Herpetology",
    dateCollection: "Apr 10, 2025",
    collector: "A. Dela Cruz",
    donor: "—",
    storageLocation: "Herpetology Room 2",
    condition: "Good",
    preservation: "Alcohol (70%)",
    catalogStatus: "Archived",
    lastUpdated: "May 15, 2025",
    tags: ["non-venomous", "testudinidae"],
    recentActivity: [
      { timestamp: "May 15, 2025 · 3:00 PM", description: "Archived after duplicate review", by: "Dr. Sarah Reyes" },
    ],
  },
  {
    accessionNo: "USCBM-IN-2025-143",
    group: "insect",
    commonName: "Atlas Moth",
    scientificName: "Attacus atlas",
    family: "Saturniidae",
    order: "Lepidoptera",
    collectionType: "Zoology - Entomology",
    dateCollection: "Apr 5, 2025",
    collector: "M. Santos",
    donor: "—",
    storageLocation: "Entomology Cabinet 004 - Drawer 3",
    condition: "Fair",
    preservation: "Pinned, dry",
    catalogStatus: "Needs Review",
    lastUpdated: "May 14, 2025",
    tags: ["philippines"],
    recentActivity: [
      { timestamp: "May 14, 2025 · 1:45 PM", description: "Flagged for possible duplicate", by: "Dr. Sarah Reyes" },
    ],
  },
  {
    accessionNo: "USCBM-MAM-2025-079",
    group: "mammal",
    commonName: "Tamandua",
    scientificName: "Tamandua mexicana",
    family: "Myrmecophagidae",
    order: "Pilosa",
    collectionType: "Zoology - Mammalogy",
    dateCollection: "Mar 28, 2025",
    collector: "R. Villanueva",
    donor: "—",
    storageLocation: "Mammalogy Cabinet 023",
    condition: "Poor",
    preservation: "Taxidermy mount",
    catalogStatus: "Needs Review",
    lastUpdated: "May 13, 2025",
    tags: ["donated"],
    recentActivity: [
      { timestamp: "May 13, 2025 · 10:00 AM", description: "Image added", by: "Dr. Sarah Reyes" },
    ],
  },
];
