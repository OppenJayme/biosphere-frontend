import { describe, expect, it } from "vitest";
import {
  activeSpecimenLotSchema,
  buildAssignableStorageUnitOptions,
  storageUnitSchema,
  type StorageUnit,
} from "./types";

const DATE = "2026-09-22T00:00:00.000Z";

function unit(overrides: Partial<StorageUnit>): StorageUnit {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    label: "Museum",
    unitType: "BUILDING",
    storageType: "GENERAL",
    size: null,
    parentId: null,
    holdsSpecimens: false,
    capacity: null,
    archivedAt: null,
    createdAt: DATE,
    updatedAt: DATE,
    ...overrides,
  };
}

describe("assignable storage-unit options", () => {
  it("requires the complete storage response contract", () => {
    const response = unit({});
    expect(storageUnitSchema.safeParse(response).success).toBe(true);

    const incomplete: Record<string, unknown> = { ...response };
    delete incomplete.parentId;
    expect(storageUnitSchema.safeParse(incomplete).success).toBe(false);
  });

  it("keeps only active specimen-holding units and builds hierarchy labels", () => {
    const roomId = "10000000-0000-4000-8000-000000000002";
    const cabinetId = "10000000-0000-4000-8000-000000000003";
    const archivedId = "10000000-0000-4000-8000-000000000004";

    expect(
      buildAssignableStorageUnitOptions([
        unit({}),
        unit({ id: roomId, label: "Room 1", unitType: "ROOM", parentId: unit({}).id }),
        unit({
          id: cabinetId,
          label: "Cabinet A",
          unitType: "CABINET",
          storageType: "DRY_STORAGE",
          parentId: roomId,
          holdsSpecimens: true,
        }),
        unit({
          id: archivedId,
          label: "Old Cabinet",
          unitType: "CABINET",
          holdsSpecimens: true,
          archivedAt: DATE,
        }),
      ]),
    ).toEqual([
      {
        id: cabinetId,
        label: "Museum / Room 1 / Cabinet A (CABINET · DRY_STORAGE)",
      },
    ]);
  });

  it("stops safely when malformed hierarchy data contains a cycle", () => {
    const firstId = "20000000-0000-4000-8000-000000000001";
    const secondId = "20000000-0000-4000-8000-000000000002";
    const options = buildAssignableStorageUnitOptions([
      unit({ id: firstId, label: "First", parentId: secondId, holdsSpecimens: true }),
      unit({ id: secondId, label: "Second", parentId: firstId }),
    ]);

    expect(options).toHaveLength(1);
    expect(options[0].id).toBe(firstId);
  });
});

describe("active specimen-lot response", () => {
  const response = {
    id: "30000000-0000-4000-8000-000000000001",
    specimenId: "30000000-0000-4000-8000-000000000002",
    storageUnitId: "30000000-0000-4000-8000-000000000003",
    conditionClass: "GOOD",
    quantity: 2,
    storageNotes: null,
    isActive: true,
    createdBy: "30000000-0000-4000-8000-000000000004",
    updatedBy: null,
    createdAt: DATE,
    updatedAt: DATE,
  };

  it("accepts an active created lot and rejects an inactive response", () => {
    expect(activeSpecimenLotSchema.safeParse(response).success).toBe(true);
    expect(
      activeSpecimenLotSchema.safeParse({ ...response, isActive: false }).success,
    ).toBe(false);
  });
});
