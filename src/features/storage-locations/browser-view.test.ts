/** Observable storage-browser projection; no API, React, or inventory collaborators are mocked. */
import { describe, expect, it } from "vitest";
import { storageBrowserHref, storageBrowserView } from "./browser-view";
import { buildStorageHierarchy, filterStorageUnits, storagePath } from "./hierarchy";
import type { StorageUnit } from "./types";

const room: StorageUnit = {
  id: "00000000-0000-4000-8000-000000000001",
  label: "Room", unitType: "Room", storageType: "Dry", parentId: null,
  holdsSpecimens: false, capacity: null, size: null, archivedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const cabinet: StorageUnit = {
  ...room, id: "00000000-0000-4000-8000-000000000002", label: "Archived cabinet",
  parentId: room.id, archivedAt: "2026-10-01T00:00:00.000Z",
};

describe("storage browser lifecycle view", () => {
  it("defaults to active locations even when the API returns an archive first", () => {
    const view = storageBrowserView([cabinet, room]);
    expect(view.showArchived).toBe(false);
    expect(view.visibleUnits.map(item => item.id)).toEqual([room.id]);
    expect(view.selected?.id).toBe(room.id);
  });

  it("keeps an explicit archived direct link readable and opens the historical view", () => {
    const view = storageBrowserView([room, cabinet], { selectedId: cabinet.id });
    expect(view.showArchived).toBe(true);
    expect(view.visibleUnits.map(item => item.id)).toEqual([room.id, cabinet.id]);
    expect(view.selected?.id).toBe(cabinet.id);
  });

  it("honors an explicit hide-archived choice even when the previous selection was archived", () => {
    const view = storageBrowserView([cabinet, room], { selectedId: cabinet.id, archived: "0" });
    expect(view.showArchived).toBe(false);
    expect(view.visibleUnits.map(item => item.id)).toEqual([room.id]);
    expect(view.selected?.id).toBe(room.id);
  });

  it("separates active and archived direct children regardless of archive visibility", () => {
    const active = { ...cabinet, id: "00000000-0000-4000-8000-000000000003", archivedAt: null };
    const view = storageBrowserView([room, cabinet, active], { selectedId: room.id, archived: "1" });
    expect(view.activeChildren.map(item => item.id)).toEqual([active.id]);
    expect(view.archivedChildren.map(item => item.id)).toEqual([cabinet.id]);
  });

  it("shows historical units only after an explicit include choice without a selected record", () => {
    const view = storageBrowserView([room, cabinet], { archived: "1" });
    expect(view.visibleUnits.map(item => item.id)).toEqual([room.id, cabinet.id]);
    expect(view.showArchived).toBe(true);
  });

  it("falls back to an active unit for an unknown selection and ignores unrecognized mode values", () => {
    const view = storageBrowserView([cabinet, room], { selectedId: "missing", archived: "unexpected" });
    expect(view.showArchived).toBe(false);
    expect(view.selected?.id).toBe(room.id);
  });

  it("leaves selection empty when every location is archived, so the historical toggle can be offered", () => {
    const view = storageBrowserView([cabinet]);
    expect(view.visibleUnits).toEqual([]);
    expect(view.selected).toBeUndefined();
    expect(view.activeChildren).toEqual([]);
    expect(storageBrowserView([cabinet], { archived: "1" }).selected?.id).toBe(cabinet.id);
    expect(storageBrowserView([]).selected).toBeUndefined();
  });

  it("keeps a legacy active child discoverable when its parent is archived, without losing historical context", () => {
    const child = { ...room, id: "00000000-0000-4000-8000-000000000003", label: "Active drawer", parentId: cabinet.id };
    const view = storageBrowserView([cabinet, child]);
    expect(buildStorageHierarchy(view.visibleUnits).map(item => item.id)).toEqual([child.id]);
    expect(storagePath([cabinet, child], child.id).map(item => item.id)).toEqual([cabinet.id, child.id]);
    expect(filterStorageUnits(view.visibleUnits, "ARCHIVED")).toEqual([]);
  });

  it("does not mutate API records or their order while sorting children for display", () => {
    const original = [cabinet, room];
    storageBrowserView(original, { selectedId: room.id, archived: "1" });
    expect(original.map(item => item.id)).toEqual([cabinet.id, room.id]);
    expect(cabinet.archivedAt).toBe("2026-10-01T00:00:00.000Z");
    expect(cabinet.parentId).toBe(room.id);
  });

  it("builds fixed internal navigation URLs with encoded selections and explicit visibility", () => {
    expect(storageBrowserHref(room.id, false)).toBe(`/storage?archived=0&selected=${room.id}`);
    expect(storageBrowserHref(undefined, true)).toBe("/storage?archived=1");
    expect(storageBrowserHref("id&archived=1", false)).toBe("/storage?archived=0&selected=id%26archived%3D1");
  });
});
