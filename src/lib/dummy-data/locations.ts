// DUMMY DATA — placeholder for the Location page UI.
// Stands in for real backend responses. Once the NestJS API is up, replace with
// calls through `features/storage-locations/api.ts` -> `apiFetch` (see
// docs/frontend-architecture.md) and delete this file. The hierarchy SHAPE and
// restrictions themselves live in `location-rules.ts`, not here.

import type { DrawerSize, UnitType } from "./location-rules";

export type DrawerSpecimenRow = {
  specimen: string;
  accessionNo: string;
  scientificName: string;
  category: string;
  quantity: number;
  condition: "Good" | "Fair" | "Poor";
  status: "Cataloged" | "Draft" | "Needs Review";
  lastUpdated: string;
};

export type SpecimenGroup = {
  label: string;
  count: number;
};

export type LocationNode = {
  id: string;
  label: string;
  code: string;
  unitType: UnitType;
  /** What's stored here — a collection/section label, e.g. "Herpetology", "General Collections". */
  storageType?: string;
  lastAudit?: string;
  occupancyPct?: number;
  /** Cabinet-capacity (Room) or drawer-capacity (Cabinet) — see HIERARCHY_RULES sizeKind. */
  capacity?: number;
  drawerSize?: DrawerSize;
  specimenCount?: number;
  updatedAt?: string;
  children: LocationNode[];
  specimens?: DrawerSpecimenRow[];
  specimenGroups?: SpecimenGroup[];
};

function genericDrawers(cabinetCode: string, count: number, storageTypes: string[]): LocationNode[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return {
      id: `${cabinetCode}-D${n}`,
      label: `Drawer ${String(n).padStart(2, "0")}`,
      code: `${cabinetCode}-${String(n).padStart(2, "0")}`,
      unitType: "Drawer" as const,
      storageType: storageTypes[i % storageTypes.length],
      specimenCount: 60 + ((i * 37) % 200),
      drawerSize: "A1" as const,
      updatedAt: "May 4, 2024 · 3:10 PM",
      children: [],
    };
  });
}

function genericCabinets(roomCode: string, labels: [string, string][]): LocationNode[] {
  return labels.map(([letter, storageType], i) => {
    const code = `${roomCode}-${letter}`;
    const drawerCount = 4 + i;
    const drawers = genericDrawers(code, drawerCount, [storageType]);
    return {
      id: code,
      label: `Cabinet ${letter}`,
      code,
      unitType: "Cabinet" as const,
      storageType,
      occupancyPct: 30 + i * 15,
      capacity: drawerCount,
      specimenCount: drawers.reduce((sum, d) => sum + (d.specimenCount ?? 0), 0),
      updatedAt: "May 4, 2024 · 3:10 PM",
      children: drawers,
    };
  });
}

const drawer1Specimens: DrawerSpecimenRow[] = Array.from({ length: 7 }, () => ({
  specimen: "Tiger Beetle",
  accessionNo: "USCBM-IN-2025-1387",
  scientificName: "Cicindela aurulenta",
  category: "Beetle",
  quantity: 12,
  condition: "Good" as const,
  status: "Cataloged" as const,
  lastUpdated: "May 7, 2026 · 10:32 AM",
}));

const drawer1Groups: SpecimenGroup[] = [
  { label: "Beetles", count: 143 },
  { label: "Butterflies", count: 82 },
  { label: "Ants", count: 64 },
  { label: "Moths", count: 53 },
];

const cabinetADrawers: LocationNode[] = [
  {
    id: "SR-001-A-01",
    label: "Drawer 01",
    code: "SR-001-A-01",
    unitType: "Drawer",
    storageType: "Pinned Insects",
    specimenCount: 342,
    drawerSize: "A1",
    updatedAt: "May 7, 2024 · 10:32 AM",
    children: [],
    specimens: drawer1Specimens,
    specimenGroups: drawer1Groups,
  },
  { id: "SR-001-A-02", label: "Drawer 02", code: "SR-001-A-02", unitType: "Drawer", storageType: "Pinned Insects", specimenCount: 285, drawerSize: "A1", updatedAt: "May 6, 2024 · 2:18 PM", children: [] },
  { id: "SR-001-A-03", label: "Drawer 03", code: "SR-001-A-03", unitType: "Drawer", storageType: "Mixed Dry Specimens", specimenCount: 198, drawerSize: "A1", updatedAt: "May 5, 2024 · 9:05 AM", children: [] },
  { id: "SR-001-A-04", label: "Drawer 04", code: "SR-001-A-04", unitType: "Drawer", storageType: "Archived Samples", specimenCount: 154, drawerSize: "A2", updatedAt: "May 3, 2024 · 1:41 PM", children: [] },
  { id: "SR-001-A-05", label: "Drawer 05", code: "SR-001-A-05", unitType: "Drawer", storageType: "Botanical Samples", specimenCount: 128, drawerSize: "A2", updatedAt: "May 2, 2024 · 11:20 AM", children: [] },
  { id: "SR-001-A-06", label: "Drawer 06", code: "SR-001-A-06", unitType: "Drawer", storageType: "Soil Samples", specimenCount: 96, drawerSize: "A2", updatedAt: "May 1, 2024 · 4:00 PM", children: [] },
  { id: "SR-001-A-07", label: "Drawer 07", code: "SR-001-A-07", unitType: "Drawer", storageType: "Fungal Collections", specimenCount: 84, drawerSize: "A1", updatedAt: "Apr 30, 2024 · 9:15 AM", children: [] },
  { id: "SR-001-A-08", label: "Drawer 08", code: "SR-001-A-08", unitType: "Drawer", storageType: "Pinned Insects", specimenCount: 71, drawerSize: "A1", updatedAt: "Apr 29, 2024 · 3:30 PM", children: [] },
  { id: "SR-001-A-09", label: "Drawer 09", code: "SR-001-A-09", unitType: "Drawer", storageType: "Mixed Dry Specimens", specimenCount: 58, drawerSize: "A2", updatedAt: "Apr 28, 2024 · 10:05 AM", children: [] },
  { id: "SR-001-A-10", label: "Drawer 10", code: "SR-001-A-10", unitType: "Drawer", storageType: "Archived Samples", specimenCount: 29, drawerSize: "A2", updatedAt: "Apr 27, 2024 · 2:50 PM", children: [] },
];

export const LOCATIONS: LocationNode[] = [
  {
    id: "storage-room-1",
    label: "Storage Room 1",
    code: "SR-001",
    unitType: "Room",
    storageType: "Herpetology",
    lastAudit: "Apr 12, 2024",
    occupancyPct: 62,
    capacity: 3,
    updatedAt: "May 7, 2024 · 10:32 AM",
    children: [
      {
        id: "SR-001-A",
        label: "Cabinet A",
        code: "SR-001-A",
        unitType: "Cabinet",
        storageType: "General Collections",
        occupancyPct: 85,
        capacity: 10,
        updatedAt: "May 7, 2024 · 10:32 AM",
        children: cabinetADrawers,
      },
      {
        id: "SR-001-B",
        label: "Cabinet B",
        code: "SR-001-B",
        unitType: "Cabinet",
        storageType: "Vertebrate Zoology",
        occupancyPct: 54,
        capacity: 8,
        updatedAt: "May 6, 2024 · 2:18 PM",
        children: genericDrawers("SR-001-B", 8, ["Wet Preserved", "Skeletal", "Skin & Study"]),
      },
      {
        id: "SR-001-C",
        label: "Cabinet C",
        code: "SR-001-C",
        unitType: "Cabinet",
        storageType: "Botany",
        occupancyPct: 48,
        capacity: 6,
        updatedAt: "May 5, 2024 · 2:18 PM",
        children: genericDrawers("SR-001-C", 6, ["Herbarium Sheets", "Seed Samples"]),
      },
    ],
  },
  {
    id: "entomology-room",
    label: "Entomology Room",
    code: "EN-001",
    unitType: "Room",
    storageType: "Entomology",
    lastAudit: "Apr 10, 2024",
    occupancyPct: 57,
    capacity: 2,
    updatedAt: "May 4, 2024 · 3:10 PM",
    children: genericCabinets("EN", [
      ["001", "Pinned Insects"],
      ["002", "Spirit Collections"],
    ]),
  },
  {
    id: "marine-storage-room",
    label: "Marine Storage Room",
    code: "MAR-001",
    unitType: "Room",
    storageType: "Marine Biology",
    lastAudit: "Apr 8, 2024",
    occupancyPct: 41,
    capacity: 2,
    updatedAt: "May 2, 2024 · 1:00 PM",
    children: genericCabinets("MAR", [
      ["A", "Shells & Mollusks"],
      ["B", "Wet Specimens"],
    ]),
  },
  {
    id: "mammalogy-room",
    label: "Mammalogy Room",
    code: "MAM-001",
    unitType: "Room",
    storageType: "Mammalogy",
    lastAudit: "Apr 6, 2024",
    occupancyPct: 66,
    capacity: 2,
    updatedAt: "Apr 30, 2024 · 4:45 PM",
    children: genericCabinets("MAM", [
      ["A", "Taxidermy Mounts"],
      ["B", "Skeletal Reference"],
    ]),
  },
  {
    id: "botany-herbarium",
    label: "Botany Herbarium",
    code: "BOT-001",
    unitType: "Room",
    storageType: "Botany",
    lastAudit: "Apr 3, 2024",
    occupancyPct: 39,
    capacity: 1,
    updatedAt: "Apr 28, 2024 · 9:30 AM",
    children: genericCabinets("BOT", [["A", "Herbarium Sheets"]]),
  },
];

export type LocationActivityEntry = {
  description: string;
  by: string;
  timestamp: string;
};

export const LOCATION_RECENT_ACTIVITY: LocationActivityEntry[] = [
  { description: "Inventory check completed", by: "Dr. Emily Carter", timestamp: "May 7, 2024 · 10:32 AM" },
  { description: "Drawer 2 updated", by: "Dr. Emily Carter", timestamp: "May 6, 2024 · 2:18 PM" },
  { description: "Drawer 3 added specimens", by: "System", timestamp: "May 5, 2024 · 9:05 AM" },
];

export function findLocation(id: string, nodes: LocationNode[] = LOCATIONS): LocationNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findLocation(id, node.children);
    if (found) return found;
  }
  return null;
}

export function pathTo(id: string, nodes: LocationNode[] = LOCATIONS, trail: LocationNode[] = []): LocationNode[] | null {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === id) return nextTrail;
    const found = pathTo(id, node.children, nextTrail);
    if (found) return found;
  }
  return null;
}

export function flattenLocations(nodes: LocationNode[] = LOCATIONS): LocationNode[] {
  return nodes.flatMap((node) => [node, ...flattenLocations(node.children)]);
}

/** Specimen total for a node — its own count if set (leaf), otherwise summed from children. */
export function totalSpecimens(node: LocationNode): number {
  if (node.specimenCount !== undefined) return node.specimenCount;
  return node.children.reduce((sum, c) => sum + totalSpecimens(c), 0);
}

export function findParentOf(id: string): LocationNode | null {
  const path = pathTo(id);
  if (!path || path.length < 2) return null;
  return path[path.length - 2];
}
