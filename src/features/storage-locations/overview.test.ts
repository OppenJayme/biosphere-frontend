import { describe, expect, it } from "vitest";
import type { SpecimenLotHistoryEntry } from "../specimen-lots/types";
import { readableReason, recentActivity, specimenGroups, storageTotals } from "./overview";
import type { StorageInventoryItem, StorageMovement, StorageOccupancy, StorageUnit } from "./types";

const ids = {
  room: "00000000-0000-4000-8000-000000000001",
  cabinet: "00000000-0000-4000-8000-000000000002",
  drawerA: "00000000-0000-4000-8000-000000000003",
  drawerB: "00000000-0000-4000-8000-000000000004",
  drawerC: "00000000-0000-4000-8000-000000000005",
  archived: "00000000-0000-4000-8000-000000000006",
};

const unit = (id: string, label: string, parentId: string | null, archivedAt: string | null = null): StorageUnit => ({
  id,
  label,
  unitType: "Unit",
  storageType: "General",
  size: null,
  parentId,
  holdsSpecimens: parentId === ids.cabinet,
  capacity: null,
  archivedAt,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
});

const units = [
  unit(ids.room, "Storage Room 1", null),
  unit(ids.cabinet, "Cabinet A", ids.room),
  unit(ids.drawerA, "Drawer 01", ids.cabinet),
  unit(ids.drawerB, "Drawer 02", ids.cabinet),
  unit(ids.drawerC, "Drawer 03", ids.cabinet),
  unit(ids.archived, "Old Drawer", ids.cabinet, "2026-11-02T00:00:00.000Z"),
];

const occupancy: StorageOccupancy[] = [
  { id: ids.drawerA, label: "Drawer 01", capacity: 100, occupiedQuantity: 120, alertCount: 1 },
  { id: ids.drawerB, label: "Drawer 02", capacity: 100, occupiedQuantity: 30, alertCount: 0 },
  // No capacity: counts toward specimens, but not toward occupancy.
  { id: ids.drawerC, label: "Drawer 03", capacity: null, occupiedQuantity: 50, alertCount: 0 },
];

describe("storageTotals", () => {
  const totals = storageTotals(units, occupancy);

  it("rolls specimens up through the active hierarchy", () => {
    expect(totals.get(ids.drawerA)?.specimens).toBe(120);
    expect(totals.get(ids.cabinet)?.specimens).toBe(200);
    expect(totals.get(ids.room)?.specimens).toBe(200);
    expect(totals.has(ids.archived)).toBe(false);
  });

  it("lists over-capacity units at and below a location", () => {
    expect(totals.get(ids.room)?.overCapacity).toEqual([
      { id: ids.drawerA, label: "Drawer 01", occupied: 120, capacity: 100 },
    ]);
    expect(totals.get(ids.drawerB)?.overCapacity).toEqual([]);
  });
});

describe("specimenGroups", () => {
  const item = (specimenId: string, category: string | null, quantity: number): StorageInventoryItem => ({
    lot: { id: crypto.randomUUID(), conditionClass: "Good", quantity, updatedAt: "2026-11-01T00:00:00.000Z" },
    specimen: {
      id: specimenId,
      accessionNumber: null,
      specimenCategory: category,
      scientificName: null,
      commonName: null,
      status: "CATALOGED",
    },
  });

  it("groups lots by category, largest first, counting distinct specimen records", () => {
    const a = "00000000-0000-4000-8000-0000000000a1";
    const b = "00000000-0000-4000-8000-0000000000b1";
    expect(
      specimenGroups([item(a, "Beetle", 10), item(a, "Beetle", 5), item(b, "Butterfly", 20), item(b, " ", 2)]),
    ).toEqual([
      { category: "Butterfly", quantity: 20, records: 1 },
      { category: "Beetle", quantity: 15, records: 1 },
      { category: "Uncategorized", quantity: 2, records: 1 },
    ]);
  });
});

describe("recentActivity", () => {
  const move: StorageMovement = {
    id: "00000000-0000-4000-8000-0000000000c1",
    storageUnitId: ids.drawerA,
    fromStorageUnitId: ids.room,
    toStorageUnitId: ids.cabinet,
    movedBy: "00000000-0000-4000-8000-0000000000d1",
    movedAt: "2026-11-03T00:00:00.000Z",
    reason: "Reorganised",
  };
  const lotMove = (id: string, at: string, from: string, to: string): SpecimenLotHistoryEntry => ({
    id,
    sourceLotId: null,
    targetLotId: null,
    transactionType: "MOVEMENT",
    quantityAffected: 4,
    adjustmentType: null,
    reason: null,
    performedBy: "00000000-0000-4000-8000-0000000000d1",
    createdAt: at,
    specimenId: null,
    performedByName: "Test Curator",
    fromStorageUnitId: from,
    toStorageUnitId: to,
    fromConditionClass: null,
    toConditionClass: null,
  });

  it("merges location moves and lot changes, newest first, with direction", () => {
    const activity = recentActivity(ids.drawerA, units, [move], [
      lotMove("00000000-0000-4000-8000-0000000000e1", "2026-11-04T00:00:00.000Z", ids.drawerB, ids.drawerA),
      lotMove("00000000-0000-4000-8000-0000000000e2", "2026-11-02T00:00:00.000Z", ids.drawerA, ids.drawerB),
    ]);
    expect(activity.map((entry) => [entry.title, entry.detail, entry.by])).toEqual([
      ["Specimen lot moved in", "4 specimens from Drawer 02", "Test Curator"],
      ["Location moved", "From Storage Room 1 to Cabinet A. Reorganised", null],
      ["Specimen lot moved out", "4 specimens to Drawer 02", "Test Curator"],
    ]);
  });

  it("names the kind of quantity adjustment", () => {
    const added: SpecimenLotHistoryEntry = {
      ...lotMove("00000000-0000-4000-8000-0000000000e3", "2026-11-05T00:00:00.000Z", ids.drawerA, ids.drawerA),
      transactionType: "QUANTITY_ADJUSTMENT",
      adjustmentType: "ADDITION",
      quantityAffected: 12,
    };
    expect(recentActivity(ids.drawerA, units, [], [added])[0]).toMatchObject({
      title: "Quantity adjustment: addition",
      detail: "12 specimens",
    });
  });

  it("keeps only the newest entries", () => {
    expect(recentActivity(ids.drawerA, units, [move], [], 0)).toEqual([]);
  });
});

describe("readableReason", () => {
  it("never shows a record id", () => {
    expect(readableReason("Imported from row 20 (batch 7147f44d-9fa7-4c78-90f1-76bb6bd83734)")).toBe(
      "Imported from row 20 of a spreadsheet import",
    );
    expect(readableReason("Moved after audit (ref 7147f44d-9fa7-4c78-90f1-76bb6bd83734) by request")).toBe(
      "Moved after audit by request",
    );
    expect(readableReason("See 7147F44D-9FA7-4C78-90F1-76BB6BD83734")).toBe("See");
    expect(readableReason("7147f44d-9fa7-4c78-90f1-76bb6bd83734")).toBeNull();
    expect(readableReason("Reorganised for the exhibit")).toBe("Reorganised for the exhibit");
    expect(readableReason(null)).toBeNull();
  });
});
