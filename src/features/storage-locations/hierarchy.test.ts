import { describe, expect, it } from "vitest";
import { buildStorageHierarchy, filterStorageUnits, storagePath } from "./hierarchy";
import type { StorageUnit } from "./types";

const unit = (id: string, label: string, parentId: string | null = null): StorageUnit => ({
  id,
  label,
  parentId,
  unitType: "Curator-defined unit",
  storageType: "Dry storage",
  size: null,
  holdsSpecimens: false,
  capacity: null,
  archivedAt: null,
  createdAt: "2026-09-24T00:00:00.000Z",
  updatedAt: "2026-09-24T00:00:00.000Z",
});

describe("storage hierarchy helpers", () => {
  it("builds and sorts a hierarchy from parent IDs", () => {
    const roots = buildStorageHierarchy([
      unit("00000000-0000-4000-8000-000000000003", "Drawer", "00000000-0000-4000-8000-000000000002"),
      unit("00000000-0000-4000-8000-000000000002", "Cabinet", "00000000-0000-4000-8000-000000000001"),
      unit("00000000-0000-4000-8000-000000000001", "Room"),
    ]);

    expect(roots).toHaveLength(1);
    expect(roots[0].label).toBe("Room");
    expect(roots[0].children[0].label).toBe("Cabinet");
    expect(roots[0].children[0].children[0].label).toBe("Drawer");
  });

  it("keeps missing-parent and cyclic records visible as safe roots", () => {
    const first = unit("00000000-0000-4000-8000-000000000001", "First", "00000000-0000-4000-8000-000000000002");
    const second = unit("00000000-0000-4000-8000-000000000002", "Second", first.id);
    const orphan = unit("00000000-0000-4000-8000-000000000003", "Orphan", "00000000-0000-4000-8000-000000000099");

    expect(buildStorageHierarchy([first, second, orphan]).map((node) => node.label)).toEqual([
      "First",
      "Orphan",
      "Second",
    ]);
  });

  it("searches curator-managed text fields and builds a finite breadcrumb", () => {
    const room = unit("00000000-0000-4000-8000-000000000001", "Research Room");
    const cabinet = {
      ...unit("00000000-0000-4000-8000-000000000002", "Cabinet A", room.id),
      storageType: "Wet collection",
    };

    expect(filterStorageUnits([room, cabinet], "wet")).toEqual([cabinet]);
    expect(storagePath([room, cabinet], cabinet.id).map((item) => item.label)).toEqual([
      "Research Room",
      "Cabinet A",
    ]);
  });
});
